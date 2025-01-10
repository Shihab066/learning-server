import express from 'express';
import { getInstructorTotalSalesData, getTotalSalesData } from '../controllers/dashboardDataController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSalesData', getTotalSalesData);

// need authenticate + authorization
dashboardRouter.get('/instructor/getTotalSalesData/:instructorId', getInstructorTotalSalesData);

export default dashboardRouter;