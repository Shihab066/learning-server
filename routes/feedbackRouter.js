import express from 'express';
import { addFeedback, getAllFeedback, getFeedbackById, removeFeedback, updateFeedback } from '../controllers/feedbackController.js';

const feedbackRouter = express.Router();

feedbackRouter.get('/getAll', getAllFeedback);

// jwt verification and autorization needed
feedbackRouter.get('/get/:userId', getFeedbackById);

// jwt verification and autorization needed
feedbackRouter.post('/add', addFeedback);

// jwt verification and autorization needed
feedbackRouter.patch('/update', updateFeedback);

// jwt verification and autorization needed
feedbackRouter.delete('/delete/:userId', removeFeedback);

export default feedbackRouter;