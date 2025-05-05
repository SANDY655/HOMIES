const express = require("express");
const cors = require("cors");
const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/user", userRouter);

connectDB().then(() => {
  app.listen(5000, () => {
    console.log("Server connected");
  });
});
