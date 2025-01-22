import express from 'express';
import { addFeedback, getAllFeedback, getFeedbackById, removeFeedback, updateFeedback } from '../controllers/feedbackController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyStudent } from '../controllers/authorizationController.js';

const feedbackRouter = express.Router();

feedbackRouter.get('/getAll', getAllFeedback);

// autorization needed
feedbackRouter.get('/get/:userId', verifyToken, verifyActiveUser, verifyStudent, getFeedbackById);

// autorization needed
feedbackRouter.post('/add', verifyToken, verifyActiveUser, verifyStudent, addFeedback);

// autorization needed
feedbackRouter.patch('/update', verifyToken, verifyActiveUser, verifyStudent, updateFeedback);

// autorization needed
feedbackRouter.delete('/delete/:userId', verifyToken, verifyActiveUser, verifyStudent, removeFeedback);

export default feedbackRouter;