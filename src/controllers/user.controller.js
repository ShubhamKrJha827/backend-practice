import {asyncHandler} from "../utills/asyncHandler.js";
import {ApiError} from "../utills/ApiError.js";

import {User} from "../models/User.Model.js";

import {uploadOnCloudinary} from "../utills/Cloudinary.js"

import { ApiResponse } from "../utills/ApiResponse.js";



const registerUser = asyncHandler( async (req, res ) => {
    // res.status(200).json({
    //     message: "ok"
    // })

// step1-
    const {fullName, userName, email, password} = req.body
    // console.log("email: ", email)

    // if (fullName === "") {
    //     throw new ApiError(400, "fullname is required")
        
    // } 
    // step2- 
    if ([fullName,userName,email,password].some((field)=>
        field?.trim()=== "")
        ) {
          throw new ApiError(400, "fullname is required")  
    }
 // step3-
    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
        
    }
// step4-
   const avatarLocalPath =  req.files?.avatar[0]?.path;
//    const coverImageLocalPath = req.files?.coverimage[0]?.path;
      let coverImageLocalPath;
       if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
         }

   if (!avatarLocalPath) {
    throw new ApiError (400,"Avater file is required")
    
   }
// step5-
   const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError (400,"Avater file is required")     
    }
  // step6-
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })
   // step7-
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
// step8-
   if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring a user")
    
   }
// step9-
   return res.status(201).json(
    new ApiResponse(200, createdUser,"user registred successfully")
   )
})


export {registerUser}
