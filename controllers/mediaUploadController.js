import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { getVideoPlaylistCollection } from '../collections.js';
// import { usersCollection, videoPlaylistCollection } from '../collections.js';
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
            upload_preset: process.env.VIDEO_UPLOAD_PRESET,           
        });
    } catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const generateSignedUrl = (publicId) => {
    const url = cloudinary.url(publicId, {
        resource_type: 'video',
        type: 'authenticated',
        sign_url: true,
        format: 'm3u8',
        streaming_profile: 'auto',

    });
    return url;
}

export const addVideoPlaylist = async (req, res) => {
    const videoPlaylistCollection = await getVideoPlaylistCollection();
    const { publicId } = req.params;
    const videoUrl = generateSignedUrl(publicId);
    if (videoUrl) {
        const response = await axios.get(videoUrl);
        const signatureMatch = videoUrl.match(/s--([A-Za-z0-9_-]+)--/);
        const signature = signatureMatch ? signatureMatch[0] : null;
        const cloudinaryUrlPrefix = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/video/authenticated/${signature}/sp_auto/`;
        const regex = new RegExp(publicId, "g");
        let videoPlayList = response.data;
        videoPlayList = videoPlayList.replace(regex, `${cloudinaryUrlPrefix}${publicId}`);
        const playlist = {
            publicId,
            playlist: videoPlayList
        }
        const result = await videoPlaylistCollection.insertOne(playlist);
        res.send(result);
    }
};

export const getVideoPlayList = async (req, res) => {
    const videoPlaylistCollection = await getVideoPlaylistCollection();
    const { publicId } = req.params;
    const { playlist } = await videoPlaylistCollection.findOne({ publicId }, { projection: { playlist: 1 } });
    res.set('Content-Type', 'application/x-mpegURL');
    res.send(playlist);
};