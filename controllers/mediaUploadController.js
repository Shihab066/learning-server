import { v2 as cloudinary } from 'cloudinary';
// import crypto from 'crypto-js'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
});

export const getSignature = (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Generate signature for upload
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, upload_preset: process.env.IMAGE_UPLOAD_PRESET },
            cloudinary.config().api_secret
        );

        res.json({
            signature,
            timestamp,
            cloud_name: cloudinary.config().cloud_name,
            cloud_api: cloudinary.config().api_key,
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
            {
                timestamp,
                upload_preset: process.env.VIDEO_UPLOAD_PRESET
            },
            cloudinary.config().api_secret
        );

        res.json({
            signature,
            timestamp,
            cloud_name: cloudinary.config().cloud_name,
            cloud_api: cloudinary.config().api_key,
            upload_preset: process.env.VIDEO_UPLOAD_PRESET
        });
    } catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const generateSignedUrl = (req, res) => {
    const publicId = req.params.publicId;
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const url = cloudinary.url(publicId, {
        resource_type: 'video', // Since this is for a video
        type: 'authenticated',
        secure: true,
        sign_url: true,
        timestamp: timestamp,
        format: 'm3u8',
        streaming_profile: 'hd', // Supports adaptive streaming with CMAF
        // transformation: [
        //   {
        //     flags: 'hlsv3' // Forces HLS version 3 compatibility with modern players
        //   }
        // ]
    });
    res.send(url)
}