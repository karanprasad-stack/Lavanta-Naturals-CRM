import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProductModel } from '../models/Product.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { InventoryMovementModel } from '../models/InventoryMovement.js';
import { ProductActivityModel } from '../models/ProductActivity.js';
import { slugify } from '../utils/slug.js';
import { logProductActivity, handleStockAlertNotifications } from '../utils/inventoryNotifications.js';
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
      stockStatus,
      status,
      page = '1',
      limit = '25',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Status filter - by default exclude ARCHIVED unless explicitly requested
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'ARCHIVED' };
    }

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

    // Stock status derived filter
    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        query.stockQuantity = 0;
      } else if (stockStatus === 'LOW_STOCK') {
        query.$expr = {
          $and: [
            { $gt: ['$stockQuantity', 0] },
            { $lte: ['$stockQuantity', '$lowStockThreshold'] }
          ]
        };
      } else if (stockStatus === 'IN_STOCK') {
        query.$expr = {
          $gt: ['$stockQuantity', '$lowStockThreshold']
        };
      }
    }

    // Sorting
    const sortField = ['name', 'createdAt', 'sellingPrice', 'stockQuantity'].includes(
      sortBy as string
    )
      ? (sortBy as string)
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
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
        .populate('categoryId', 'name description')
        .populate('createdBy', 'name email role')
        .populate('documentIds', 'title fileName fileUrl fileType category');
    } else {
      product = await ProductModel.findOne({ slug: id.toLowerCase() })
        .populate('categoryId', 'name description')
        .populate('createdBy', 'name email role')
        .populate('documentIds', 'title fileName fileUrl fileType category');
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Retrieve recent inventory movements
    const recentMovements = await InventoryMovementModel.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('performedBy', 'name email role');

    // Retrieve recent product activities
    const recentActivities = await ProductActivityModel.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email role');

    res.status(200).json({
      success: true,
      data: {
        product,
        recentMovements,
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
 * Create a new product with optional opening stock
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
      openingStock = 0,
      lowStockThreshold = 10,
      tags = [],
      images = [],
      documentIds = [],
      status = 'ACTIVE'
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

    const initialStock = Number(openingStock) || 0;
    if (initialStock < 0) {
      res.status(400).json({ success: false, message: 'Opening stock cannot be negative' });
      return;
    }

    const threshold = Number(lowStockThreshold) || 10;
    if (threshold < 0) {
      res.status(400).json({ success: false, message: 'Low stock threshold cannot be negative' });
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
      stockQuantity: initialStock,
      lowStockThreshold: threshold,
      status: status || 'ACTIVE',
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      documentIds: Array.isArray(documentIds) ? documentIds : [],
      createdBy: user._id
    });

    // If opening stock > 0, create OPENING_STOCK inventory movement
    if (initialStock > 0) {
      await InventoryMovementModel.create({
        productId: product._id,
        type: 'OPENING_STOCK',
        quantity: initialStock,
        previousQuantity: 0,
        newQuantity: initialStock,
        reason: 'Initial opening stock at product creation',
        reference: `INIT-${cleanSku}`,
        notes: `Recorded automatically on product initialization by ${user.name}`,
        performedBy: user._id,
        createdAt: new Date()
      });

      // Stock alerts if opening stock is low
      await handleStockAlertNotifications(product, 0, initialStock, user._id);
    }

    // Log Activity
    await logProductActivity(product._id, user._id, 'PRODUCT_CREATED', {
      sku: product.sku,
      initialStock,
      price: product.sellingPrice
    });

    await logAuditEvent(req, {
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product._id.toString(),
      metadata: { name: product.name, sku: product.sku, sellingPrice: product.sellingPrice, initialStock }
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
 * Update an existing product (strictly forbids direct stockQuantity modification)
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
      lowStockThreshold,
      tags,
      images,
      documentIds,
      status,
      stockQuantity // Explicitly ignored for safety
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

    if (lowStockThreshold !== undefined) {
      const threshold = Number(lowStockThreshold);
      if (isNaN(threshold) || threshold < 0) {
        res.status(400).json({ success: false, message: 'Low stock threshold must be >= 0' });
        return;
      }
      product.lowStockThreshold = threshold;
    }

    if (tags !== undefined && Array.isArray(tags)) product.tags = tags;
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (documentIds !== undefined && Array.isArray(documentIds)) product.documentIds = documentIds;
    if (status && ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      product.status = status;
    }

    // NOTICE: We deliberately ignore stockQuantity in this endpoint to maintain an unbroken audit trail.
    await product.save();

    // Log Activity
    await logProductActivity(product._id, user._id, 'PRODUCT_UPDATED', {
      updatedFields: Object.keys(req.body).filter(k => k !== 'stockQuantity')
    });

    const updatedProduct = await ProductModel.findById(product._id)
      .populate('categoryId', 'name description')
      .populate('createdBy', 'name email role')
      .populate('documentIds', 'title fileName fileUrl fileType category');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully (stock quantity preserved; use inventory movements to adjust stock)',
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
 * Delete or Archive a product.
 * If product has inventory movements, it is archived to preserve history.
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

    const movementCount = await InventoryMovementModel.countDocuments({ productId: id });

    if (movementCount > 0) {
      // Archive instead of hard delete
      product.status = 'ARCHIVED';
      await product.save();

      await logProductActivity(product._id, user._id, 'PRODUCT_ARCHIVED', {
        reason: 'Product archived because historical inventory movements exist',
        movementCount
      });

      res.status(200).json({
        success: true,
        message: 'Product archived successfully. Historical inventory movements have been preserved.',
        action: 'ARCHIVED',
        data: product
      });
      return;
    }

    // No movement history exists: safe to hard delete
    await ProductModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently.',
      action: 'DELETED'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete/archive product',
      error: error.message
    });
  }
};
