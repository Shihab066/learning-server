import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { getEnrollmentCollection, getUsersCollection, getVideoPlaylistCollection } from '../collections.js';

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
// export const generateSignedUrlToGetVideo = (req, res) => {
//     const { publicId } = req.params;
//     const segment = Math.floor(30 / 2);

//     const getRandomFloat = () => {
//         return (Math.random() * 0.50).toFixed(2);
//     };

//     const getRandomXYValue = () => {
//         return `x_${getRandomFloat()},y_${getRandomFloat()}`
//     }

//     const getRandomGravity = () => {
//         const positions = [`north_west,${getRandomXYValue()}`, `north_east,${getRandomXYValue()}`, `south_west,${getRandomXYValue()}`, `south_east,${getRandomXYValue()}`, `north,${getRandomXYValue()}`, `south,${getRandomXYValue()}`, `east,${getRandomXYValue()}`, `west,${getRandomXYValue()}`, "center"];
//         return positions[Math.floor(Math.random() * positions.length)];
//     };

//     const textOverlay = ({ text, start_offset, end_offset }) => {
//         const overlay = `text:Arial_16:${text},co_red/fl_layer_apply,g_${getRandomGravity()},so_${start_offset},eo_${end_offset}`;
//         return overlay
//     };

//     // Apply watermark transformations dynamically
//     const transformation = [
//         { overlay: textOverlay({ text: 'md.shihab066@gmail.com', start_offset: 0, end_offset: segment }) },
//         { overlay: textOverlay({ text: 'md.shihab066@gmail.com', start_offset: segment, end_offset: segment * 2 }) },
//         { overlay: textOverlay({ text: 'md.shihab066@gmail.com', start_offset: segment * 2, end_offset: segment * 3 }) },
//         { overlay: textOverlay({ text: 'md.shihab066@gmail.com', start_offset: segment * 3, end_offset: segment * 4 }) },
//         // {streaming_profile: 'hd'},
//     ];
//     const url = cloudinary.url(publicId, {
//         resource_type: 'video',
//         type: 'authenticated',
//         sign_url: true,
//         transformation: transformation,
//         format: 'm3u8',
//         // streaming_profile: 'hd',        

//     });

//     if (url) {
//         const modifiedUrl = url.split('.m3u8')[0];
//         res.set('Content-Type', 'application/x-mpegURL');
//         res.send(url)
//         // return modifiedUrl;
//     }
//     // return url;
//     // res.send(url)
// }

// old addVideoPlaylist
// export const addVideoPlaylist = async (req, res) => {
//     const videoPlaylistCollection = await getVideoPlaylistCollection();
//     const { publicId } = req.params;
//     const videoUrl = generateSignedUrl(publicId);
//     if (videoUrl) {
//         const response = await axios.get(videoUrl);
//         const signatureMatch = videoUrl.match(/s--([A-Za-z0-9_-]+)--/);
//         const signature = signatureMatch ? signatureMatch[0] : null;
//         const cloudinaryUrlPrefix = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/video/authenticated/${signature}/sp_auto/`;
//         const regex = new RegExp(publicId, "g");
//         let videoPlayList = response.data;
//         videoPlayList = videoPlayList.replace(regex, `${cloudinaryUrlPrefix}${publicId}`);
//         const playlist = {
//             publicId,
//             playlist: videoPlayList
//         }
//         const result = await videoPlaylistCollection.insertOne(playlist);
//         res.send(result);
//     }
// };

// New addVideoPlaylist
export const addVideoPlaylist = async (req, res) => {
    const videoPlaylistCollection = await getVideoPlaylistCollection();
    const { publicId, courseId } = req.params;
    const { duration } = req.body;
    const videoUrl = generateSignedUrl(publicId);
    if (videoUrl) {
        const response = await axios.get(videoUrl);       
        let videoPlayList = response.data;        
        const playlist = {
            courseId,
            publicId,
            duration,
            playlist: videoPlayList
        }
        const result = await videoPlaylistCollection.insertOne(playlist);
        res.send(result);
    }
};

export const getVideoPlayList = async (req, res) => {
    const usersCollection = await getUsersCollection();
    const enrollementCollection = await getEnrollmentCollection();
    const videoPlaylistCollection = await getVideoPlaylistCollection();

    const { publicId, courseId } = req.params;  //video ID

    const studentEmail = req.decoded.email;    
    const {_id: userId} = await usersCollection.findOne({ email: studentEmail }, { projection: { _id: 1 } });
    // const {courseId} = await videoPlaylistCollection.findOne({ publicId }, {projection: {courseId: 1}});

    const isEnrolled = await enrollementCollection.findOne({ userId, courseId });
    
    if (!isEnrolled) return res.status(403).json({error: true, message: 'Forbidden Access'});

    const videoUrl = generateSignedUrl(publicId).split('.m3u8')[0];
    
    if (videoUrl) {
        const { playlist } = await videoPlaylistCollection.findOne({ publicId }, { projection: { playlist: 1 } });

        const regex = new RegExp(publicId, "g");
        let videoPlayList = playlist;
        videoPlayList = videoPlayList.replace(regex, videoUrl);

        res.set('Content-Type', 'application/x-mpegURL');
        res.send(videoPlayList);
    }
};