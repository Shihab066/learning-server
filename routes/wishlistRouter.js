import express from 'express';
import { addWishListItem, getWishlistCourses, getWishListItems, removeWishListItem } from '../controllers/wishlistController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyStudent } from '../controllers/authorizationController.js';

const wishlistRouter = express.Router();
wishlistRouter.use(verifyToken, verifyActiveUser, verifyStudent);

// get wishlist by userId
wishlistRouter.get('/get/:userId', getWishListItems);

// get wishlist courses by wishlistItems
wishlistRouter.post('/courses', getWishlistCourses);

// add wishlist item
wishlistRouter.post('/add', addWishListItem);

// delete wishlist item by userId and courseId
wishlistRouter.delete('/delete/:userId/:courseId', removeWishListItem);

export default wishlistRouter;