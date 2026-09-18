import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();


// For Signup
router.post("/signup", async (req, res) => {
  try {
    // console.log("request is coming");
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    console.log(hashedPassword);

    const uploadImage = await cloudinary.uploader.upload(
      req.files.logo.tempFilePath,
    );

    console.log("IMAGE 👉", uploadImage);

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      email: req.body.email,
      password: hashedPassword,
      channelName: req.body.channelName,
      phone: req.body.phone,
      logoUrl: uploadImage.secure_url,
      logoId: uploadImage.public_id,
    });

    let user = await newUser.save();

    res.status(201).json({
      user,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});

// For Login
router.post("/Login", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(
      req.body.password,
      existingUser.password,
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        _id: existingUser._id,
        channelName: existingUser.channelName,
        email: existingUser.email,
        phone: existingUser.phone,
        logoId: existingUser.logoId,
      },
      process.env.JWT_TOKEN,
      { expiresIn: "10d" },
    );

    res.status(200).json({
      _id: existingUser._id,
      channelName: existingUser.channelName,
      email: existingUser.email,
      phone: existingUser.phone,
      logoId: existingUser.logoId,
      logoUrl: existingUser.logoUrl,
      token: token,
      subscribers: existingUser.subscribers,
      subscribedChannels: existingUser.subscribedChannels,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});



// For Update Profile
router.put("/update-profile", checkAuth, async (req, res) =>{
  try{
   
    const {channelName, phone} = req.body;
    let updateData = {channelName, phone};

    //Handle profile picture update
    if(req.files && req.files.logo){
      const uploadImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath);
      updateData.logoUrl = uploadImage.secure_url;
      updateData.logoId = uploadImage.public_id;
    }

    const updateUser = await User.findByIdAndUpdate(req.user._id, updateData, {new: true});

    res.status(200).json({
      message: "Profile updated successfully",
      user: updateUser
    });
  }
  catch(error){
    console.error("Update Profile Error:", error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});


// For Subscribe to a channel
router.post("/subscribe", checkAuth, async(req,res)=>{
  try{
      const {channelId} = req.body;

      if(req.user._id.toString() === channelId){
          return res.status(400).json({error: "You cannot subscribe to your own channel"});
      }

       // Add the channel to user's subscribed channels
    await User.findByIdAndUpdate(req.user._id , {
      $addToSet: { subscribedChannels: channelId },
    });

    // Increment the subscriber count of the channel
    await User.findByIdAndUpdate(channelId, {
      $inc: { subscribers: 1 },
    });

    res.status(200).json({ message: "Subscribed successfully" });
  }
  catch(error){
console.error("Subscribe Error:",error);
res.status(500).json({error: "Something went wrong", message: error.message});
  }
})

export default router;
