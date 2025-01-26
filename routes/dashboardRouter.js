import express from 'express';
import { getInstructorCoursesStatistics, getInstructorReviewsStatistics, getInstructorTotalSalesData, getTotalSalesData } from '../controllers/dashboardDataController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const dashboardRouter = express.Router();
dashboardRouter.use(verifyToken, verifyActiveUser);

dashboardRouter.get('/admin/getTotalSalesData', verifyAdmin, getTotalSalesData);

dashboardRouter.get('/instructor/getTotalSalesData/:instructorId', verifyInstructor, getInstructorTotalSalesData);

dashboardRouter.get('/instructor/getReviewsStatistics/:instructorId', verifyInstructor, getInstructorReviewsStatistics);

dashboardRouter.get('/instructor/getCoursesStatistics/:instructorId', verifyInstructor, getInstructorCoursesStatistics);

export default dashboardRouter;