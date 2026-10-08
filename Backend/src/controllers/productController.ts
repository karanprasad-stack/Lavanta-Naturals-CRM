import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProductModel } from '../models/Product.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { ProductActivityModel } from '../models/ProductActivity.js';
import { slugify } from '../utils/slug.js';
import { logProductActivity } from '../utils/inventoryNotifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Get all products with filters, search, and pagination
 */
export const getProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      category,
      page = '1',
      limit = '25',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.categoryId = category;
      }
    }

    // Search query across name, sku, brand, tags
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sorting
    const sortField = ['name', 'createdAt', 'sellingPrice'].includes(
      sortBy as string
    )
      ? (sortBy as string)
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .select('-stockQuantity -lowStockThreshold -status')
        .populate('categoryId', 'name description')
        .populate('createdBy', 'name email role')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      ProductModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
};

/**
 * Get single product by ID or slug
 */
export const getProductById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await ProductModel.findById(id)
        .select('-stockQuantity -lowStockThreshold -status')
        .populate('categoryId', 'name description')
        .populate('createdBy', 'name email role')
        .populate('documentIds', 'title fileName fileUrl fileType category');
    } else {
      product = await ProductModel.findOne({ slug: id.toLowerCase() })
        .select('-stockQuantity -lowStockThreshold -status')
        .populate('categoryId', 'name description')
        .populate('createdBy', 'name email role')
        .populate('documentIds', 'title fileName fileUrl fileType category');
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Retrieve recent product activities
    const recentActivities = await ProductActivityModel.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email role');

    res.status(200).json({
      success: true,
      data: {
        product,
        recentActivities
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details',
      error: error.message
    });
  }
};

/**
 * Create a new product (catalog only)
 */
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      name,
      sku,
      description,
      categoryId,
      brand,
      unit,
      sellingPrice,
      costPrice,
      tags = [],
      images = [],
      documentIds = []
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Product name is required' });
      return;
    }

    if (!sku || !sku.trim()) {
      res.status(400).json({ success: false, message: 'SKU is required' });
      return;
    }

    const cleanSku = sku.trim().toUpperCase();
    const existingSku = await ProductModel.findOne({ sku: cleanSku });
    if (existingSku) {
      res.status(409).json({
        success: false,
        message: `Product with SKU "${cleanSku}" already exists`
      });
      return;
    }

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ success: false, message: 'Valid category ID is required' });
      return;
    }

    const categoryExists = await ProductCategoryModel.findById(categoryId);
    if (!categoryExists) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const sPrice = Number(sellingPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      res.status(400).json({ success: false, message: 'Selling price must be >= 0' });
      return;
    }

    const cPrice = costPrice !== undefined ? Number(costPrice) : 0;
    if (isNaN(cPrice) || cPrice < 0) {
      res.status(400).json({ success: false, message: 'Cost price must be >= 0' });
      return;
    }

    // Generate unique slug
    let baseSlug = slugify(name.trim());
    if (!baseSlug) baseSlug = slugify(cleanSku);
    let uniqueSlug = baseSlug;
    let slugIndex = 1;
    while (await ProductModel.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${slugIndex++}`;
    }

    // Create product
    const product = await ProductModel.create({
      name: name.trim(),
      slug: uniqueSlug,
      sku: cleanSku,
      description: description ? description.trim() : '',
      categoryId,
      brand: brand ? brand.trim() : 'Lavanta Naturals',
      unit: unit || 'PIECE',
      sellingPrice: sPrice,
      costPrice: cPrice,
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      documentIds: Array.isArray(documentIds) ? documentIds : [],
      createdBy: user._id
    });

    // Log Activity
    await logProductActivity(product._id, user._id, 'PRODUCT_CREATED', {
      sku: product.sku,
      price: product.sellingPrice
    });

    await logAuditEvent(req, {
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product._id.toString(),
      metadata: { name: product.name, sku: product.sku, sellingPrice: product.sellingPrice }
    });

    const populatedProduct = await ProductModel.findById(product._id)
      .populate('categoryId', 'name description')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      categoryId,
      brand,
      unit,
      sellingPrice,
      costPrice,
      tags,
      images,
      documentIds
    } = req.body;

    const product = await ProductModel.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Validate SKU if changed
    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const cleanSku = sku.trim().toUpperCase();
      const existingSku = await ProductModel.findOne({
        _id: { $ne: id },
        sku: cleanSku
      });
      if (existingSku) {
        res.status(409).json({
          success: false,
          message: `Product with SKU "${cleanSku}" already exists`
        });
        return;
      }
      product.sku = cleanSku;
    }

    // Validate category if changed
    if (categoryId && categoryId.toString() !== product.categoryId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }
      const cat = await ProductCategoryModel.findById(categoryId);
      if (!cat) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      product.categoryId = categoryId;
    }

    if (name && name.trim()) {
      product.name = name.trim();
    }

    if (description !== undefined) product.description = description.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (unit !== undefined) product.unit = unit;

    if (sellingPrice !== undefined) {
      const sPrice = Number(sellingPrice);
      if (isNaN(sPrice) || sPrice < 0) {
        res.status(400).json({ success: false, message: 'Selling price must be >= 0' });
        return;
      }
      product.sellingPrice = sPrice;
    }

    if (costPrice !== undefined) {
      const cPrice = Number(costPrice);
      if (isNaN(cPrice) || cPrice < 0) {
        res.status(400).json({ success: false, message: 'Cost price must be >= 0' });
        return;
      }
      product.costPrice = cPrice;
    }

    if (tags !== undefined && Array.isArray(tags)) product.tags = tags;
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (documentIds !== undefined && Array.isArray(documentIds)) product.documentIds = documentIds;

    await product.save();

    // Log Activity
    await logProductActivity(product._id, user._id, 'PRODUCT_UPDATED', {
      updatedFields: Object.keys(req.body)
    });

    const updatedProduct = await ProductModel.findById(product._id)
      .populate('categoryId', 'name description')
      .populate('createdBy', 'name email role')
      .populate('documentIds', 'title fileName fileUrl fileType category');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

/**
 * Delete a product permanently
 */
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const product = await ProductModel.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await ProductModel.findByIdAndDelete(id);

    await logAuditEvent(req, {
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: id,
      metadata: { name: product.name, sku: product.sku }
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently.',
      action: 'DELETED'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};
