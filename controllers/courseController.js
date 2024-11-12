import { ObjectId } from "mongodb";
// import { coursesCollection, reviewsCollection, usersCollection } from "../collections.js";
import { authorizeInstructor } from "./authorizationController.js";
import { getCoursesCollection, getEnrollmentCollection, getReviewsCollection, getUsersCollection } from "../collections.js";

export const getTopCourses = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const topCoursesPipeLine = [
            {
                $addFields: {
                    combinedScore: {
                        $add: [
                            { $multiply: ['$students', .6] }, // Weight students (60%)
                            { $multiply: [{ $add: ['$rating', '$totalReviews'] }, .3] }, // Weight rating + totalReviews (30%)
                            {
                                $multiply: [{
                                    $cond: {
                                        if: { $eq: ['$students', 0] },
                                        then: 0,
                                        else: { $divide: ['$courseCompleted', '$students'] }
                                    }
                                }, .1]
                            }, // Weight CourseCompletion rate (10%)
                        ]
                    }
                }
            },
            {
                $sort: { combinedScore: -1 }
            },
            {
                $project: {
                    courseName: 1,
                    courseThumbnail: 1,
                    instructorName: 1,
                    rating: 1,
                    totalReviews: 1,
                }
            },
            {
                $limit: 8
            }
        ]

        const courses = await coursesCollection?.aggregate(topCoursesPipeLine).toArray();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching top classes:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getAllApprovedCourses = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const sortValue = parseInt(req.query.sort);
        const searchValue = req.query.search !== "undefined" ? req.query.search : '';
        const skipDocument = (page - 1) * pageSize;
        const query = { courseName: { $regex: searchValue, $options: 'i' } };
        const options = {
            projection: {
                instructorName: 1,
                courseName: 1,
                courseThumbnail: 1,
                level: 1,
                rating: 1,
                totalReviews: 1,
                totalModules: 1,
                price: 1,
                discount: 1
            }
        }
        const cursor = coursesCollection.find(query, options)
            .skip(skipDocument)
            .limit(pageSize)
            .sort(sortValue ? { price: sortValue } : {});

        const coursesCount = await coursesCollection.countDocuments(query);
        const courses = await cursor.toArray();

        res.status(200).json({ courses, coursesCount });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getCourseDetails = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const coursesCollection = await getCoursesCollection();
        const reviewsCollection = await getReviewsCollection();
        const courseId = req.params.courseId;

        // Fetch course details with specified projection
        const courseDetailsOptions = {
            projection: {
                _id: 0,
                _instructorId: 1,
                courseName: 1,
                courseThumbnail: 1,
                summary: 1,
                description: 1,
                level: 1,
                category: 1,
                price: 1,
                discount: 1,
                students: 1,
                rating: 1,
                totalReviews: 1,
                courseContents: 1,
                totalModules: 1
            }
        };

        // Fetch instructor data with specified projection
        const instructorDataOptions = {
            projection: {
                _id: 0,
                name: 1,
                image: 1,
                headline: 1,
                experience: 1
            }
        };

        // Find the course by ID
        const courseData = await coursesCollection.findOne({ _id: new ObjectId(courseId) }, courseDetailsOptions);
        if (!courseData) {
            return res.status(404).json({ error: true, message: 'Course not found' });
        }

        const instructorId = courseData._instructorId;

        // Find the instructor by ID
        const instructorData = await usersCollection.findOne({ _id: instructorId }, instructorDataOptions);
        if (!instructorData) {
            return res.status(404).json({ error: true, message: 'Instructor not found' });
        }

        // Fetch total course count for the instructor
        const totalCoursesCount = await coursesCollection.countDocuments({ _instructorId: instructorId });

        // Fetch total review count for the instructor
        const totalReviewsCount = await reviewsCollection.countDocuments({ _instructorId: instructorId });

        // Helper function to format course contents
        const formatCourseContents = (contents) => {
            return contents?.map(({ milestoneName, milestoneDetails, milestoneModules }) => ({
                milestoneName,
                milestoneDetails,
                totalModules: milestoneModules?.length || 0
            }));
        };

        // Prepare formatted course data
        const formattedCourseData = {
            ...courseData,
            courseContents: formatCourseContents(courseData?.courseContents)
        };

        // Aggregate to find total students for the instructor
        const pipeline = [
            { $match: { _instructorId: instructorId } },
            { $group: { _id: null, totalStudents: { $sum: '$students' } } },
            { $project: { _id: 0, totalStudents: 1 } }
        ];
        const totalStudentsArray = await coursesCollection.aggregate(pipeline).toArray();
        const totalStudents = totalStudentsArray.length > 0 ? totalStudentsArray[0].totalStudents : 0;

        // Prepare instructor info
        const instructorInfo = {
            ...instructorData,
            totalCoursesCount,
            totalReviewsCount,
            totalStudents
        };

        // Final course details object
        const courseDetails = {
            ...formattedCourseData,
            ...instructorInfo
        };

        res.status(200).json(courseDetails);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courses = await coursesCollection.find().toArray();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getMoreCourseByInstructor = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const { instructorId } = req.params;
        const options = {
            projection: {
                courseName: 1,
                courseThumbnail: 1,
                level: 1,
                rating: 1,
                totalReviews: 1,
                totalModules: 1,
                price: 1,
                discount: 1
            }
        }
        const courses = await coursesCollection.find({ _instructorId: instructorId }, options).toArray();
        if (!courses) {
            return res.status(404).json({ error: true, message: 'No course found' });
        }
        res.status(200).json(courses);

    } catch (error) {
        console.log('Error fetching more course of instructor', error);
        res.status(500).json({ message: 'Internal server error', error: error.mesage });
    }
}

