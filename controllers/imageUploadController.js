export const getSignature = (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Generate signature for upload
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, upload_preset: process.env.UPLOAD_PRESET },
            cloudinary.config().api_secret
        );

        res.json({
            signature,
            timestamp,
            cloud_name: cloudinary.config().cloud_name,
            cloud_api: cloudinary.config().api_key,
            upload_preset: process.env.UPLOAD_PRESET
        });
    } catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};
