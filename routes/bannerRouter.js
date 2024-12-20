import express from 'express';
import { addBanner, deleteBanner, getAllBanner, updateBanner } from '../controllers/bannerController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin } from '../controllers/authorizationController.js';

const bannerRouter = express.Router();

bannerRouter.get('/get', getAllBanner);

// need admin verifcation
bannerRouter.post('/add', verifyToken, verifyAdmin, addBanner);

// need admin verifcation
bannerRouter.patch('/update',verifyToken, verifyAdmin, updateBanner);

// need admin verifcation
bannerRouter.delete('/delete/:bannerId',verifyToken, verifyAdmin, deleteBanner);

export default bannerRouter;