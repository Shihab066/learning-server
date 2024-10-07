import express from 'express';
import { getInstructors, getPopularInstructors } from '../controllers/instructorController';

const instructorRouter = express.Router();

//get allInstructors Data
instructorRouter.get('/all', getInstructors);

//get popular Instructors Data
instructorRouter.get('/popular', getPopularInstructors);

export default instructorRouter;