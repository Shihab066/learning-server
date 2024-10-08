import express from "express";
import { generateToken } from "../controllers/jwtController.js";

const jwtRouter = express.Router();

//genarate JWT Token
jwtRouter.post('/get/token', generateToken);


export default jwtRouter;