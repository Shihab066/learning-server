import express from "express";
import { addCourseToCart, deleteCartItem, getCartCourses, getCartItems, updateCartItemStatus } from '../controllers/cartController.js';
import { verifyToken } from "../controllers/jwtController.js";

const cartRouter = express.Router();

//get cart item by userId.
cartRouter.get('/get/:userId', getCartItems);

//get cart courses by cartItems.
cartRouter.post('/courses', getCartCourses);

//add cart item.
cartRouter.post('/add', addCourseToCart);

//update cart item status.
cartRouter.patch('/patch/:userId/:courseId', updateCartItemStatus);

// delete cart item by userId and courseId.
cartRouter.delete('/delete/:userId/:courseId', deleteCartItem);

export default cartRouter; 