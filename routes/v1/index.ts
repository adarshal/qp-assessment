import express, { NextFunction, Request, Response } from "express";
import groceryRoutes from './groceryRoutes';

const router = express.Router()
console.log('v1 Router loaded');

//testing route
router.get("/v1",(req:Request,res:Response,next:NextFunction)=>{
    
    res.status(200).json({
        success:true,
        message:"Api v1 test route tested",
    });
    // return res.send("u")
});

router.use("/user", require("./users"));
router.use("/grocery", groceryRoutes);

module.exports= router;
