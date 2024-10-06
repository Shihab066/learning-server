import { coursesCollection, usersCollection } from "../index.js";

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
        const instructorId = req.params.instructorId;

        const instructorEmail = await usersCollection.findOne(
            { _id: instructorId },
            { projection: { _id: 0, email: 1 } }
        );

        if (req.decoded.email !== instructorEmail?.email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const query = { _id: new ObjectId(courseId) };
        const options = {
            projection: {
                _instructorId: 1,
                courseName: 1,
                courseThumbnail: 1,
                shortDescription: 1,
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

        res.status(200).json(course);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.params.instructorId;
        const searchValue = req.query.search || '';

        const instructorEmail = await usersCollection.findOne(
            { _id: instructorId },
            { projection: { _id: 0, email: 1 } }
        );

        if (req.decoded.email !== instructorEmail?.email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

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

        const result = await classesCollection.insertOne(modifiedCourse);
        res.status(201).json({ message: "Course added successfully.", result });
    } catch (error) {
        console.error("Error adding new course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCourseById = async (req, res) => {
    try {
        const courseId = req.query.courseId;
        const id = req.query.id;

        const instructorEmail = await usersCollection.findOne(
            { _id: id },
            { projection: { _id: 0, email: 1 } }
        );

        if (req.decoded.email !== instructorEmail?.email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const updatedCourseData = req.body;
        const filter = { _id: new ObjectId(courseId) };
        const updateDoc = { $set: updatedCourseData };

        const result = await coursesCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Course not found or no changes made." });
        }

        res.status(200).json({ message: "Course updated successfully.", result });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCoursePublishStatus = async (req, res) => {
    try {
        const courseId = req.query.courseId;
        const instructorId = req.query.id;

        const instructorEmail = await usersCollection.findOne(
            { _id: instructorId },
            { projection: { _id: 0, email: 1 } }
        );

        if (req.decoded.email !== instructorEmail?.email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const { publish } = req.body;
        const filter = { _id: new ObjectId(courseId) };
        const updateDoc = { $set: { publish } };

        const result = await coursesCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Course not found or no changes made." });
        }

        res.status(200).json({ message: "Publish status updated successfully.", result });
    } catch (error) {
        console.error("Error updating publish status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
