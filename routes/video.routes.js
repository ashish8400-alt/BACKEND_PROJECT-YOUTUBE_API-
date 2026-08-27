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



// 🔹 Update Video (No Video Change, Only Metadata & Thumbnail)
router.put("/update/:id", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoId = req.params.id;

    // Find Video
    let video = await Video.findById(`video/${videoId}`);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Ensure Only the Owner Can Update
    if (video.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // If new thumbnail provided, delete old one & upload new
    if (req.files && req.files.thumbnail) {
      await cloudinary.uploader.destroy(video.thumbnmailId); // Delete old thumbnail

      const thumbnailUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
        folder: "thumbnails",
      });

      video.thumbnmailUrl = thumbnailUpload.secure_url;
      video.thumbnmailId = thumbnailUpload.public_id;
    }

    // Update Fields
    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    video.tags = tags ? tags.split(",") : video.tags;

    await video.save();
    res.status(200).json({ message: "Video updated successfully", video });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



export default router;
