const express = require("express");
const app = express();
const port = 3000;

const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());

const User = require("./models/User.js");
const Company = require("./models/Company.js");
const Expense = require("./models/Expense.js");
const ApprovalFlow = require("./models/ApprovalFlow.js");

const mongoose = require("mongoose");
const dbUrl = process.env.MONGODB_URL;
main()
  .then(() => {
    console.log("Connected to DB.");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
