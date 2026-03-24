import { ExpressHandler } from '../../shared/types/express.type';
import * as ordersService from './orders.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const createOrder: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== 'user') {
      res.status(403).json({ message: 'Only users can create orders' });
      return;
    }

    const order = await ordersService.createOrder(user.id, req.body);
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: error.message || 'Failed to create order' });
  }
};

export const getMyOrders: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (user?.role === 'user') {
      const orders = await ordersService.getUserOrders(user.id);
      res.status(200).json({ orders });
    } else if (user?.role === 'establishment') {
      const orders = await ordersService.getEstablishmentOrders(user.id);
      res.status(200).json({ orders });
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrder: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const order = await ordersService.getOrderById(id!, user.id, user.role);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.status(200).json({ order });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ message: 'Forbidden' });
    } else {
      console.error('Error getting order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateStatus: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Status is required' });
      return;
    }

    const order = await ordersService.updateOrderStatus(id!, status, establishment.id);
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(400).json({ message: error.message || 'Failed to update status' });
  }
};
