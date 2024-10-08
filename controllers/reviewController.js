import { reviewsCollection } from "../index.js";

export const getCourseReviews = async (req, res) => {
    try {
        const courseId = req.params.courseId;
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

        const reviews = await reviewsCollection.find(query, options).toArray();

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching course reviews:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorReviews = async (req, res) => {
    try {
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
        const reviewData = req.body;
        const result = await reviewsCollection.insertOne(reviewData);

        const courseId = reviewData?._courseId;
        const query = { _courseId: courseId };
        const options = { projection: { _id: 0, rating: 1 } };
        
        const ratings = await reviewsCollection.find(query, options).toArray();
        const ratingsArr = ratings.map(rating => rating.rating);

        const totalReviews = ratingsArr.length;
        const rating = totalReviews > 0 ? parseFloat((ratingsArr.reduce((acc, curr) => acc + curr, 0) / totalReviews).toFixed(1)) : 0;

        const filter = { _id: new ObjectId(courseId) };
        const updateCourseRating = {
            $set: {
                rating,
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
