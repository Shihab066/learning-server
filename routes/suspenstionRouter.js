import express from 'express';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin } from '../controllers/authorizationController.js';
import { addSuspensionData } from '../controllers/suspentionController.js';

const suspentionRouter = express.Router();

suspentionRouter.post('/addUser', verifyToken, verifyAdmin, addSuspensionData);

export default suspentionRouter;