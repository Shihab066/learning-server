import express from 'express';
import { addFeedback, getAllFeedback, getFeedbackById, removeFeedback, updateFeedback } from '../controllers/feedbackController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyStudent } from '../controllers/authorizationController.js';

const feedbackRouter = express.Router();

feedbackRouter.get('/getAll', getAllFeedback);

feedbackRouter.get('/get/:userId', verifyToken, verifyActiveUser, verifyStudent, getFeedbackById);

feedbackRouter.post('/add', verifyToken, verifyActiveUser, verifyStudent, addFeedback);

feedbackRouter.patch('/update', verifyToken, verifyActiveUser, verifyStudent, updateFeedback);

feedbackRouter.delete('/delete/:userId', verifyToken, verifyActiveUser, verifyStudent, removeFeedback);

export default feedbackRouter;