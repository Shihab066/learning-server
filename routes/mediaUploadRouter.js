import express from 'express';
import { getSignature, getVideoUploadSignature } from '../controllers/mediaUploadController.js';
import { verifyToken } from '../controllers/jwtController.js';

const mediaUploadRouter = express.Router();

// get image upload singature.
mediaUploadRouter.get('/image/get-signature', verifyToken, getSignature);

// get video upload singature.
mediaUploadRouter.get('/video/get-signature', verifyToken, getVideoUploadSignature);


export default mediaUploadRouter;