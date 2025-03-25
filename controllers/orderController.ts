import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import { ErrorHandler } from "../utils/ErrorHandler";
import { Order, OrderItem, OrderStatus } from "../models/order";
import GroceryItem from "../models/groceryItem";
import { Op } from "sequelize";
import sequelize from "../utils/connection";

// Interface for order creation
interface IOrderItemInput {
  groceryItemId: number;
  quantity: number;
}

interface IOrderInput {
  items: IOrderItemInput[];
  deliveryAddress?: string;
  contactNumber?: string;
}

// Create a new order
export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, deliveryAddress, contactNumber } = req.body as IOrderInput;
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return next(new ErrorHandler("No items in order", 400));
      }

      // Get all grocery items in one query for efficiency
      const itemIds = items.map(item => item.groceryItemId);
      const groceryItems = await GroceryItem.findAll({
        where: { 
          id: { [Op.in]: itemIds },
          isAvailable: true
        }
      });

      // Validate all items exist and are available
      const groceryItemsMap = new Map(
        groceryItems.map(item => [item.id, item])
      );

      for (const item of items) {
        const groceryItem = groceryItemsMap.get(item.groceryItemId);
        
        if (!groceryItem) {
          return next(new ErrorHandler(`Grocery item with ID ${item.groceryItemId} not found or unavailable`, 404));
        }
        
        if (groceryItem.inventory < item.quantity) {
          return next(new ErrorHandler(`Not enough inventory for ${groceryItem.name}. Available: ${groceryItem.inventory}`, 400));
        }
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const groceryItem = groceryItemsMap.get(item.groceryItemId);
        if (groceryItem) {
          totalAmount += groceryItem.price * item.quantity;
        }
      }
      
      // Create order using transaction
      const result = await sequelize.transaction(async (t) => {
        // Create the order
        const order = await Order.create({
          userId,
          totalAmount,
          deliveryAddress,
          contactNumber,
          status: OrderStatus.PENDING
        }, { transaction: t });
        
        // Create order items
        const orderItems = [];
        for (const item of items) {
          const groceryItem = groceryItemsMap.get(item.groceryItemId);
          if (groceryItem) {
            // Create order item
            const orderItem = await OrderItem.create({
              orderId: order.id,
              groceryItemId: item.groceryItemId,
              quantity: item.quantity,
              price: groceryItem.price
            }, { transaction: t });
            
            orderItems.push(orderItem);
            
            // Update inventory
            await groceryItem.update({
              inventory: groceryItem.inventory - item.quantity,
              isAvailable: (groceryItem.inventory - item.quantity) > 0
            }, { transaction: t });
          }
        }
        
        return { order, orderItems };
      });
      
      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: result.order,
        orderItems: result.orderItems
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Get user orders
export const getUserOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const orders = await Order.findAll({
        where: { userId },
        include: {
          model: OrderItem,
          as: 'items',
          include: [{
            model: GroceryItem,
            attributes: ['id', 'name', 'imageUrl']
          }]
        },
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Get order details
export const getOrderDetails = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const order = await Order.findOne({
        where: { 
          id,
          userId  // Ensure user can only access their own orders
        },
        include: {
          model: OrderItem,
          as: 'items',
          include: [{
            model: GroceryItem,
            attributes: ['id', 'name', 'description', 'imageUrl']
          }]
        }
      });
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }
      
      return res.status(200).json({
        success: true,
        order
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Cancel order (if still pending)
export const cancelOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      // Find the order with its items
      const order = await Order.findOne({
        where: { 
          id,
          userId
        },
        include: {
          model: OrderItem,
          as: 'items'
        }
      });
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }
      
      // Can only cancel if order is pending
      if (order.status !== OrderStatus.PENDING) {
        return next(new ErrorHandler(`Cannot cancel order in '${order.status}' status. Only pending orders can be cancelled`, 400));
      }
      
      // Use transaction to update order and restore inventory
      await sequelize.transaction(async (t) => {
        // Update order status
        await order.update({ status: OrderStatus.CANCELLED }, { transaction: t });
        
        // Restore inventory for each item
        const items = order.get('items') as OrderItem[];
        for (const item of items) {
          const groceryItem = await GroceryItem.findByPk(item.groceryItemId, { transaction: t });
          if (groceryItem) {
            await groceryItem.update({
              inventory: groceryItem.inventory + item.quantity,
              isAvailable: true
            }, { transaction: t });
          }
        }
      });
      
      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// ----- ADMIN CONTROLLERS -----

// Get all orders (admin)
export const getAllOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      
      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }
      
      const orders = await Order.findAll({
        where: whereClause,
        include: {
          model: OrderItem,
          as: 'items',
          include: [{
            model: GroceryItem,
            attributes: ['id', 'name']
          }]
        },
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Update order status (admin)
export const updateOrderStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return next(new ErrorHandler("Invalid status value", 400));
      }
      
      const order = await Order.findByPk(id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }
      
      // If cancelling an order that was not cancelled before, restore inventory
      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        await sequelize.transaction(async (t) => {
          // Update order status
          await order.update({ status }, { transaction: t });
          
          // Get order items
          const orderItems = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction: t
          });
          
          // Restore inventory for each item
          for (const item of orderItems) {
            const groceryItem = await GroceryItem.findByPk(item.groceryItemId, { transaction: t });
            if (groceryItem) {
              await groceryItem.update({
                inventory: groceryItem.inventory + item.quantity,
                isAvailable: true
              }, { transaction: t });
            }
          }
        });
      } else {
        // Just update the status
        await order.update({ status });
      }
      
      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
); 