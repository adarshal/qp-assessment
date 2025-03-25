import express from 'express';
import { isAuthenticated, authorizeRoles } from '../../middleware/auth';
import * as groceryItemController from '../../controllers/groceryItemController';
import * as orderController from '../../controllers/orderController';

const router = express.Router();
console.log('grocery order & management Router loaded');

// ===== Public routes =====
router.get('/items', groceryItemController.getAvailableGroceryItems);

// ===== User routes =====
// Orders
router.post('/orders', isAuthenticated, orderController.createOrder);
router.get('/orders', isAuthenticated, orderController.getUserOrders);
router.get('/orders/:id', isAuthenticated, orderController.getOrderDetails);
router.post('/orders/:id/cancel', isAuthenticated, orderController.cancelOrder);

router.get('/items/:id', isAuthenticated,  groceryItemController.getGroceryItemById);

// ===== Admin routes =====
// Grocery Items Management
router.post('/admin/items', isAuthenticated, authorizeRoles('admin'), groceryItemController.addGroceryItem);
router.get('/admin/items', isAuthenticated, authorizeRoles('admin'), groceryItemController.getAllGroceryItems);
router.get('/admin/items/:id', isAuthenticated, authorizeRoles('admin'), groceryItemController.getGroceryItemById);
router.put('/admin/items/:id', isAuthenticated, authorizeRoles('admin'), groceryItemController.updateGroceryItem);
router.put('/admin/items/:id/inventory', isAuthenticated, authorizeRoles('admin'), groceryItemController.updateInventory);
router.delete('/admin/items/:id', isAuthenticated, authorizeRoles('admin'), groceryItemController.deleteGroceryItem);

// Order Management
router.get('/admin/orders', isAuthenticated, authorizeRoles('admin'), orderController.getAllOrders);
router.put('/admin/orders/:id/status', isAuthenticated, authorizeRoles('admin'), orderController.updateOrderStatus);

export default router; 