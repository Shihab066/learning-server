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
            ratingPercentages[rating] = parseInt((ratingCounts[rating] / totalRatings) * 100);
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
        const coursesCollection = await getCoursesCollection();
        const enrollmentCollection = await getEnrollmentCollection();

        const reviewInfo = req.body;
        const { _courseId } = reviewInfo;

        const courseInfo = await coursesCollection.findOne({ _id: new ObjectId(_courseId) }, { projection: { _id: 0, _instructorId: 1, courseName: 1, courseThumbnail: 1 } });
        const reviewData = {
            ...reviewInfo,
            ...courseInfo,
            date: new Date()
        };

        const result = await reviewsCollection.insertOne(reviewData);

        // change state of reviewed to true
        await enrollmentCollection.updateOne({ courseId: _courseId }, { $set: { reviewed: true } });

        const query = { _courseId };
        const options = { projection: { _id: 0, rating: 1 } };

        const ratings = await reviewsCollection.find(query, options).toArray();
        const ratingsArr = ratings.map(rating => rating.rating);

        const totalReviews = ratingsArr.length;
        const averageRating = totalReviews > 0 ? parseFloat((ratingsArr.reduce((acc, curr) => acc + curr, 0) / totalReviews).toFixed(1)) : 0;

        const filter = { _id: new ObjectId(_courseId) };
        const updateCourseRating = {
            $set: {
                rating: averageRating,
                totalReviews
            }
        };

        await coursesCollection.updateOne(filter, updateCourseRating);

        res.status(201).json(result);
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();
        const coursesCollection = await getCoursesCollection();

        const reviewInfo = req.body;
        const { _courseId, _studentId, rating, review } = reviewInfo;

        const reviewFilter = {
            _courseId,
            _studentId
        };
        const updatedReviewData = {
            $set: {
                rating,
                review
            }
        };

        const result = await reviewsCollection.updateOne(reviewFilter, updatedReviewData);

        const query = { _courseId };
        const options = { projection: { _id: 0, rating: 1 } };

        const ratings = await reviewsCollection.find(query, options).toArray();
        const ratingsArr = ratings.map(rating => rating.rating);

        const totalReviews = ratingsArr.length;
        const averageRating = totalReviews > 0 ? parseFloat((ratingsArr.reduce((acc, curr) => acc + curr, 0) / totalReviews).toFixed(1)) : 0;

        const filter = { _id: new ObjectId(_courseId) };
        const updateCourseRating = {
            $set: {
                rating: averageRating,
                totalReviews
            }
        };

        await coursesCollection.updateOne(filter, updateCourseRating);

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
        const limit = parseInt(req.query.limit);

        const reviewsCount = await reviewsCollection.countDocuments({ _studentId: studentId });
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
        ).limit(limit || 6).sort({ enrollmentDate: -1 }).toArray();

        res.json({ reviewsCount, reviews });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getPendingReviews = async (req, res) => {
    try {
        const enrollmentCollection = await getEnrollmentCollection();
        const { studentId } = req.params;
        const limit = parseInt(req.query.limit);

        const pipeline = [
            // Match enrollments for the specific student and pending reviews
            { $match: { userId: studentId, reviewed: false } },

            // Project the necessary fields from the enrollment document
            { $project: { courseId: 1, enrollmentDate: 1 } },

            // Add a field with converted ObjectId for the lookup
            {
                $addFields: {
                    courseObjectId: { $toObjectId: "$courseId" }
                }
            },

            // Lookup course details from the courses collection
            {
                $lookup: {
                    from: "classes",
                    localField: "courseObjectId",
                    foreignField: "_id",
                    as: "courseDetails"
                }
            },

            // Unwind courseDetails array to make it a single object
            { $unwind: "$courseDetails" },

            // Project the final structure of the result
            {
                $project: {
                    courseId: 1,
                    enrollmentDate: 1,
                    courseName: "$courseDetails.courseName",
                    courseThumbnail: "$courseDetails.courseThumbnail",
                    instructorName: "$courseDetails.instructorName"
                }
            }
        ];

        // Execute the aggregation pipeline
        const pendingReviewsCount = await enrollmentCollection.countDocuments({ userId: studentId, reviewed: false });
        const pendingReviews = await enrollmentCollection.aggregate(pipeline).limit(limit || 6).sort({ enrollmentDate: -1 }).toArray();

        res.json({ pendingReviewsCount, pendingReviews });
    } catch (error) {
        console.error("Error fetching pending reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};