import "dotenv/config";
import express from "express";
import userRouter from "./routes/user.router.js";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use("/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
