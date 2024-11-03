import express from 'express';
import { addWishListItem } from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', addWishListItem);

export default wishlistRouter;