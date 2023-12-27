import {asyncHandler} from "../utills/asyncHandler.js";
import {ApiError} from "../utills/ApiError.js";

import {User} from "../models/User.Model.js";

import {uploadOnCloudinary} from "../utills/Cloudinary.js"

import { ApiResponse } from "../utills/ApiResponse.js";
import { Jwt } from "jsonwebtoken";
import { response } from "express";

//step5 login -
const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
       const refereshToken =  user.generateRefreshToken()

       user.refereshToken = refereshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refereshToken}
    } catch (error) {
        throw new ApiError(500, "something went wroung while generating referesh and sucess token")
    }

}

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
// login user-
const loginUser = asyncHandler(async(req, res)=>{
// step-1
    const {email, userName, password} = req.body
   // console.log(email)
    // step-2
        if (!userName && !email) {
        throw new ApiError(400, "username or email is required")
    }
    // step3-

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
        
    }
    // step4-
   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new ApiError(401, "password invalid")   
      }
// step5worktotal-
      const {accessToken, refereshToken} = await generateAccessAndRefereshTokens(user._id)

      // step6-

     const loggedInUser = await User.findById(user._id).
     select("-password -refereshToken")

     const options = {
        httpOnly: true,
        secure: true
     }
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refereshToken", refereshToken, options)

   // step7-
     .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refereshToken
            },
            "user logged In sucessfully"

        )
     )

    })

    const logoutUser = asyncHandler(async(req, res)=>{
       await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refereshToken: undefined
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true
         }
         return res
         .status(200)
         .clearCookie("accessToken", options)
         .clearCookie("refereshToken", options)
         .json(new ApiResponse(200, {}, "user logged out"))

    })

    const refereshAcessToken = asyncHandler(async(req,res)=>{
       const incomingRefereshToken = req.cookie.refereshToken || req.body.refereshToken

       if (!incomingRefereshToken) {
       throw new ApiError(401, "unauthorized request")
        
       }
      try {
        const decodedToken =  jwt.verify(
          incomingRefereshToken,
          process.env.REFRESH_TOKEN_SECRET
         )
  
        const user = await User.findById(decodedToken?._id)
  
        if (user) {
          throw new ApiError(401, "invalid request token")
           
          }
  
          if (incomingRefereshToken !== user?.refereshToken) {
              throw new ApiError(401, "referesh token is experied or used")
              
          }
  
          const options = {
              httpOnly: true,
              secure: true
          }
          const {accessToken,newRefereshToken} = await generateAccessAndRefereshTokens(user._id)
  
          return res
          .status(200)
          .cookie("accessToken", accessToken, options )
          .cookie("refereshToken", newRefereshToken, options)
          .json(
              new ApiResponse(
                  200,
                  {accessToken,refereshToken: newRefereshToken},
                  "Access Token refereshed"
              )
          )
      } catch (error) {
        throw new ApiError(401,error?.message || "invalid referesh Token")
        
      }
    })

    const changeCurrentPassword = asyncHandler(async(req, res) => {
        const {oldPassword, newPassword} = req.body
    
        
    
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password")
        }
    
        user.password = newPassword
        await user.save({validateBeforeSave: false})
    
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
    })
    
    
    const getCurrentUser = asyncHandler(async(req, res) => {
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
    })

    const updateAccountDetails = asyncHandler(async(req, res) => {
        const {fullName, email} = req.body
    
        if (!fullName || !email) {
            throw new ApiError(400, "All fields are required")
        }
    
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email: email
                }
            },
            {new: true}
            
        ).select("-password")
    
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
    });

    const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refereshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
   }

