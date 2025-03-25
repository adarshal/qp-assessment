import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import { ErrorHandler } from "../utils/ErrorHandler";
import GroceryItem from "../models/groceryItem";
import { Op } from "sequelize";

// Interface for grocery item creation/update
interface IGroceryItemInput {
  name: string;
  description: string;
  price: number;
  inventory: number;
  category: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

// ---------- ADMIN CONTROLLERS ----------

// Add new grocery item
export const addGroceryItem = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        name, 
        description, 
        price, 
        inventory, 
        category, 
        imageUrl,
        isAvailable 
      } = req.body as IGroceryItemInput;

      // Check if item with same name already exists
      const existingItem = await GroceryItem.findOne({ 
        where: { name: { [Op.like]: name } } 
      });

      if (existingItem) {
        return next(new ErrorHandler("Grocery item with this name already exists", 400));
      }

      // Create new grocery item
      const groceryItem = await GroceryItem.create({
        name,
        description,
        price,
        inventory,
        category,
        imageUrl,
        isAvailable: isAvailable ?? true
      });

      return res.status(201).json({
        success: true,
        message: "Grocery item added successfully",
        groceryItem
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Get all grocery items (admin view with filter options)
export const getAllGroceryItems = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        category, 
        isAvailable, 
        search, 
        minPrice, 
        maxPrice, 
        sortBy, 
        sortOrder 
      } = req.query;

      // Build filter conditions
      const whereClause: any = {};

      if (category) {
        whereClause.category = category;
      }

      if (isAvailable !== undefined) {
        whereClause.isAvailable = isAvailable === 'true';
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      if (minPrice) {
        whereClause.price = { 
          ...whereClause.price,
          [Op.gte]: parseFloat(minPrice as string)
        };
      }

      if (maxPrice) {
        whereClause.price = { 
          ...whereClause.price,
          [Op.lte]: parseFloat(maxPrice as string)
        };
      }

      // Build sort options
      const order: any = [];
      if (sortBy) {
        order.push([
          sortBy as string, 
          (sortOrder === 'desc' ? 'DESC' : 'ASC')
        ]);
      } else {
        order.push(['name', 'ASC']);
      }

      // Get grocery items with filters
      const groceryItems = await GroceryItem.findAll({
        where: whereClause,
        order
      });

      return res.status(200).json({
        success: true,
        count: groceryItems.length,
        groceryItems
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Get a single grocery item by ID
export const getGroceryItemById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const groceryItem = await GroceryItem.findByPk(id);
      
      if (!groceryItem) {
        return next(new ErrorHandler("Grocery item not found", 404));
      }
      
      return res.status(200).json({
        success: true,
        groceryItem
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Update grocery item
export const updateGroceryItem = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body as Partial<IGroceryItemInput>;
      
      const groceryItem = await GroceryItem.findByPk(id);
      
      if (!groceryItem) {
        return next(new ErrorHandler("Grocery item not found", 404));
      }
      
      // If updating name, check if name is already taken by another item
      if (updates.name && updates.name !== groceryItem.name) {
        const existingItem = await GroceryItem.findOne({ 
          where: { 
            name: updates.name,
            id: { [Op.ne]: id }
          } 
        });
        
        if (existingItem) {
          return next(new ErrorHandler("Another grocery item with this name already exists", 400));
        }
      }

      // Update the grocery item
      await groceryItem.update(updates);
      
      return res.status(200).json({
        success: true,
        message: "Grocery item updated successfully",
        groceryItem
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Update inventory levels
export const updateInventory = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { inventory } = req.body;
      
      if (inventory === undefined || isNaN(inventory) || inventory < 0) {
        return next(new ErrorHandler("Valid inventory value is required", 400));
      }
      
      const groceryItem = await GroceryItem.findByPk(id);
      
      if (!groceryItem) {
        return next(new ErrorHandler("Grocery item not found", 404));
      }
      
      await groceryItem.update({ 
        inventory,
        // Automatically update availability based on inventory
        isAvailable: inventory > 0
      });
      
      return res.status(200).json({
        success: true,
        message: "Inventory updated successfully",
        groceryItem
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Delete grocery item
export const deleteGroceryItem = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const groceryItem = await GroceryItem.findByPk(id);
      
      if (!groceryItem) {
        return next(new ErrorHandler("Grocery item not found", 404));
      }
      
      await groceryItem.destroy();
      
      return res.status(200).json({
        success: true,
        message: "Grocery item deleted successfully"
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// ---------- USER CONTROLLERS ----------

// Get available grocery items for users (only showing available items)
export const getAvailableGroceryItems = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, search, sortBy } = req.query;
      
      // Build filter conditions - only show available items
      const whereClause: any = {
        isAvailable: true,
        inventory: { [Op.gt]: 0 }
      };
      
      if (category) {
        whereClause.category = category;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Build sort options
      const order: any = [];
      if (sortBy === 'price_low') {
        order.push(['price', 'ASC']);
      } else if (sortBy === 'price_high') {
        order.push(['price', 'DESC']);
      } else {
        order.push(['name', 'ASC']);
      }
      
      // Get available grocery items
      const groceryItems = await GroceryItem.findAll({
        where: whereClause,
        order
      });
      
      return res.status(200).json({
        success: true,
        count: groceryItems.length,
        groceryItems
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
); 