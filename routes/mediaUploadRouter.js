import express from 'express';
import { generateSignedUrl, getSignature, getVideoUploadSignature } from '../controllers/mediaUploadController.js';
import { verifyToken } from '../controllers/jwtController.js';

const mediaUploadRouter = express.Router();

// get image upload singature.
mediaUploadRouter.get('/image/get-signature', verifyToken, getSignature);

// get video upload singature.
mediaUploadRouter.get('/video/get-signature', verifyToken, getVideoUploadSignature);

// get video upload singature.
mediaUploadRouter.get('/video/get-signed-url/:publicId', generateSignedUrl);


export default mediaUploadRouter;