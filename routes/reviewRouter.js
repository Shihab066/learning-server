import express from 'express';
import { addReview, getCourseRatings, getCourseReviews, getInstructorReviews, getMyReviews, getPendingReviews, updateReview } from '../controllers/reviewController.js';

const reviewRouter = express.Router();

// get reviews my studentId
reviewRouter.get('/my-reviews/:studentId', getMyReviews);

// get pending reviews my studentId
reviewRouter.get('/pending-reviews/:studentId', getPendingReviews);

// get course reviews by courseID
reviewRouter.get('/get/:courseId', getCourseReviews);

// get course reviews by instructorId. Should add Instructor verify
reviewRouter.get('/instructor/:instructorId', getInstructorReviews);

// add review by courseID. Add a logic to check if the user really enrolled the course
reviewRouter.post('/add', addReview);

// add review by courseID. Add a logic to check if the user really enrolled the course
reviewRouter.post('/update', updateReview);


export default reviewRouter; 