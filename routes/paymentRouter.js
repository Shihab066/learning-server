import express from 'express';
import { createCheckoutSession, expireSession, retrieveCheckoutSession } from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.get('/retrieve-checkout-session/:token/:sessionId/:useLessToken', retrieveCheckoutSession);

paymentRouter.post('/create-checkout-session', createCheckoutSession);

paymentRouter.post('/expire-session', expireSession);

export default paymentRouter;