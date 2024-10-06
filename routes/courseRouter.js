import express from 'express';
import { addNewCourse, deleteCourse, getAllApprovedCourses, getAllCourses, getInstructorCourse, getInstructorCourses, getTopCourses, updateCourseApprovedStatus, updateCourseById, updateCourseFeedback, updateCoursePublishStatus } from '../controllers/courseController.js';

const courseRouter = express.Router();

//get topCourses Data. Need to add more filtering for better result
courseRouter.get('/top', getTopCourses);

//get all approved courses data
courseRouter.get('/all', getAllApprovedCourses);

//get all course data. Admin verify need
courseRouter.get('/all/admin', getAllCourses);

//get single course by instructor id. Instructor verify need
courseRouter.get('/instructorCourse/:instructorId', getInstructorCourse);

//get all courses by instructor id. Instructor verify need
courseRouter.get('/instructorCourses/:instructorId', getInstructorCourses);

//add new course. Instructor verify need
courseRouter.post('/add', addNewCourse);

//update course data by courseId. Instructor verify need
courseRouter.patch('/update', updateCourseById);

//upfate course publish status by courseId. Instructor verify need
courseRouter.patch('/updatePublishStatus', updateCoursePublishStatus);

//update course feedback by courseId. Admin verify need
courseRouter.patch('/updatefeedback/:id', updateCourseFeedback);

//update course approved status by courseId. Admin verify need
courseRouter.patch('/status/:id', updateCourseApprovedStatus);

//delete course by courseId. Instructor verify need
app.delete('/delete', deleteCourse);

export default courseRouter;