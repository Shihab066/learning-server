import express from "express";
import { addCourseToCart, deleteCartItem, getCartItemById } from '../controllers/cartController.js';
import { verifyToken } from "../controllers/jwtController.js";

const cartRouter = express.Router();

//get cart item by studentId.
cartRouter.get('/get/:studentId',verifyToken, getCartItemById);

//add cart item.
cartRouter.post('/add/:studentId',verifyToken, addCourseToCart);

// delete cart item by itemId.
cartRouter.delete('/delete/:id',verifyToken, deleteCartItem);

export default cartRouter;