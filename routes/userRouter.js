import express from 'express';

import { getSignupMethodById, getUserById, getUserRoleById, getUsers, updateInstructorProfileById, updateUserById, updateUserRoleById } from '../controllers/userController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const userRouter = express.Router();

// get user info by userId
userRouter.get('/get/:id', verifyToken, getUserById);

// get all users info by admin ID.
userRouter.get('/all/:adminId', verifyToken, verifyAdmin, getUsers);

// get signupMethod by user id
userRouter.get('/getSignupMethod/:id', getSignupMethodById);

//get user role by userId.
userRouter.get('/role/:id',verifyToken, getUserRoleById);

// update user info.
userRouter.patch('/update/:id', verifyToken, updateUserById);

// update instructor profile info.
userRouter.patch('/updateInstructorProfile/:id',verifyToken, verifyInstructor, updateInstructorProfileById);

//update user type/role.
userRouter.patch('/users/:id',verifyToken, verifyAdmin, updateUserRoleById);

export default userRouter;