import { Router } from "express";
import {
  activeCheck,
  commentPost,
  createPost,
  deleteComment,
  deletePost,
  getAllPosts,
  getComments,
  incrementLikes,
} from "../controllers/postsController.js";
const router = Router();

import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
router.route("/").get(activeCheck);
router.route("/posts").get(getAllPosts);
router.route("/delete_post").delete(deletePost);
router.route("/comment").post(commentPost);
router.route("/get_comments").get(getComments);
router.route("/delete_comment").delete(deleteComment);
router.route("/increment_likes").post(incrementLikes);
router.route("/post").post(upload.single("media"), createPost);
export default router;
