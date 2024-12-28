import express from 'express';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin } from '../controllers/authorizationController.js';
import { addSuspensionData, getSuspendedUsers } from '../controllers/suspentionController.js';

const suspentionRouter = express.Router();

suspentionRouter.get('/getUsers', verifyToken, verifyAdmin, getSuspendedUsers);

suspentionRouter.post('/addUser', verifyToken, verifyAdmin, addSuspensionData);

export default suspentionRouter;