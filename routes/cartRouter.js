import express from "express";
import { addCourseToCart, deleteCartItem, getCartItemById } from '../controllers/cartController.js';

const cartRouter = express.Router();

//get cart item by studentId. JWT verify need
cartRouter.get('/get/:studentId', getCartItemById);

//add cart item. JWT verify need
cartRouter.post('/add/:studentId', addCourseToCart);

// delete cart item by itemId. JWT verfiy need
cartRouter.delete('/delete/:id', deleteCartItem);

export default cartRouter;