import express from "express";
import { generateToken, verifyAccessToken } from "../controllers/jwtController.js";

const jwtRouter = express.Router();

//genarate JWT Token
jwtRouter.post('/upload', generateToken);

// verify access token
jwtRouter.post('/verify', verifyAccessToken);


export default jwtRouter;