export const getInstructorCourse = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courseId = req.query.courseId;
        const instructorId = req.query.id;
        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);

        if (authorizeStatus === 200) {
            const query = { _id: new ObjectId(courseId) };
            const options = {
                projection: {
                    _instructorId: 1,
                    courseName: 1,
                    courseThumbnail: 1,
                    summary: 1,
                    description: 1,
                    level: 1,
                    category: 1,
                    price: 1,
                    discount: 1,
                    seats: 1,
                    courseContents: 1
                }
            };

            const course = await coursesCollection.findOne(query, options);

            if (course?._instructorId !== instructorId) {
                return res.status(403).json({ error: true, message: 'Forbidden Access' });
            }
            if (!course) {
                return res.status(404).json({ error: true, mesage: 'No Course Found' })
            }
            res.status(200).json(course);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorCourses = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const instructorId = req.params.instructorId;
        const searchValue = req.query.search || '';
        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);
        if (authorizeStatus === 200) {
            const query = { _instructorId: instructorId, courseName: { $regex: searchValue, $options: 'i' } };
            const options = {
                projection: {
                    _instructorId: 1,
                    courseName: 1,
                    courseThumbnail: 1,
                    price: 1,
                    discount: 1,
                    level: 1,
                    status: 1,
                    feedback: 1,
                    publish: 1,
                    rating: 1,
                    totalReviews: 1
                }
            };

            const courses = await coursesCollection.find(query, options).toArray();
            res.status(200).json(courses);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error fetching instructor's courses:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addNewCourse = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const newCourse = req.body;
        const modifiedCourse = {
            ...newCourse,
            students: 0,
            courseCompleted: 0,
            status: 'pending',
            feedback: '',
            rating: 0,
            totalReviews: 0
        };

        const result = await coursesCollection.insertOne(modifiedCourse);
        res.status(201).json({ message: "Course added successfully.", result });
    } catch (error) {
        console.error("Error adding new course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCourseById = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courseId = req.query.courseId;
        const instructorId = req.query.id;
        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);

        if (authorizeStatus === 200) {
            const updatedCourseData = req.body;
            const filter = { _id: new ObjectId(courseId) };
            const updateDoc = { $set: updatedCourseData };

            const result = await coursesCollection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "Course not found or no changes made." });
            }

            res.status(200).json({ message: "Course updated successfully.", result });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCoursePublishStatus = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courseId = req.query.courseId;
        const instructorId = req.query.id;
        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);
        if (authorizeStatus === 200) {
            const { publish } = req.body;
            const filter = { _id: new ObjectId(courseId) };
            const updateDoc = { $set: { publish } };

            const result = await coursesCollection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "Course not found or no changes made." });
            }

            res.status(200).json({ message: "Publish status updated successfully.", result });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error updating publish status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCourseFeedback = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const id = req.params.id;
        const { feedback } = req.body;

        if (!feedback) {
            return res.status(400).json({ message: "Feedback is required." });
        }

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { feedback } };

        const result = await coursesCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Class not found or no changes made." });
        }

        res.status(200).json({ message: "Feedback updated successfully.", result });
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCourseApprovedStatus = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courseId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required." });
        }

        const filter = { _id: new ObjectId(courseId) };
        const updateDoc = { $set: { status } };

        const result = await coursesCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Class not found or no changes made." });
        }

        res.status(200).json({ message: "Status updated successfully.", result });
    } catch (error) {
        console.error("Error updating class status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const coursesCollection = await getCoursesCollection();
        const courseId = req.query.courseId;
        const instructorId = req.query.id;
        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);

        if (authorizeStatus === 200) {
            const query = { _id: new ObjectId(courseId) };
            const course = await coursesCollection.findOne(query, { projection: { _instructorId: 1 } });

            if (course?._instructorId !== instructorId) {
                return res.status(403).json({ error: true, message: 'Forbidden Access' });
            }

            const result = await coursesCollection.deleteOne(query);
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Course not found. No course deleted" });
            }

            res.status(200).json({ message: "Course deleted successfully.", result });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getStudentCourses = async (req, res) => {
    try {
        const enrollmentCollection = await getEnrollmentCollection();
        const courseCollection = await getCoursesCollection();

        const { studentId } = req.params;

        const enrollmentCourseId = await enrollmentCollection.find({ userId: studentId }, { projection: { _id: 0, courseId: 1 } }).toArray();
        const courseIds = enrollmentCourseId.map(item => new ObjectId(item.courseId));

        const enrollmentCourses = await courseCollection.find(
            {
                _id: { $in: courseIds }
            },
            {
                projection: {
                    _id: 0,
                    courseName: 1,
                    courseThumbnail: 1,
                    instructorName: 1
                }
            }
        ).toArray();

        res.json(enrollmentCourses)

    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}