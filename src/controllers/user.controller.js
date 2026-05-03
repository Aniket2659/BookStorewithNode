import "dotenv/config";
import db from "../db/index.js";
import userTable from "../models/user.model.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

export const signup = async (req, res) => {
  try {
    let { firstName, lastName, email, password } = req.body;
    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim().toLowerCase();

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const nameRegex = /^[A-Za-z\s-]{2,50}$/;

    if (!nameRegex.test(firstName)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid first name" });
    }

    if (!nameRegex.test(lastName)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid last name" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));
    console.log(existingUser);
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // email verifiacation token

    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "15m",
    });

    console.log(verifyToken);

    const verifyLink = `http://localhost:${process.env.PORT}/user/verify-email?token=${verifyToken}`;

    await sendEmail(
      email,
      "Verify your email",
      `<h3>Click to verify:</h3><a href="${verifyLink}">${verifyLink}</a>`,
    );

    const [data] = await db
      .insert(userTable)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      })
      .returning({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
      });

    return res.status(201).json({
      success: true,
      message: "signup successfull please verify your email",
      data: data,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Server error at signup" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, decoded.email));

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // check already verified
    if (user[0].isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    // update user
    await db
      .update(userTable)
      .set({ isVerified: true })
      .where(eq(userTable.email, decoded.email));

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (!existingUser[0].email) {
      return res.status(400).json({
        success: false,
        message: "email does not exist",
      });
    }

    if (!existingUser[0].isVerified) {
      return res.status(400).json({
        success: false,
        message: "email is not verified",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser[0].password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const accessToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_KEY, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      success: true,
      message: "Login successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
