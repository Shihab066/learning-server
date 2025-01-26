// import { usersCollection } from "../collections.js";
import { getUsersCollection } from "../collections.js";
import { authorizeUser, authorizeAdmin, authorizeInstructor } from "./authorizationController.js";

export const getUserById = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const { id } = req.params;
        const authorizeStatus = await authorizeUser(id, req.decoded.email);
        if (authorizeStatus === 200) {
            const user = await usersCollection.findOne({ _id: id }, { projection: { email: 0 } });
            res.status(200).json(user);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const { adminId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const searchValue = req.query.search || '';
        const query = {
            $or: [
                { name: { $regex: searchValue, $options: 'i' } },
                { email: { $regex: searchValue, $options: 'i' } }
            ]
        };
        const authorizeStatus = await authorizeAdmin(adminId, req.decoded.email);
        if (authorizeStatus === 200) {
            const totalUsers = await usersCollection.countDocuments(query);
            const users = await usersCollection.find(query).limit(limit).toArray();
            if (users.length === 0) {
                return res.status(404).json({ message: "No users found" });
            }
            res.status(200).json({ totalUsers, users });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getSignupMethodById = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
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
        const usersCollection = await getUsersCollection();
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

export const addUser = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const userData = req.body;
        const userEmail = userData.email;

        const finalUserData = {
            ...userData,
            email: userEmail.toLowerCase(),
            image: "",
            role: "student",
            suspended: false
        }

        const result = await usersCollection.insertOne(finalUserData);

        res.status(201).json({ message: "User added successfully", result });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const updateUserById = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const { id } = req.params;
        const authorizeStatus = await authorizeUser(id, req.decoded.email);
        if (authorizeStatus === 200) {
            const { name, image } = req.body;

            // Check if required fields are present
            if (!name && !image) {
                return res.status(400).json({ message: "Name or image are required." });
            }

            const filter = { _id: id };
            const updateDoc = {
                $set: {
                    name,
                    image
                }
            };

            const result = await usersCollection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "User not found or no changes made." });
            }

            res.status(200).json({ message: "User updated successfully.", result });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateInstructorProfileById = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const { id } = req.params;
        const authorizeStatus = await authorizeInstructor(id, req.decoded.email);
        if (authorizeStatus === 200) {
            const updateInfo = req.body;

            const filter = { _id: id };
            const updateDoc = { $set: { ...updateInfo } };

            const result = await usersCollection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "User not found or no changes made." });
            }

            res.status(200).json({ message: "User updated successfully.", result });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateUserRoleById = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const id = req.params.id;
        const authorizeStatus = await authorizeAdmin(id, req.decoded.email);
        if (authorizeStatus === 200) {
            const { userId, role } = req.body;

            if (!role || !userId) {
                return res.status(400).json({ message: "UserId and Role is required." });
            }

            const filter = { _id: userId };
            const updateDoc = { $set: { role } };

            const result = await usersCollection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "User not found or no changes made." });
            }

            res.status(200).json(result);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getSuspendedStatus = async (req, res) => {
    try {
        const usersCollection = await getUsersCollection();
        const id = req.params.id;
        const authorizeStatus = await authorizeUser(id, req.decoded.email);
        if (authorizeStatus === 200) {
            const user = await usersCollection.findOne({ _id: id }, { projection: { _id: 0, suspended: 1 } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json(user);
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });
    } catch (error) {
        console.error("Error getting suspension status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
