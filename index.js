const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {v4:uuidv4}=require("uuid")
const mongoClient = mongodb.MongoClient;

const URL = process.env.DB;
const SECRET = process.env.SECRET;

//const URL ="mongodb+srv://PRAKASH7708:<>@cluster0.2n5s99z.mongodb.net/?retryWrites=true&w=majority";
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

// let authenticate = function (req, res, next) {
//   //console.log(req.headers.authorization)
  
//  if(req.headers.authorization) {
//    try {
//     let verify = jwt.verify(req.headers.authorization, SECRET);
//     if(verify) {
//       req.userid = verify._id;
//       next();
//     } else {
//       res.status(401).json({ message: "Unauthorized1" });
//     }
//    } catch (error) {
//     res.json({ message: "🔒Please Login to Continue" });
//    }
//   } else {
//     res.status(401).json({ message: "Unauthorized3" });
//   }
// };

let mandatoryValues = function (req, res, next) {
  if(req.body){
    
    if(req.body.firstname){
       if(req.body.lastname){
          if(req.body.email){
              if(req.body.phone){
                  next();
              }else{
                res.status(401).json({ message: "Please enter your phonenumber" });
              }
          }else{
            res.status(401).json({ message: "Please enter your email" });
          }
       }else{
        res.status(401).json({ message: "Please enter your lasttname" });
       }
    }else{
      res.status(401).json({ message: "Please enter your firstname" });
    }
  }else{
    res.status(401).json({ message: "Please enter the values" });
  }

}
app.post("/register",mandatoryValues, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("marlo");

    const emailid = await db
      .collection("users")
      .findOne({ email: req.body.email });
      const phoneid = await db
      .collection("users")
      .findOne({ phone: req.body.phone });
      if(emailid){
        res.status(500).json({
          message: "the Emailid is already taken if you already registered please go to login page",
        });
       
      }else{

    if(phoneid){
      res.status(500).json({
        message: "the phone number is already taken...please enter another number",
      });
    }else{
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("users").insertOne(req.body);
    await connection.close();
    res.json({
      message: "Successfully Registered",
    });

  }}
  } catch (error) {
    res.status(500).json({
      message: "Error",
    });
  }
});

app.post("/login", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("marlo");
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        // const token = jwt.sign({ _id: user._id }, SECRET, { expiresIn: "1m" });
        const token = jwt.sign({ _id: user._id }, SECRET);
        res.status(200).json({
          message: "Successfully Logged In",
          token,
        });
      } else {
        res.json({
          message: "Password is incorrect",
        });
      }
    } else {
      res.json({
        message: "User not found Please sign in",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 3001);