import express from 'express';
import { addReview, getCourseRatings, getCourseReviews, getInstructorReviews, getMyReviews, getPendingReviews, updateReview } from '../controllers/reviewController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyInstructor, verifyStudent } from '../controllers/authorizationController.js';

const reviewRouter = express.Router();

// get reviews by courseId
reviewRouter.get('/ratings/:courseId', getCourseRatings);

// get reviews by studentId
reviewRouter.get('/my-reviews/:studentId',verifyToken, verifyActiveUser, verifyStudent, getMyReviews);

// get pending reviews by studentId
reviewRouter.get('/pending-reviews/:studentId',verifyToken, verifyActiveUser, verifyStudent, getPendingReviews);

// get course reviews by courseID
reviewRouter.get('/get/:courseId', getCourseReviews);

// get course reviews by instructorId.
reviewRouter.get('/instructor/:instructorId', verifyToken, verifyActiveUser, verifyInstructor, getInstructorReviews);

// add review by courseID.
reviewRouter.post('/add/:userId',verifyToken, verifyActiveUser, verifyStudent, addReview);

// update review by courseID.
reviewRouter.post('/update',verifyToken, verifyActiveUser, verifyStudent, updateReview);


export default reviewRouter; 