// import { reviewsCollection } from "../collections.js";

import { ObjectId } from "mongodb";
import { getCoursesCollection, getEnrollmentCollection, getReviewsCollection, getUsersCollection } from "../collections.js";

export const getCourseRatings = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const courseId = req.params.courseId;
        const query = { _courseId: courseId };
        const options = {
            projection: {
                _id: 0,
                rating: 1,
            }
        };

        const result = await reviewsCollection.find(query, options).toArray();
        const ratings = result?.map(rating => rating.rating);
        const totalRatings = ratings.length;
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(rating => {
            ratingCounts[rating]++;
        })

        const ratingPercentages = {};
        for (let rating in ratingCounts) {
            ratingPercentages[rating] = (ratingCounts[rating] / totalRatings) * 100;
        }

        res.status(200).json(ratingPercentages);
    } catch (error) {
        console.error("Error fetching course ratings:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getCourseReviews = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const courseId = req.params.courseId;
        const limit = parseInt(req.query.limit) || 3;
        const query = { _courseId: courseId };
        const options = {
            projection: {
                _id: 0,
                userName: 1,
                userImage: 1,
                rating: 1,
                date: 1,
                review: 1,
            }
        };

        const totalReviews = await reviewsCollection.countDocuments(query);
        const reviews = await reviewsCollection.find(query, options).limit(limit).toArray();

        res.status(200).json({ reviews, totalReviews });
    } catch (error) {
        console.error("Error fetching course reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorReviews = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const instructorId = req.params.instructorId;
        const searchValue = req.query.search || '';
        const limit = parseInt(req.query.limit) || 4;

        const query = {
            _instructorId: instructorId,
            $or: [
                { courseName: { $regex: searchValue, $options: 'i' } },
                { userName: { $regex: searchValue, $options: 'i' } }
            ]
        };

        const options = {
            projection: {
                _id: 0,
                userName: 1,
                userImage: 1,
                courseName: 1,
                rating: 1,
                date: 1,
                review: 1,
            }
        };

        const totalReviews = await reviewsCollection.countDocuments(query);
        const reviews = await reviewsCollection.find(query, options).limit(limit).toArray();

        res.status(200).json({ reviews, totalReviews });
    } catch (error) {
        console.error("Error fetching instructor reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addReview = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const usersCollection = await getUsersCollection();
        const classesCollection = await getCoursesCollection();
        const enrollmentCollection = await getEnrollmentCollection();
        const { courseId, courseName, courseThumbnail, studentId, userName, userImage, rating, review, } = req.body;

        const instructorId = await usersCollection.findOne({ _id: new ObjectId(courseId) }, { projection: { _instructorId: 1 } });
        const reviewData = {
            _courseId: courseId,
            _studentId: studentId,
            _instructorId: instructorId._instructorId,
            userName,
            userImage,
            rating,
            review,
            date: new Date(),
            courseName,
            courseThumbnail
        };

        const result = await reviewsCollection.insertOne(reviewData);

        // change state of reviewed to true
        await enrollmentCollection.updateOne({ courseId }, { $set: { reviewed: true } });

        const query = { _courseId: courseId };
        const options = { projection: { _id: 0, rating: 1 } };

        const ratings = await reviewsCollection.find(query, options).toArray();
        const ratingsArr = ratings.map(rating => rating.rating);

        const totalReviews = ratingsArr.length;
        const averageRating = totalReviews > 0 ? parseFloat((ratingsArr.reduce((acc, curr) => acc + curr, 0) / totalReviews).toFixed(1)) : 0;

        const filter = { _id: new ObjectId(courseId) };
        const updateCourseRating = {
            $set: {
                rating: averageRating,
                totalReviews
            }
        };

        await classesCollection.updateOne(filter, updateCourseRating);

        res.status(201).json(result);
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getMyReviews = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const { studentId } = req.params;

        const reviews = await reviewsCollection.find(
            {
                _studentId: studentId
            },
            {
                projection: {
                    _courseId: 1,
                    courseName: 1,
                    courseThumbnail: 1,
                    rating: 1,
                    review: 1,
                    date: 1,
                }
            }
        ).toArray();

        res.json(reviews)
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getPendingReviews = async (req, res) => {
    try {
        const enrollmentCollection = await getEnrollmentCollection();
        const { studentId } = req.params;

        const unratedCourses = await enrollmentCollection.find({ userId: studentId, reviewed: false }, { projection: { courseId: 1, courseThumbnail: 1, enrollmentDate: 1 } }).toArray();
        res.json(unratedCourses)
    } catch (error) {
        console.error("Error fetching unratedCourses:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};