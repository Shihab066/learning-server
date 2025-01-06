import express from 'express';
import { getTotalSalesChartInfo, getTotalSalesInfo } from '../controllers/dashboardDataController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSaleInfo', getTotalSalesInfo);

dashboardRouter.get('/admin/getTotalSalesChartInfo', getTotalSalesChartInfo);

export default dashboardRouter;