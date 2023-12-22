import { ApiError } from "../utills/ApiError.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.Model.js";



export const verifyJWT = asyncHandler(async(req,res,next)=>{
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
    if (!token) {
     throw new ApiError(401, "unauthorized request")
     
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id).select("-password -refereshToken")
 
     if (!user) {
         throw ApiError(401, "invalid Access Token")
         
     }
 
     req.user = user;
     next()
   } catch (error) {
      throw new ApiError(401, error?.message || "invalid access token")
   }
}) 