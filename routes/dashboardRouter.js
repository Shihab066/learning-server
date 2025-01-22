import express from 'express';
import { getInstructorCoursesStatistics, getInstructorReviewsStatistics, getInstructorTotalSalesData, getTotalSalesData } from '../controllers/dashboardDataController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const dashboardRouter = express.Router();
dashboardRouter.use(verifyActiveUser);

dashboardRouter.get('/admin/getTotalSalesData', verifyToken, verifyAdmin, getTotalSalesData);

dashboardRouter.get('/instructor/getTotalSalesData/:instructorId', verifyToken, verifyInstructor, getInstructorTotalSalesData);

dashboardRouter.get('/instructor/getReviewsStatistics/:instructorId', verifyToken, verifyInstructor, getInstructorReviewsStatistics);

dashboardRouter.get('/instructor/getCoursesStatistics/:instructorId',verifyToken, verifyInstructor, getInstructorCoursesStatistics);

export default dashboardRouter;