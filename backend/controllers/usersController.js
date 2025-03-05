import User from "../models/usersModel.js";
import bcrypt from "bcrypt";
import Profile from "../models/profileModel.js";
import ConnectionRequest from "../models/connectionsModel.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";

const convertUserDataToPDF = async (userData) => {
  const doc = new PDFDocument({ margin: 50 });

  // Generate a unique filename
  const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
  const stream = fs.createWriteStream("uploads/" + outputPath);
  doc.pipe(stream);

  // ✅ Centered "Resume" Title
  doc.fontSize(20).font("Helvetica-Bold").text("Resume", { align: "center" });
  doc.moveDown(1);

  // ✅ Profile Picture with Spacing
  if (userData.userId.profilePicture) {
    doc.image(`uploads/${userData.userId.profilePicture}`, {
      fit: [100, 100],
      align: "center",
    });
    doc.moveDown(8); // Add space after image
  }

  // ✅ About Section (Updated)
  if (userData.bio || userData.currentPost) {
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Draw horizontal line
    doc.moveDown(0.5);

    doc.fontSize(14).font("Helvetica-Bold").text("About:");
    doc.moveDown(0.3);

    if (userData.userId.name) {
      doc
        .fontSize(12)
        .fillColor("#2E86C1") // Blue for heading
        .font("Helvetica-Bold")
        .text("Name: ", { continued: true })
        .fillColor("black") // Reset color
        .font("Helvetica")
        .text(userData.userId.name)
        .moveDown(0.3);
    }

    if (userData.bio) {
      doc
        .fontSize(12)
        .fillColor("#E74C3C") // Red for heading
        .font("Helvetica-Bold")
        .text("Bio: ", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text(userData.bio)
        .moveDown(0.3);
    }

    if (userData.currentPost) {
      doc
        .fontSize(12)
        .fillColor("#27AE60") // Green for heading
        .font("Helvetica-Bold")
        .text("Current Position: ", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text(userData.currentPost)
        .moveDown(0.5);
    }
  }
  doc.moveDown(1);

  // ✅ Contact Info Section
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(14).font("Helvetica-Bold").text("Contact Info:");
  doc.moveDown(0.3);

  if (userData.userId.username)
    doc
      .fontSize(12)
      .fillColor("#3498DB")
      .font("Helvetica-Bold")
      .text("Username: ", { continued: true })
      .fillColor("black")
      .font("Helvetica")
      .text(userData.userId.username);
  if (userData.userId.email)
    doc
      .fontSize(12)
      .fillColor("#3498DB")
      .font("Helvetica-Bold")
      .text("Email: ", { continued: true })
      .fillColor("black")
      .font("Helvetica")
      .text(userData.userId.email);

  doc.moveDown(1);

  // ✅ Work Experience Section
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(14).font("Helvetica-Bold").text("Work Experience:");
  doc.moveDown(0.3);

  userData.pastWork.forEach((work) => {
    doc
      .fontSize(12)
      .fillColor("#8E44AD") // Purple for headings
      .font("Helvetica-Bold")
      .text(`Company: `, { continued: true })
      .fillColor("black")
      .font("Helvetica")
      .text(`${work.company} (${work.years})`);

    doc
      .fontSize(12)
      .fillColor("#8E44AD")
      .font("Helvetica-Bold")
      .text("Position: ", { continued: true })
      .fillColor("black")
      .font("Helvetica")
      .text(work.position)
      .moveDown(0.5);
  });

  doc.moveDown(1);

  // ✅ Education Section
  if (userData.education && userData.education.length > 0) {
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(14).font("Helvetica-Bold").text("Education:");
    doc.moveDown(0.3);

    userData.education.forEach((edu) => {
      doc
        .fontSize(12)
        .fillColor("#F39C12") // Orange for headings
        .font("Helvetica-Bold")
        .text("School: ", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text(edu.school);

      doc
        .fontSize(12)
        .fillColor("#F39C12")
        .font("Helvetica-Bold")
        .text("Degree: ", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text(edu.degree);

      doc
        .fontSize(12)
        .fillColor("#F39C12")
        .font("Helvetica-Bold")
        .text("Field of Study: ", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text(edu.fieldOfStudy)
        .moveDown(0.5);
    });

    doc.moveDown(1);
  }

  doc.end();
  return outputPath;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPass,
      username,
    });

    await newUser.save();

    const profile = new Profile({
      userId: newUser._id,
    });
    await profile.save();
    return res.json({ message: "User created" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User does not exists" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });

    const token = crypto.randomBytes(32).toString("hex");

    await User.updateOne({ _id: user._id }, { token });
    return res.json({ token: token });
  } catch (err) {
    console.log(`Some Error Occured:{err.message}`);
  }
};

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = req.file.filename;
    await user.save();

    return res.json({ message: "Profile picture updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;

    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, email } = newUserData;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser || String(existingUser._id) !== String(user._id)) {
        return res.status(400).json({ message: "User already exists" });
      }
    }
    Object.assign(user, newUserData);
    await user.save();
    return res.json({ message: "User updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.query;
    console.log(token);
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name email username profilePicture"
    );

    return res.json(userProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;
    const userProfile = await User.findOne({ token: token });

    if (!userProfile)
      return res.status(404).json({ message: "User not found" });

    const profile_to_update = await Profile.findOne({
      userId: userProfile._id,
    });

    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();

    return res.json({ message: "Profile updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name username email profilePicture"
    );

    return res.json({ profiles });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const downloadProfile = async (req, res) => {
  const user_id = req.query.id;

  const userProfile = await Profile.findOne({ userId: user_id }).populate(
    "userId",
    "name username email profilePicture"
  );

  let outputPath = await convertUserDataToPDF(userProfile);

  return res.json({ message: outputPath });
};

export const getUserProfileWithUsername = async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );

    return res.json({ profile: userProfile });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllConnectionRequests = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch sent requests (requests user has sent to others)
    const sentRequests = await ConnectionRequest.find({
      userId: user._id,
      status: "pending",
    }).populate("connectionId", "name username email profilePicture");

    // Fetch received requests (requests sent to the user)
    const receivedRequests = await ConnectionRequest.find({
      connectionId: user._id,
      status: "pending",
    }).populate("userId", "name username email profilePicture");

    // Fetch accepted connections
    const acceptedConnections = await ConnectionRequest.find({
      $or: [{ userId: user._id }, { connectionId: user._id }],
      status: "accepted",
    }).populate("userId connectionId", "name username email profilePicture");

    return res.json({ sentRequests, receivedRequests, acceptedConnections });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ Send Connection Request
export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const connectionUser = await User.findById(connectionId);
    if (!connectionUser)
      return res.status(404).json({ message: "Connection user not found" });

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    if (existingRequest)
      return res.status(400).json({ message: "Request already sent" });

    // Create new request
    const request = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
      status: "pending",
    });

    await request.save();
    return res.json({ message: "Request sent successfully", request });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ Accept or Reject Connection Request
export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;

  console.log("Received Accept Request:", req.body); // ✅ Debugging

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const connection = await ConnectionRequest.findById(requestId);
    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    // ✅ Ensure only "accepted" or "rejected" are valid
    if (action_type !== "accepted" && action_type !== "rejected") {
      return res
        .status(400)
        .json({ message: "Invalid action type", received: action_type });
    }

    connection.status = action_type; // ✅ Directly set "accepted" or "rejected"

    await connection.save();

    return res.json({
      message: `Request ${connection.status} successfully`,
      connection,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
