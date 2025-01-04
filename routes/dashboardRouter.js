import express from 'express';
import { getTotalSalesInfo } from '../controllers/dashboardDataController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/getTotalSaleInfo', getTotalSalesInfo);
export default dashboardRouter;