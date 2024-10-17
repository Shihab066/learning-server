import express from 'express';
import { getInstructor, getInstructors, getPopularInstructors } from '../controllers/instructorController.js';

const instructorRouter = express.Router();

//get instructor details by instructorId
instructorRouter.get('/details/:instructorId', getInstructor);

//get allInstructors Data
instructorRouter.get('/all', getInstructors);

//get popular Instructors Data
instructorRouter.get('/popular', getPopularInstructors);

export default instructorRouter;