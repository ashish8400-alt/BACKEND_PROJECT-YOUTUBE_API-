import express from "express";
import mongoose from "mongoose";

import Video from "../models/user.models.js";
import User from "../models/video.models.js";
import cloudinary from "../config/cloudinary.js";
import checkAuth from "../middleware/auth.middleware.js";

const router = express.Router();

// upload video

router.post("/upload", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!req.files || !req.files.thumbnail) {
      res.status(400).json({ error: "video and thumbnail are required" });
    }

    // Upload Video to Cloudinary
    const videoUpload = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "videos",
      },
    );

    // Upload Thumbnail to Cloudinary
    const thumbnailUpload = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        folder: "thumbnails",
      },
    );

    // Create Video Document
    const newVideo = new Video({
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      user_id: req.user._id,
      videoUrl: videoUpload.secure_url,
      videoId: videoUpload.public_id,
      thumbnailUrl: thumbnailUpload.secure_url,
      thumbnailId: thumbnailUpload.public_id,
      category,
      tags: tags ? tags.split(",") : [],
    });

    await newVideo.save();
    res
      .status(201)
      .json({ message: "Video uploaded successfully", video: newVideo });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});




export default router;
