import express from 'express';
import { getInstructorReviewsStatistics, getInstructorTotalSalesData, getTotalSalesData } from '../controllers/dashboardDataController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSalesData', verifyToken, verifyAdmin, getTotalSalesData);

// need authenticate + authorization
dashboardRouter.get('/instructor/getTotalSalesData/:instructorId', verifyToken, verifyInstructor, getInstructorTotalSalesData);

dashboardRouter.get('/instructor/getReviewsStatistics/:instructorId', getInstructorReviewsStatistics);

export default dashboardRouter;