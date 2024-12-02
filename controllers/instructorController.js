// import { coursesCollection, reviewsCollection, usersCollection } from "../collections.js";

import { getCoursesCollection, getReviewsCollection, getUsersCollection } from "../collections.js";

export const getInstructor = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const coursesCollection = await getCoursesCollection();
        const reviewsCollection = await getReviewsCollection();
        const instructorId = req.params.instructorId;

        // Fetch instructor info
        const instructorOptions = {
            projection: {
                _id: 0,
                name: 1,
                image: 1,
                headline: 1,
                bioData: 1,
                experience: 1,
                expertise: 1,
                socialLinks: 1
            }
        };
        const instructorInfo = await usersCollection.findOne({ _id: instructorId, role: 'instructor' }, instructorOptions);
        if (!instructorInfo) {
            return res.status(404).json({ error: true, message: 'Instructor not found' });
        }

        // Fetch course, review counts, and total students
        const [totalCoursesCount, totalReviewsCount, totalStudentsArray] = await Promise.all([
            coursesCollection.countDocuments({ _instructorId: instructorId }),
            reviewsCollection.countDocuments({ _instructorId: instructorId }),
            coursesCollection.aggregate([
                { $match: { _instructorId: instructorId } },
                { $group: { _id: null, totalStudents: { $sum: '$students' } } },
                { $project: { _id: 0, totalStudents: 1 } }
            ]).toArray()
        ]);

        const totalStudents = totalStudentsArray.length > 0 ? totalStudentsArray[0].totalStudents : 0;

        const instructorDetails = {
            ...instructorInfo,
            totalCoursesCount,
            totalReviewsCount,
            totalStudents
        };

        res.status(200).json(instructorDetails);
    } catch (error) {
        console.error("Error fetching instructor details:", error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const getInstructors = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const reviewsCollection = await getReviewsCollection();
        // Step 1: Find all instructor emails
        const query = { role: 'instructor' };
        const options = {
            projection: {
                name: 1,
                image: 1,
                headline: 1
            }
        };
        const instructorsCollection = await usersCollection.find(query, options).toArray();

        // Step 2: Calculate average rating for each instructor
        const promises = instructorsCollection.map(async (instructor) => {
            const { _id: instructorId } = instructor;
            const totalRatings = await reviewsCollection.countDocuments({ _instructorId: instructorId })

            const instructorRating = await reviewsCollection.aggregate([
                {
                    $match: { _instructorId: instructorId }
                },
                {
                    $group: {
                        _id: null,
                        totalSumRating: { $sum: '$rating' }
                    }
                },
                {
                    $addFields: { totalRatings: totalRatings }
                },
                {
                    $project: {
                        _id: 0,
                        ratingAverage: { $divide: ['$totalSumRating', '$totalRatings'] }
                    }
                }
            ]).toArray();

            const instructorData = {
                ...instructor,
                rating: instructorRating[0]?.ratingAverage > 0 ? parseFloat(instructorRating[0]?.ratingAverage).toFixed(1) : 0
            }
            return instructorData;
        });

        const results = await Promise.all(promises);

        res.status(200).send(results);
    } catch (error) {
        console.error("Error fetching instructors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getPopularInstructors = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const coursesCollection = await getCoursesCollection();
        const reviewsCollection = await getReviewsCollection();
        // Step 1: Find all instructor emails
        const query = { role: 'instructor' };
        const options = {
            projection: { _id: 1 }
        };
        const instructorsCollection = await usersCollection.find(query, options).toArray();

        // Step 2: Calculate combined score for each instructor
        const promises = instructorsCollection.map(async ({ _id: instructorId }) => {
            const totalRatings = await reviewsCollection.countDocuments({ _instructorId: instructorId })

            const instructorRating = await reviewsCollection.aggregate([
                {
                    $match: { _instructorId: instructorId }
                },
                {
                    $group: {
                        _id: null,
                        totalSumRating: { $sum: '$rating' }
                    }
                },
                {
                    $addFields: { totalRatings: totalRatings }
                },
                {
                    $project: {
                        _id: 0,
                        ratingAverage: { $divide: ['$totalSumRating', '$totalRatings'] }
                    }
                }
            ]).toArray();

            const findTotalStudent = await coursesCollection.aggregate([
                {
                    $match: { _instructorId: instructorId }
                },
                {
                    $group: { _id: null, totalStudents: { $sum: '$students' } }
                },
                {
                    $project: {
                        _id: 0,
                        totalStudents: 1
                    }
                }
            ]).toArray();

            const combinedScore = ((totalRatings + instructorRating[0]?.ratingAverage) * .4) + ((findTotalStudent[0]?.totalStudents) * .6); // 40% of (totalRating + instructorRating) and 60% of total Students
            const instructor = {
                instructorId,
                combinedScore: combinedScore ? combinedScore : 0,
                rating: instructorRating[0]?.ratingAverage > 0 ? parseFloat(instructorRating[0]?.ratingAverage).toFixed(1) : 0
            }
            return instructor;
        });

        const results = await Promise.all(promises);

        // Filter out any undefined results and sort based on instructor combined score
        const sortedInstructors = results
            .filter(result => result !== undefined)
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, 8);

        // Step 3: Fetch instructor details
        const getInstructorPromise = sortedInstructors.map(async ({ instructorId, rating }) => {
            const options = {
                projection: {
                    name: 1,
                    image: 1,
                    headline: 1
                }
            }
            const instructorData = await usersCollection.findOne({ _id: instructorId }, options);
            return {
                ...instructorData,
                rating
            }
        });

        const popularInstructors = await Promise.all(getInstructorPromise);

        res.status(200).send(popularInstructors);
    } catch (error) {
        console.error("Error fetching popular instructors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
