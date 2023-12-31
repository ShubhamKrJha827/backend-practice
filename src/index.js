// require('dotenv').config({path: './env'}) - is not suatbale code but true code .
import dotenv from "dotenv"
import connectDB from "./database/index.js";
import {app} from './app.js'


dotenv.config({
    path: './.env'
})

connectDB()


.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection faild !!! ",err);
})




// // 1st approach in db conection.
/*
import mongoose, { connect } from "mongoose";
import {DB_NAME} from "./constants";

/* 

import express from "express"
const app = express()


(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) =>{
            console.log("ERROr: ", error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listeing on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.error("ERROR: ",error)
        throw error
        
    }
})()

*/