import mongoose, { Schema } from "mongoose";

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  username: {
    type: String,
    rquired: true,
    unique: true,
  },
  email: {
    type: String,
    rquired: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  profilePicture: {
    type: String,
    default: "default.jpg",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("User", UserSchema);

export default User;
