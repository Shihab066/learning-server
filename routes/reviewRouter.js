import express from 'express';
import { addReview, getCourseRatings, getCourseReviews, getInstructorReviews } from '../controllers/reviewController.js';

const reviewRouter = express.Router();
// get course ratings by courseID
reviewRouter.get('/ratings/:courseId', getCourseRatings);

// get course reviews by courseID
reviewRouter.get('/get/:courseId', getCourseReviews);

// get course reviews by instructorId. Should add Instructor verify
reviewRouter.get('/instructor/:instructorId', getInstructorReviews);

// add review by courseID. Add a logic to check if the user really enrolled the course
reviewRouter.post('/add', addReview);


export default reviewRouter; 