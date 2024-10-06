import express from 'express';

import {getSignupMethodById, getUserById, getUserRoleById, getUsers, updateInstructorProfileById, updateUserById, updateUserRoleById} from '../controllers/userController.js';

const userRouter = express.Router();

// // get user info by user id. JWT verify need
userRouter.get('/:id', getUserById);

// get all users info. admin verify need
userRouter.get('/all', getUsers);

// get signupMethod by user id
userRouter.get('/getSignupMethod/:id', getSignupMethodById);

//get user role by id. should add JWT verification
userRouter.get('/role/:id', getUserRoleById);

// update user info. JWT verify need
userRouter.patch('/update/:id', updateUserById);

// update instructor profile info. JWT and Instructor verify need
userRouter.patch('/updateInstructorProfile/:id', updateInstructorProfileById);

//update user type/role. Admin verify need
userRouter.patch('/users/:id', updateUserRoleById);


export default userRouter;