import { ObjectId } from "mongodb";
import { getFeedbackCollection } from "../collections.js"

export const getAllFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const options = {
            projection: {
                _id: 0,
                name: 1,
                profileImage: 1,
                heading: 1,
                feedback: 1
            }
        };

        const feedbacks = await feedbackCollection.find({}, options).toArray();
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getFeedbackById = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();

        const { userId } = req.params;
        const options = {
            projection: {
                _id: 0,
                name: 1,
                profileImage: 1,
                headline: 1,
                feedback: 1
            }
        };

        const feedback = await feedbackCollection.findOne({ userId }, options);
        res.status(200).json(feedback);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const feedback = req.body;
        const userId = feedback.userId;

        // Check if feedback already exists for the user
        const isFeedbackExist = await feedbackCollection.findOne({ userId });
        if (isFeedbackExist) {
            return res.status(409).json({ error: true, message: 'Cannot add multiple feedbacks' });
        }

        // Insert feedback into the collection
        const result = await feedbackCollection.insertOne(feedback);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const { userId, headline, feedback } = req.body;     //updatedFeedback only contain userId, headline and feedback             

        const filter = {
            userId
        };
        const updateDoc = {
            $set: {
                headline,
                feedback
            }
        };

        const result = await feedbackCollection.updateOne(filter, updateDoc, { upsert: false });
        res.status(200).json(result);
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const removeFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const { userId } = req.params;

        const result = await feedbackCollection.deleteOne({ userId })
        res.status(200).json(result);
    } catch (error) {
        console.error("Error removing feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
