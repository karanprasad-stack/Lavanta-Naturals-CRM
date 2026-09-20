import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { ProductModel } from '../models/Product.js';

export const getProductCategories = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, includeCounts } = req.query;

    const filter: any = {};
    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      filter.status = status;
    }

    const categories = await ProductCategoryModel.find(filter).sort({ name: 1 });

    if (includeCounts === 'true') {
      const categoryCounts = await ProductModel.aggregate([
        { $match: { status: { $ne: 'ARCHIVED' } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
      ]);

      const countMap = new Map<string, number>();
      categoryCounts.forEach((c: { _id: any; count: number }) => {
        if (c._id) countMap.set(c._id.toString(), c.count);
      });

      const data = categories.map(cat => ({
        ...cat.toObject(),
        productCount: countMap.get(cat._id.toString()) || 0
      }));

      res.status(200).json({ success: true, data });
      return;
    }

    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product categories',
      error: error.message
    });
  }
};

export const createProductCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, image, status } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const trimmedName = name.trim();
    const existing = await ProductCategoryModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Category with name "${trimmedName}" already exists`
      });
      return;
    }

    const category = await ProductCategoryModel.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      image: image || '',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Product category created successfully',
      data: category
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product category',
      error: error.message
    });
  }
};

export const updateProductCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, image, status } = req.body;

    const category = await ProductCategoryModel.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await ProductCategoryModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Another category with name "${trimmedName}" already exists`
        });
        return;
      }
      category.name = trimmedName;
    }

    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image;
    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) category.status = status;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Product category updated successfully',
      data: category
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product category',
      error: error.message
    });
  }
};

export const deleteProductCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await ProductCategoryModel.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const productCount = await ProductModel.countDocuments({
      categoryId: id,
      status: { $ne: 'ARCHIVED' }
    });

    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} active or inactive products belong to this category. Reassign them first.`
      });
      return;
    }

    await ProductCategoryModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product category deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product category',
      error: error.message
    });
  }
};
