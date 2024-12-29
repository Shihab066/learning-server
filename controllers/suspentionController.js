import { getSuspendedUsersCollection, getUsersCollection } from "../collections.js";

export const getSuspendedUsers = async (req, res) => {
    try {
        const suspendedUsersCollection = await getSuspendedUsersCollection();
        const limit = parseInt(req.query.limit) || 10;
        const searchValue = req.query.search || '';

        const pipeline = [
            // Lookup to get user details for user_id
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user_details',
                },
            },
            // Unwind the user_details array
            {
                $unwind: {
                    path: '$user_details',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Lookup to get admin details for admin_id
            {
                $lookup: {
                    from: 'users',
                    localField: 'admin_id',
                    foreignField: '_id',
                    as: 'admin_details',
                },
            },
            // Unwind the admin_details array
            {
                $unwind: {
                    path: '$admin_details',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Project the desired fields
            {
                $project: {
                    _id: 0,
                    suspend_id: 1,
                    user_id: 1,
                    user_name: '$user_details.name',
                    user_image: '$user_details.image',
                    user_email: '$user_details.email',
                    user_role: '$user_details.role',
                    admin_id: 1,
                    admin_name: '$admin_details.name',
                    admin_email: '$admin_details.email',
                    suspension_reason: 1,
                    suspension_date: 1,
                    suspension_details: 1
                }
            },
            {
                $sort: {
                    suspension_date: -1
                }
            },
            {
                $limit: limit,
            },
        ];

        if (searchValue) {
            pipeline.push({
                $match: {
                    $or: [
                        { user_name: { $regex: searchValue, $options: 'i' } },
                        { user_email: { $regex: searchValue, $options: 'i' } },
                        { admin_email: { $regex: searchValue, $options: 'i' } },
                        { suspend_id: { $regex: searchValue, $options: 'i' } }
                    ]
                }
            })
        }

        const query = {
            $or: [
                { name: { $regex: searchValue, $options: 'i' } },
                { email: { $regex: searchValue, $options: 'i' } },
                { suspend_id: { $regex: searchValue, $options: 'i' } }
            ]
        }

        // get all users from suspension collection
        const totalSuspendedUsers = await suspendedUsersCollection.countDocuments(query);
        const suspendedUsers = await suspendedUsersCollection.aggregate(pipeline).toArray();

        res.json({ totalSuspendedUsers, suspendedUsers });

    } catch (error) {
        console.error("Error fetching suspension data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addSuspensionData = async (req, res) => {
    try {
        const userCollection = await getUsersCollection();
        const suspendedUsersCollection = await getSuspendedUsersCollection();
        const suspensionData = req.body;

        // Check if the user is already in the suspension list
        const isUserAlreadySuspended = await suspendedUsersCollection.findOne({ user_id: suspensionData.user_id });
        if (isUserAlreadySuspended) {
            return res.status(409).json({ error: true, message: 'User is already in the suspension list' });
        }

        // Update the user's suspended status
        await userCollection.updateOne(
            { _id: suspensionData.user_id },
            { $set: { suspended: true } },
            { upsert: true }
        );

        // Add the user to the suspension collection
        const insertSuspensionResult = await suspendedUsersCollection.insertOne(suspensionData);

        res.status(201).json(insertSuspensionResult);

    } catch (error) {
        console.error("Error adding suspension data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const removeSuspension = async (req, res) => {
    try {
        const userCollection = await getUsersCollection();
        const suspendedUsersCollection = await getSuspendedUsersCollection();
        const { userId, suspendId } = req.params;

        const query = {
            user_id: userId,
            suspend_id: suspendId
        };

        // remove the user from suspension collection
        await userCollection.updateOne({ _id: userId }, { $set: { suspended: false } });
        const removeSuspensionResult = await suspendedUsersCollection.deleteOne(query);

        res.json(removeSuspensionResult);

    } catch (error) {
        console.error("Error removing suspension:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
