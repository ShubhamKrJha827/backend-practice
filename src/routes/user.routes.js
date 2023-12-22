import { Router } from "express";
import { loginUser, logoutUser, registerUser, refereshAcessToken } from "../controllers/user.controller.js";
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


    
// router.route("/login").post(login)

export default router