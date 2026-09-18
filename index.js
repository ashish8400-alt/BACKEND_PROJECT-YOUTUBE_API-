import express from "express";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import cors from "cors";

import { ConnectDB } from "./config/db.config.js";
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";

dotenv.config();

const app = express();

ConnectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

app.get("/health", (_req, res) => {
  res.send("Server is healthy");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/comment", commentRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is runing at http://localhost:${process.env.PORT}`);
});