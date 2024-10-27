import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { usersCollection, videoPlaylistCollection } from '../index.js';
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
    const { publicId } = req.params;
    const videoUrl = generateSignedUrl(publicId);
    let playlist = '';
    if (videoUrl) {
        const response = await axios.get(videoUrl);
        playlist = {
            publicId,
            playlist: response.data
        }
        const result = await videoPlaylistCollection.insertOne(playlist);
        res.send(result);
    }
}

export const getVideoPlayList = async (req, res) => {
    const { publicId } = req.params;
    const videoUrl = generateSignedUrl(publicId);
    const { playlist } = await videoPlaylistCollection.findOne({ publicId }, { projection: { playlist: 1 } });
    if (videoUrl) {
        const response = await axios.get(videoUrl);
        const videoData = {
            ...response,
            data: playlist
        }
        console.log(videoData);
        
    }
}

export const getTest = async (req, res) => {
    const cursor = usersCollection.find();
    const result = await cursor.toArray();
    res.send(result);
}