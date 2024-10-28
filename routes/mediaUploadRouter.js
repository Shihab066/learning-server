import express from 'express';
import { addVideoPlaylist, generateSignedUrl, getSignature, getVideoPlayList, getVideoUploadSignature } from '../controllers/mediaUploadController.js';
import { verifyToken } from '../controllers/jwtController.js';

const mediaUploadRouter = express.Router();

// get image upload singature.
mediaUploadRouter.get('/image/get-signature', verifyToken, getSignature);

// get video upload singature.
mediaUploadRouter.get('/video/get-signature', verifyToken, getVideoUploadSignature);

// get video link by publicId
mediaUploadRouter.get('/video/get/:publicId', getVideoPlayList);

// add video playlist by publicId
mediaUploadRouter.post('/video/add/:publicId', addVideoPlaylist);


export default mediaUploadRouter;