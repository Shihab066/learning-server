import express from 'express';
import { addNewCourse, deleteCourse, getAllApprovedCourses, getAllCourses, getInstructorCourse, getInstructorCourses, getTopCourses, updateCourseApprovedStatus, updateCourseById, updateCourseFeedback, updateCoursePublishStatus } from '../controllers/courseController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const courseRouter = express.Router();

//get topCourses Data. Need to add more filtering for better result
courseRouter.get('/top', getTopCourses);

//get all approved courses data
courseRouter.get('/all', getAllApprovedCourses);

//get all course data.
courseRouter.get('/all/admin',verifyToken, verifyAdmin, getAllCourses);

//get single course by instructor id.
courseRouter.get('/instructorCourse/:instructorId',verifyToken, verifyInstructor, getInstructorCourse);

//get all courses by instructor id.
courseRouter.get('/instructorCourses/:instructorId',verifyToken, verifyInstructor, getInstructorCourses);

//add new course.
courseRouter.post('/add',verifyToken, verifyInstructor, addNewCourse);

//update course data by courseId.
courseRouter.patch('/update',verifyToken, verifyInstructor, updateCourseById);

//update course publish status by courseId.
courseRouter.patch('/updatePublishStatus',verifyToken, verifyInstructor, updateCoursePublishStatus);

//update course feedback by courseId.
courseRouter.patch('/updatefeedback/:id',verifyToken, verifyAdmin, updateCourseFeedback);

//update course approved status by courseId.
courseRouter.patch('/status/:id',verifyToken, verifyAdmin, updateCourseApprovedStatus);

//delete course by courseId.
courseRouter.delete('/delete',verifyToken, verifyInstructor, deleteCourse);

export default courseRouter;