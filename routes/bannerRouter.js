import express from 'express';
import { addBanner, deleteBanner, getAllBanner, getSliderImages, updateBanner } from '../controllers/bannerController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyAdmin } from '../controllers/authorizationController.js';

const bannerRouter = express.Router();

bannerRouter.get('/slider-images', getSliderImages);

bannerRouter.get('/get', verifyToken, verifyActiveUser, verifyAdmin, getAllBanner);

bannerRouter.post('/add', verifyToken, verifyActiveUser, verifyAdmin, addBanner);

bannerRouter.patch('/update/:bannerId', verifyToken, verifyActiveUser, verifyAdmin, updateBanner);

bannerRouter.delete('/delete/:bannerId', verifyToken, verifyActiveUser, verifyAdmin, deleteBanner);

export default bannerRouter;