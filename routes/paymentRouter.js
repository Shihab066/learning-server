import express from 'express';
import { createCheckoutSession, expireSession, getPaymentsData, retrieveCheckoutSession } from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.get('/retrieve-checkout-session/:token/:sessionId/:fakeToken', retrieveCheckoutSession);

// get all payments data by studentId
paymentRouter.get('/get/:studentId', getPaymentsData);

paymentRouter.post('/create-checkout-session', createCheckoutSession);

paymentRouter.post('/expire-session', expireSession);

export default paymentRouter;