import { cart } from "../index.js";

export const getCartItemById = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        const query = { _studentId: studentId };
        const result = await cart.find(query).toArray();       

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addCourseToCart = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const cartItem = req.body;

        const query = { _id: studentId, _courseId: cartItem?._courseId };
        const existingItem = await cart.findOne(query);

        if (existingItem) {
            return res.status(409).json({ error: true, message: 'Course already added to cart.' });
        }

        const result = await cart.insertOne(cartItem);
        res.status(201).json({ message: "Course added to cart successfully.", result });
    } catch (error) {
        console.error("Error adding course to cart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await cart.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }

        res.status(200).json({ message: "Cart item deleted successfully.", result });
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
