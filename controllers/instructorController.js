import { usersCollection } from "../index.js";

export const getInstructors = async (req, res) => {
    try {
        const query = { role: 'instructor' };
        const options = {
            projection: {
                userName: 1,
                headline: 1
            }
        };

        const result = await usersCollection.find(query, options).toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching instructors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getPopularInstructors = async (req, res) => {
    try {
        // Step 1: Find all instructor emails
        const query = { role: 'instructor' };
        const options = {
            projection: { _id: 0, email: 1 }
        };
        const instructorsEmailCollection = await usersCollection.find(query, options).toArray();

        // Step 2: Find total students for each instructor
        const promises = instructorsEmailCollection.map(async ({ email }) => {
            const pipeline = [
                { $match: { email: email } },
                { $group: { _id: '$email', totalStudents: { $sum: '$students' } } },
                { $project: { _id: 0, email: '$_id', totalStudents: 1 } }
            ];

            const findTotalStudent = classesCollection.aggregate(pipeline);
            const res = await findTotalStudent.toArray();

            if (res.length) {
                return res[0];
            }
        });

        const results = await Promise.all(promises);

        // Filter out any undefined results and sort based on total students
        const sortedResults = results
            .filter(result => result !== undefined)
            .sort((a, b) => b.totalStudents - a.totalStudents)
            .slice(0, 6);

        // Step 3: Fetch instructor details
        const getInstructorPromise = sortedResults.map(async (instructor) => {
            const options = {
                projection: {
                    userName: 1,
                    headline: 1
                }
            }
            return await usersCollection.findOne({ email: instructor.email }, options);
        });

        const popularInstructors = await Promise.all(getInstructorPromise);

        res.status(200).send(popularInstructors);
    } catch (error) {
        console.error("Error fetching popular instructors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
