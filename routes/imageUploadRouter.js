import express from 'express';
import { v2 as cloudinary } from 'cloudinary';

const imageUploadRouter = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

// get image upload singature. JWT verify need
app.get('/get-signature', (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate signature for upload
    const signature = cloudinary.utils.api_sign_request(
        { timestamp: timestamp, upload_preset: process.env.UPLOAD_PRESET },
        cloudinary.config().api_secret
    );

    res.json({
        signature,
        timestamp,
        cloud_name: cloudinary.config().cloud_name,
        cloud_api: cloudinary.config().api_key,
        upload_preset: process.env.UPLOAD_PRESET
    });
});

export default imageUploadRouter;