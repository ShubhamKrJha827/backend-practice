import { Router } from "express";
import { 
   loginUser, 
   logoutUser, 
   registerUser, 
   refereshAcessToken,
   changeCurrentPassword, 
   getCurrentUser, 
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory

} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
// step1-
router.route("/register").post(
    upload.fields([
     {
        name: "avatar",
        maxCount: 1
     },
     {
        name: "coverimage",
        maxCount: 1

     }
    ]),
    registerUser)

    router.route("/login").post(loginUser)

    //secured routes
    router.route("/logout").post(verifyJWT, logoutUser)
    router.route("/referesh-token").post(refereshAcessToken)

    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    router.route("/current-user").get(verifyJWT, getCurrentUser)
    router.route("/update-account").patch(verifyJWT, updateAccountDetails)

   router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)

   router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
   router.route("/history").get(verifyJWT, getWatchHistory)


    
// router.route("/login").post(login)

export default router