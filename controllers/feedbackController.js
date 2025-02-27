import { ObjectId } from "mongodb";
import { getFeedbackCollection } from "../collections.js"
import { authorizeUser } from "./authorizationController.js";

export const getAllFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const options = {
            projection: {
                _id: 0,
                name: 1,
                profileImage: 1,
                headline: 1,
                feedback: 1
            }
        };

        const feedbacks = await feedbackCollection.find({}, options).sort({ date: -1 }).limit(6).toArray();
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

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);
        if (authorizeStatus === 200) {
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
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

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
        const newFeedback = {
            ...feedback,
            date: new Date()
        }

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);

        if (authorizeStatus === 200) {
            // Check if feedback already exists for the user
            const isFeedbackExist = await feedbackCollection.findOne({ userId });
            if (isFeedbackExist) {
                return res.status(409).json({ error: true, message: 'Cannot add multiple feedbacks' });
            }

            // Insert feedback into the collection
            const result = await feedbackCollection.insertOne(newFeedback);
            res.status(201).json(result);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const { userId, headline, feedback } = req.body;     //updatedFeedback only contain userId, headline and feedback

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);

        if (authorizeStatus === 200) {
            const filter = {
                userId
            };
            const updateDoc = {
                $set: {
                    headline,
                    feedback,
                    date: new Date()
                }
            };

            const result = await feedbackCollection.updateOne(filter, updateDoc, { upsert: false });
            res.status(200).json(result);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const removeFeedback = async (req, res) => {
    try {
        const feedbackCollection = await getFeedbackCollection();
        const { userId } = req.params;

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);

        if (authorizeStatus === 200) {
            const result = await feedbackCollection.deleteOne({ userId })
            res.status(200).json(result);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error removing feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
