import express from 'express';
import { addWishListItem, getWishlistCourses, getWishListItems, removeWishListItem } from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

// get wishlist by userId
wishlistRouter.get('/get/:userId', getWishListItems);

// add wishlist item
wishlistRouter.post('/add', addWishListItem);

// delete wishlist item by userId and courseId
wishlistRouter.delete('/delete/:userId/:courseId', removeWishListItem);

// get wishlist courses by wishlistItems
wishlistRouter.post('/courses', getWishlistCourses);


export default wishlistRouter;