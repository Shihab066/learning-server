import { ObjectId } from "mongodb";
import { coursesCollection, reviewsCollection, usersCollection } from "../index.js";
import { authorizeInstructor } from "./authorizationController.js";

export const getTopCourses = async (req, res) => {
    try {
        const query = {};
        const options = { sort: { students: -1 } };

        const courses = await coursesCollection.find(query, options).limit(6).toArray();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching top classes:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getAllApprovedCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const sortValue = parseInt(req.query.sort);
        const searchValue = req.query.search !== "undefined" ? req.query.search : '';
        const skipDocument = (page - 1) * pageSize;
        const query = { status: 'approved', name: { $regex: searchValue, $options: 'i' } };

        const cursor = coursesCollection.find(query)
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
    const courseId = req.params.courseId;
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
        }
    }
    const instructorDataOptions = {
        projection: {
            _id: 0,
            name: 1,
            image: 1,
            headline: 1,
            experience: 1
        }
    }
    const courseData = await coursesCollection.findOne({ _id: new ObjectId(courseId) }, courseDetailsOptions);
    const instructorId = courseData?._instructorId
    const instructorData = await usersCollection.findOne({ _id: instructorId }, instructorDataOptions);
    const totalCoursesCount = await coursesCollection.countDocuments({ _instructorId: instructorId });
    const totalReviewsCount = await reviewsCollection.countDocuments({ _instructorId: instructorId });
    
    const formatCourseContents = (contents) => {
        return contents?.map(({ milestoneName, milestoneDetails, milestoneModules }) => ({
            milestoneName,
            milestoneDetails,
            totalModules: milestoneModules?.length
        }));
    }

    const formattedCourseData = {
        ...courseData,
        courseContents: formatCourseContents(courseData?.courseContents)
    };    

    // find total student with aggregate pipeline
    const pipeline = [
        { $match: { _instructorId: instructorId } },
        { $group: { _id: null, totalStudents: { $sum: '$students' } } },
        { $project: { _id: 0, totalStudents: 1 } }
    ];

    const totalStudentsArray = await coursesCollection.aggregate(pipeline).toArray();
    const totalStudents = totalStudentsArray.length > 0 ? totalStudentsArray[0].totalStudents : 0;

    const instructorInfo = {       
        ...instructorData,
        totalCoursesCount,
        totalReviewsCount,
        totalStudents

    }

    const courseDetails = {
        ...formattedCourseData,
        ...instructorInfo
    }
    res.send(courseDetails);
}

export const getAllCourses = async (req, res) => {
    try {
        const courses = await coursesCollection.find().toArray();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorCourse = async (req, res) => {
    try {
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
        const newCourse = req.body;
        const modifiedCourse = {
            ...newCourse,
            students: 0,
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
