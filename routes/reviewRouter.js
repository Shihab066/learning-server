import express from 'express';
import { addReview, getCourseReviews, getInstructorReviews } from '../controllers/reviewControllers';

const reviewRouter = express.Router();

// get course reviews by courseID
reviewRouter.get('/get/:courseId', getCourseReviews);

// get course reviews by instructorId. Should add Instructor verify
reviewRouter.get('/instructor/:instructorId', getInstructorReviews);

// add review by courseID. Add a logic to check if the user really enrolled the course
app.post('/add', addReview);


export default reviewRouter;