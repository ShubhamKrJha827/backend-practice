import  express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import  
import userRouter from './routes/user.routes.js'


// routes declaration
// app.use("/users",userRouter)
app.use("/api/v1/users",userRouter)

// http://localHost:8000/users/register  // run post man 
// http://localHost:8000/users/login
//http://localHost:8000/api/v1/users/login


export {app}