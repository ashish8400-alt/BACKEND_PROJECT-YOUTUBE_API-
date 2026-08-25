import express from "express";
import mongoose  from "mongoose";


import Video from "../models/user.models.js";
import User from "../models/video.models.js";
import cloudinary from "../config/cloudinary.js";



const router = express.Router();


router.post("/upload", async (req,res)=>{
    try {
      
    } catch (error) {
      console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
    }
})

export default router;