import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncError";
import { ErrorHandler } from "../utils/ErrorHandler";
import  jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user";
// import { redis } from "../utils/redis";


// to check authenticated user.
export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies)
    const access_token = req.cookies.access_token;
    if (!access_token){
      return next(new ErrorHandler("You are not logged in",400));
    }
    const decoded=await jwt.verify(access_token,process.env.ACCESS_TOKEN as string) as JwtPayload;
    if(!decoded){
        return next(new ErrorHandler("Invalid token",401));
    }
    // const user=await redis.get(decoded.id);
    const user = await User.findByPk(decoded.id);
    console.log(user, decoded.id, "****",access_token)
    if(!user){        
        return next(new ErrorHandler("User not found",400));
    }
    req.user=JSON.parse(JSON.stringify(user));
    next();   
  }
);

//validate user role
export const authorizeRoles=(...roles:string[])=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        //@ts-ignore
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this`,403));
                next()
                }
            }
        }
