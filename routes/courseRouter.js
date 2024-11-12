import express from 'express';
import { addNewCourse, deleteCourse, getAllApprovedCourses, getAllCourses, getCourseDetails, getInstructorCourse, getInstructorCourses, getMoreCourseByInstructor, getStudentCourses, getTopCourses, updateCourseApprovedStatus, updateCourseById, updateCourseFeedback, updateCoursePublishStatus } from '../controllers/courseController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyAdmin, verifyInstructor } from '../controllers/authorizationController.js';

const courseRouter = express.Router();

//get topCourses Data. Need to add more filtering for better result
courseRouter.get('/top', getTopCourses);

//get all approved courses data
courseRouter.get('/all', getAllApprovedCourses);

//get course details by courseID.
courseRouter.get('/details/:courseId', getCourseDetails);

//get all course data.
courseRouter.get('/all/admin', verifyToken, verifyAdmin, getAllCourses);

//get more course of instructor by instructorId.
courseRouter.get('/moreCourse/:instructorId', getMoreCourseByInstructor);

//get single course by query, query contain courseId and instructorId.
courseRouter.get('/instructorCourse', verifyToken, verifyInstructor, getInstructorCourse);

//get all instructor courses by instructorId.
courseRouter.get('/instructorCourses/:instructorId', verifyToken, verifyInstructor, getInstructorCourses);

// get student courses by studentId.
courseRouter.get('/studentCourses/:studentId', getStudentCourses)

//add new course.
courseRouter.post('/add', verifyToken, verifyInstructor, addNewCourse);

//update course data by query, query contain courseId and instructorId.
courseRouter.patch('/update', verifyToken, verifyInstructor, updateCourseById);

//update course publish status by query, query contain courseId and instructorId.
courseRouter.patch('/updatePublishStatus', verifyToken, verifyInstructor, updateCoursePublishStatus);

//update course feedback by courseId.
courseRouter.patch('/updatefeedback/:id', verifyToken, verifyAdmin, updateCourseFeedback);

//update course approved status by courseId.
courseRouter.patch('/status/:id', verifyToken, verifyAdmin, updateCourseApprovedStatus);

//delete course by query, query contain courseId and instructorId.
courseRouter.delete('/delete', verifyToken, verifyInstructor, deleteCourse);

export default courseRouter;