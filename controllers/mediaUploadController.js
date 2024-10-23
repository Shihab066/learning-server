import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,    
    image_upload_api_key: process.env.IMAGE_UPLOAD_API_KEY,
    image_upload_api_secret_key: process.env.IMAGE_UPLOAD_SECRET_KEY,
    video_upload_api_key: process.env.VIDEO_UPLOAD_API_KEY,
    video_upload_api_secret_key: process.env.VIDEO_UPLOAD_SECRET_KEY,
});

export const getSignature = (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Generate signature for upload
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, upload_preset: process.env.IMAGE_UPLOAD_PRESET },
            cloudinary.config().image_upload_api_secret_key
        );

        res.json({
            signature,
            timestamp,
            cloud_name: cloudinary.config().cloud_name,
            cloud_api: cloudinary.config().image_upload_api_key,
            upload_preset: process.env.IMAGE_UPLOAD_PRESET
        });
    } catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getVideoUploadSignature = (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Generate signature for upload
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, upload_preset: process.env.VIDEO_UPLOAD_PRESET },
            cloudinary.config().video_upload_api_secret_key
        );

        res.json({
            signature,
            timestamp,
            cloud_name: cloudinary.config().cloud_name,
            cloud_api: cloudinary.config().video_upload_api_key,
            upload_preset: process.env.VIDEO_UPLOAD_PRESET
        });
    } catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};