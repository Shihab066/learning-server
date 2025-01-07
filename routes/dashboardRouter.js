import express from 'express';
import { getTotalSalesData } from '../controllers/dashboardDataController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSalesData', getTotalSalesData);

export default dashboardRouter;