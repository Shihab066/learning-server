import express from 'express';
import { addVideoPlaylist, getSignature, getVideoPlayList, getVideoUploadSignature } from '../controllers/mediaUploadController.js';
import { verifyToken, verifyTokenToGetVideoPlaylist } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyInstructor, verifyStudent } from '../controllers/authorizationController.js';

const mediaUploadRouter = express.Router();

// get image upload singature.
mediaUploadRouter.get('/image/get-signature', verifyToken, verifyActiveUser, getSignature);

// get video upload singature.
mediaUploadRouter.get('/video/get-signature', verifyToken, verifyActiveUser, verifyInstructor, getVideoUploadSignature);

// get video link by publicId. (todo verify if the user is enrolled the course before giving the )
mediaUploadRouter.get('/video/get/:publicId/:jwtToken', verifyTokenToGetVideoPlaylist, verifyActiveUser, verifyStudent, getVideoPlayList);

// add video playlist by publicId. (todo Add the course ID to the playlist so it can be used to verify if the user is enrolled in the course also made some change while adding the playlist dont make playlist with authenticate code as it may expire and need new code)
mediaUploadRouter.post('/video/add/:publicId/:courseId', addVideoPlaylist);

// mediaUploadRouter.get('/video/custom/:publicId', generateSignedUrlToGetVideo);
export default mediaUploadRouter;