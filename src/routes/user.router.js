import express from "express";
import { signup, signin, verifyEmail } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify-user", verifyEmail);
router.post("/signin", signin);

export default router;
