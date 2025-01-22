import express from 'express';
import { addNewCourse, deleteCourse, getAllApprovedCourses, getAllCourses, getCourseContents, getCourseDetails, getEnrolledCoursesId, getInstructorCourse, getInstructorCourses, getMoreCourseByInstructor, getStudentCourses, getTopCourses, updateCourseApprovedStatus, updateCourseById, updateCourseFeedback, updateCourseFeedbackReadStatus, updateCourseProgress, updateCoursePublishStatus } from '../controllers/courseController.js';
import { verifyToken } from '../controllers/jwtController.js';
import { verifyActiveUser, verifyAdmin, verifyInstructor, verifyStudent } from '../controllers/authorizationController.js';

const courseRouter = express.Router();

//get topCourses Data. Need to add more filtering for better result
courseRouter.get('/top', getTopCourses);

//get all approved courses data
courseRouter.get('/all', getAllApprovedCourses);

//get course details by courseID.
courseRouter.get('/details/:courseId', getCourseDetails);

//get all course data.
courseRouter.get('/all/admin', verifyToken, verifyActiveUser, verifyAdmin, getAllCourses);

//get more course of instructor by instructorId.
courseRouter.get('/moreCourse/:instructorId', getMoreCourseByInstructor);

//get single course by query, query contain courseId and instructorId.
courseRouter.get('/instructorCourse', verifyToken, verifyActiveUser, verifyInstructor, getInstructorCourse);

//get all instructor courses by instructorId.
courseRouter.get('/instructorCourses/:instructorId', verifyToken, verifyActiveUser, verifyInstructor, getInstructorCourses);

// get student courses by studentId.
courseRouter.get('/studentCourses/:studentId', verifyToken, verifyActiveUser, verifyStudent, getStudentCourses)

// get student course contents by studentId and courseId.
courseRouter.get('/content/:studentId/:courseId', verifyToken, verifyActiveUser, verifyStudent, getCourseContents);

// get student enrolled courses id by studentId.
courseRouter.get('/enrolledCoursesId/:studentId', verifyToken, verifyActiveUser, verifyStudent, getEnrolledCoursesId);

//add new course.
courseRouter.post('/add', verifyToken, verifyActiveUser, verifyInstructor, addNewCourse);

//update course data by query, query contain courseId and instructorId.
courseRouter.patch('/update', verifyToken, verifyActiveUser, verifyInstructor, updateCourseById);

//update course publish status by query, query contain courseId and instructorId.
courseRouter.patch('/updatePublishStatus', verifyToken, verifyActiveUser, verifyInstructor, updateCoursePublishStatus);

//update course feedback by courseId.
courseRouter.patch('/updatefeedback/:id', verifyToken, verifyActiveUser, verifyAdmin, updateCourseFeedback);

//update course feedback read status by courseId.
courseRouter.patch('/updateFeedbackReadStatus/:id', verifyToken, verifyActiveUser, verifyInstructor, updateCourseFeedbackReadStatus);

//update course approved status by courseId.
courseRouter.patch('/status/:id', verifyToken, verifyActiveUser, verifyAdmin, updateCourseApprovedStatus);

// update student course progress info by studentId and courseId
courseRouter.patch('/update/progress/:studentId/:courseId',verifyToken, verifyActiveUser, verifyStudent, updateCourseProgress);

//delete course by query, query contain courseId and instructorId.
courseRouter.delete('/delete', verifyToken, verifyActiveUser, verifyInstructor, deleteCourse);

export default courseRouter;