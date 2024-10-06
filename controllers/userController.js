import { usersCollection } from "../index.js";

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await usersCollection.findOne({ _id: id });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await usersCollection.find().toArray();
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getSignupMethodById = async (req, res) => {
    try {
        const { id } = req.params;
        const signupMethod = await usersCollection.findOne(
            { _id: id },
            { projection: { _id: 0, signupMethod: 1 } }
        );

        if (!signupMethod) {
            return res.status(404).json({ message: "Signup method not found" });
        }

        res.status(200).json(signupMethod);
    } catch (error) {
        console.error("Error fetching signup method:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getUserRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await usersCollection.findOne({ _id: id }, { projection: { _id: 0, role: 1 } });

        if (!role) {
            return res.status(404).json({ message: "User role not found" });
        }

        res.status(200).json(role);
    } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const updateInfo = req.body;

        // Check if required fields are present
        if (!updateInfo.name || !updateInfo.image) {
            return res.status(400).json({ message: "Name and image are required." });
        }

        const filter = { _id: id };
        const updateDoc = {
            $set: {
                name: updateInfo.name,
                image: updateInfo.image
            }
        };

        const result = await usersCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }

        res.status(200).json({ message: "User updated successfully.", result });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateInstructorProfileById = async (req, res) => {
    try {
        const id = req.params.id;
        const updateInfo = req.body;       

        const filter = { _id: id };
        const updateDoc = { $set: { ...updateInfo } };

        const result = await usersCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }

        res.status(200).json({ message: "User updated successfully.", result });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateUserRoleById = async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ message: "Role is required." });
        }

        const filter = { _id: id };
        const updateDoc = { $set: { role } };

        const result = await usersCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }

        res.status(200).json({ message: "User role updated successfully.", result });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
