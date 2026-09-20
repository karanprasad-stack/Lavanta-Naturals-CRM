import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { CustomerModel } from '../models/Customer.js';
import { OrderModel } from '../models/Order.js';

export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phone, address, city, state, pincode, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Customer name is required' });
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ success: false, message: 'Customer email is required' });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ success: false, message: 'Customer phone number is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if customer already exists with this email or phone
    let customer = await CustomerModel.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }]
    });

    if (customer) {
      // Update details if provided
      if (address) customer.address = address.trim();
      if (city) customer.city = city.trim();
      if (state) customer.state = state.trim();
      if (pincode) customer.pincode = pincode.trim();
      if (notes) customer.notes = notes.trim();
      await customer.save();

      res.status(200).json({
        success: true,
        message: 'Existing customer retrieved and updated',
        data: customer
      });
      return;
    }

    customer = await CustomerModel.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      notes: notes ? notes.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

export const getCustomers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { search, limit = '20' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const query: any = {};
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { city: regex }];
    }

    const customers = await CustomerModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    });
  }
};

export const getCustomerById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id);

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const recentOrders = await OrderModel.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        customer,
        recentOrders
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer details',
      error: error.message
    });
  }
};

export const updateCustomer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, state, pincode, notes } = req.body;

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    if (name && name.trim()) customer.name = name.trim();
    if (email && email.trim()) customer.email = email.trim().toLowerCase();
    if (phone && phone.trim()) customer.phone = phone.trim();
    if (address !== undefined) customer.address = address.trim();
    if (city !== undefined) customer.city = city.trim();
    if (state !== undefined) customer.state = state.trim();
    if (pincode !== undefined) customer.pincode = pincode.trim();
    if (notes !== undefined) customer.notes = notes.trim();

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};
