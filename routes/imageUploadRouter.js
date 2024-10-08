import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { getSignature } from '../controllers/imageUploadController.js';

const imageUploadRouter = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

// get image upload singature. JWT verify need
imageUploadRouter.get('/get-signature', getSignature);

export default imageUploadRouter;