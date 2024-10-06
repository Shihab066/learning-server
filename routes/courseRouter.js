import express from 'express';
import { addNewCourse, getAllApprovedCourses, getAllCourses, getInstructorCourse, getInstructorCourses, getTopCourses, updateCourseById, updateCoursePublishStatus } from '../controllers/courseController.js';

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

//update course data by id. Instructor verify need
courseRouter.patch('/update', updateCourseById);

// Update Course publish status by id. Instructor verify need
courseRouter.patch('/updatePublishStatus', updateCoursePublishStatus);



export default courseRouter;