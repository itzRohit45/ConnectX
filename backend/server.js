import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/postsRoute.js";
import userRoutes from "./routes/usersRoute.js";
dotenv.config();

const app = express();
const uri = process.env.MONGO_URI;
console.log(uri);

app.use(cors());
app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);
app.use(express.static("uploads"));

const start = async () => {
  const connectDb = await mongoose.connect(process.env.MONGO_URI);

  app.listen(9090, () => {
    console.log("Server is running on port 9090");
  });
};

start();
