import { ObjectId } from "mongodb";
import { getCartCollection, getCoursesCollection, getEnrollmentCollection } from "../collections.js";

export const getCartItems = async (req, res) => {
    try {
        const cart = await getCartCollection();
        const { userId } = req.params;

        const options = {
            projection: {
                _id: 0,
                courseId: 1,
                savedForLater: 1
            }
        }

        const result = await cart.find({ userId }, options).toArray();

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getCartCourses = async (req, res) => {
    try {
        const { cartItems } = req.body;

        // Extract the courseIds from the wishlist items
        const courseIds = cartItems.map(item => new ObjectId(item.courseId));

        // Find all courses with courseIds from the wishlist
        const courseCollection = await getCoursesCollection();
        const courses = await courseCollection.aggregate([
            {
                $match: { _id: { $in: courseIds } }
            },
            {
                $lookup: {
                    from: "cart",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: [{ $toObjectId: "$courseId" }, "$$courseId"] }  // Match courseId in wishlist with course _id
                            }
                        }
                    ],
                    as: "cartItem"
                }
            },
            {
                $addFields: {
                    savedForLater: { $arrayElemAt: ["$cartItem.savedForLater", 0] }
                }
            },
            {
                $project: {
                    _instructorId: 1,
                    instructorName: 1,
                    courseName: 1,
                    courseThumbnail: 1,
                    level: 1,
                    rating: 1,
                    totalReviews: 1,
                    totalModules: 1,
                    price: 1,
                    discount: 1,
                    savedForLater: 1
                }
            }
        ]).toArray();

        // Respond with the course details
        res.json(courses);

    } catch (error) {
        console.error("Error fetching cart courses:", error);
        res.status(500).json({ message: "An error occurred", error });
    }
};

export const addCourseToCart = async (req, res) => {
    try {
        const cartCollection = await getCartCollection();
        const enrollmentCollection = await getEnrollmentCollection();
        const cartItem = req.body;
        const modifiedCartItem = {
            ...cartItem,
            savedForLater: false
        }

        const existingItem = await cartCollection.findOne(cartItem);
        if (existingItem) {
            return res.status(409).json({ error: true, message: 'Course already added to cart.' });
        }

        const isEnrolled = await enrollmentCollection.findOne({ userId: cartItem.userId, courseId: cartItem.courseId });
        if (isEnrolled) {
            return res.status(409).json({ error: true, message: 'Course already enrolled.' });
        }

        const result = await cartCollection.insertOne(modifiedCartItem);

        res.status(201).json(result);
    } catch (error) {
        console.error("Error adding course to cart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateCartItemStatus = async (req, res) => {
    try {
        const cartCollection = await getCartCollection();
        const { userId, courseId } = req.params;
        const { savedForLater } = req.body;

        const updateDoc = {
            $set: {
                savedForLater
            }
        };

        const result = await cartCollection.updateOne({ userId, courseId }, updateDoc);
        res.json(result);
    } catch (error) {
        console.error("Error updating cart item status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const cartCollection = await getCartCollection();
        const { userId, courseId } = req.params;

        const result = await cartCollection.deleteOne({ userId, courseId });

        res.json(result);
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
