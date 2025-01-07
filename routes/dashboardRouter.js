import express from 'express';
import { getTotalSalesAmountChartInfo, getTotalSalesChartInfo, getTotalSalesInfo } from '../controllers/dashboardDataController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSaleInfo', getTotalSalesInfo);

dashboardRouter.get('/admin/getTotalSalesChartInfo', getTotalSalesChartInfo);

dashboardRouter.get('/admin/getTotalSalesAmountChartInfo', getTotalSalesAmountChartInfo);

export default dashboardRouter;