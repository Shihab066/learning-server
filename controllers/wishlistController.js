import { ObjectId } from "mongodb";
import { getCoursesCollection, getWishlistCollection } from "../collections.js";
import { authorizeUser } from "./authorizationController.js";
import { messaging } from "firebase-admin";

export const getWishListItems = async (req, res) => {
    try {
        const wishlistCollection = await getWishlistCollection();
        const { userId } = req.params;

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);

        if (authorizeStatus === 200) {
            const cursor = wishlistCollection.find({ userId }, { projection: { courseId: 1 } })
            const wishlist = await cursor.toArray();

            res.json(wishlist);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.log('Error fetching wishListItem:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getWishlistCourses = async (req, res) => {
    try {
        const { wishlist } = req.body;

        // Extract the courseIds from the wishlist items
        const courseIds = wishlist.map(item => new ObjectId(item.courseId));

        // Find all courses with courseIds from the wishlist
        const courseCollection = await getCoursesCollection();
        const options = {
            projection: {
                instructorName: 1,
                courseName: 1,
                courseThumbnail: 1,
                level: 1,
                rating: 1,
                totalReviews: 1,
                totalModules: 1,
                price: 1,
                discount: 1
            }
        }
        const courses = await courseCollection.find({ _id: { $in: courseIds } }, options).toArray();

        // Respond with the course details
        res.json(courses);

    } catch (error) {
        console.error("Error fetching wishlist courses:", error);
        res.status(500).json({ message: "An error occurred", error });
    }
};

export const addWishListItem = async (req, res) => {
    try {
        const wishlistCollection = await getWishlistCollection();
        const wishlistItem = req.body;

        const itemExist = await wishlistCollection.findOne(wishlistItem);
        if (itemExist) {
            return res.status(409).json({ error: true });
        }

        const result = await wishlistCollection.insertOne(wishlistItem);
        res.status(201).json(result);

    } catch (error) {
        console.log('Error adding wishListItem:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const removeWishListItem = async (req, res) => {
    try {
        const wishlistCollection = await getWishlistCollection();
        const { userId, courseId } = req.params;

        const authorizeStatus = await authorizeUser(userId, req.decoded.email);

        if (authorizeStatus === 200) {
            const result = await wishlistCollection.deleteOne({ userId, courseId });
            res.json(result);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
        
    } catch (error) {
        console.log('Error deleting wishListItem:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};