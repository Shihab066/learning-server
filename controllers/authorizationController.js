import { getUsersCollection } from "../collections.js";

export const verifyActiveUser = async (req, res, next) => {
    try {
        const usersCollection = await getUsersCollection();
        const email = req.decoded?.email;
        if (!email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const user = await usersCollection.findOne({ email });
        if (user?.suspended) {
            return res.status(423).json({ error: true, message: 'Account suspended' });
        }

        next();
    } catch (error) {
        console.error("Error verifying active user:", error);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const verifyStudent = async (req, res, next) => {
    try {
        const usersCollection = await getUsersCollection();
        const email = req.decoded?.email;
        if (!email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const user = await usersCollection.findOne({ email });
        if (user?.role !== 'student') {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        next();
    } catch (error) {
        console.error("Error verifying student:", error);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const verifyInstructor = async (req, res, next) => {
    try {
        const usersCollection = await getUsersCollection();
        const email = req.decoded?.email;
        if (!email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const user = await usersCollection.findOne({ email });
        if (user?.role !== 'instructor') {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        next();
    } catch (error) {
        console.error("Error verifying instructor:", error);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const verifyAdmin = async (req, res, next) => {
    try {
        const usersCollection = await getUsersCollection();
        const email = req.decoded?.email;
        if (!email) {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        const user = await usersCollection.findOne({ email });
        if (user?.role !== 'admin') {
            return res.status(403).json({ error: true, message: 'Forbidden Access' });
        }

        next();
    } catch (error) {
        console.error("Error verifying admin:", error);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

// this functions is use to verify users authorization when call specific api
export const authorizeUser = async (userId, decodedEmail) => {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: userId }, { projection: { _id: 0, email: 1 } });
    if (!user) {
        return 403;
    }

    if (user.email === decodedEmail) {
        return 200;
    } else {
        return 403;
    }
}

export const authorizeInstructor = async (userId, decodedEmail) => {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: userId }, { projection: { _id: 0, email: 1, role: 1 } });
    if (!user) {
        return 403;
    }

    if (user.email === decodedEmail && user.role === 'instructor') {
        return 200;
    } else {
        return 403;
    }
}

export const authorizeAdmin = async (userId, decodedEmail) => {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: userId }, { projection: { _id: 0, email: 1, role: 1 } });
    if (!user) {
        return 403;
    }

    if (user.email === decodedEmail && user.role === 'admin') {
        return 200;
    } else {
        return 403;
    }
}