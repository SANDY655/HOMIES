const express = require("express");
const { connectDB } = require("./connectDB");
const app = express();
app.use(express.json());

connectDB().then(() => {
  app.listen(5000, () => {
    console.log("Server connected");
  });
});
