import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs"; // For password hashing
import jwt, { JwtPayload } from "jsonwebtoken"; // For generating JWTs
import { catchAsyncError } from "../middleware/catchAsyncError";
import { ErrorHandler } from "../utils/ErrorHandler";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
// import {v2 as cloudinary} from 'cloudinary';
import User from "../models/user";
import { Op } from "sequelize";

// Register user - simplified without email activation
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const signup = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      
      // Check for existing user
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return next(new ErrorHandler("User already exists", 400));
      }
      
      // Create user directly without activation
      const user = await User.create({
        name,
        email,
        password, // password will be hashed by the model hook
      });

      // Return success without token (user needs to sign in)
      return res.status(201).json({
        success: true,
        message: "Account created successfully!",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const signin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(
          new ErrorHandler("Please provide an email and a password", 400)
        );
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: process.env.EXPIRESIN || "15m",
        }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: process.env.EXPIRESIN_REFRESH || "3d",
        }
      );

      // Set cookies
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      // Remove password from response
      const userResponse = { ...user.get(), password: undefined };

      res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: userResponse
      });
    } catch (err: any) {
      console.error(err);
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const logout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      
      res.status(200).json({ 
        success: true, 
        message: "Logged out successfully!" 
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update access token
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      if (!refresh_token) {
        return next(new ErrorHandler("Not authenticated!", 400));
      }
      
      const decoded = jwt.verify(
        refresh_token,
        process.env?.REFRESH_TOKEN as string
      ) as JwtPayload;
      
      if (!decoded || !decoded.id) {
        return next(new ErrorHandler("Invalid refresh token", 400));
      }
      
      // Find user from database instead of Redis
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: process.env.EXPIRESIN || "15m",
        }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: process.env.EXPIRESIN_REFRESH || "3d",
        }
      );
      
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);
      
      return res.status(200).json({
        success: true,
        accessToken
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get user profile
export const getUserProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      res.status(200).json({
        success: true,
        user
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Update user information
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as IUpdateUserInfo;
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const user = await User.findByPk(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Check if email exists if trying to update email
      if (email) {
        const isEmailExist = await User.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: userId } // Not equal to current user
          } 
        });
        
        if (isEmailExist) {
          return next(new ErrorHandler("This Email is already in use", 400));
        }
        
        user.email = email;
      }
      
      if (name) {
        user.name = name;
      }
      
      await user.save();
      
      // Return updated user without password
      const updatedUser = { ...user.get(), password: undefined };
      
      res.status(200).json({
        success: true,
        user: updatedUser
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Update password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const user = await User.findByPk(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check the current password
      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }

      // Update password (will be hashed by model hook)
      user.password = newPassword;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: "Password updated successfully"
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// Delete user
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      await user.destroy();
      
      res.status(200).json({ 
        success: true,
        message: "User deleted successfully" 
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
