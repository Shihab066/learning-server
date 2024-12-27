import { ObjectId } from "mongodb";
import { getSuspendedUsersCollection, getUsersCollection } from "../collections.js";

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
            { _id: new ObjectId(suspensionData.user_id) },
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
