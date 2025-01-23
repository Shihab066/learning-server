import express from 'express';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyAdmin } from '../controllers/authorizationController.js';
import { addSuspensionData, getSuspendedUsers, getSuspensionDetails, removeSuspension } from '../controllers/suspentionController.js';

const suspentionRouter = express.Router();

suspentionRouter.get('/getUsers', verifyToken, verifyActiveUser, verifyAdmin, getSuspendedUsers);

suspentionRouter.get('/details/:userId', verifyToken, getSuspensionDetails);

suspentionRouter.post('/addUser', verifyToken, verifyActiveUser, verifyAdmin, addSuspensionData);

suspentionRouter.delete('/remove/:userId/:suspendId', verifyToken, verifyActiveUser, verifyAdmin, removeSuspension);

export default suspentionRouter;