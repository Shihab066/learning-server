import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// import service from '/service-account.json'
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const generateToken = async (req, res) => { 
    const { uniqueKey } = req.body;
    try {
        const decodedToken = await admin.auth().verifyIdToken(uniqueKey);

        const token = jwt.sign(
            { email: decodedToken.email },
            process.env.SECRET_TOKEN,
            { expiresIn: '5h' }
        );
        res.status(200).json({ token });
    } catch (error) {
        console.error("Error generating token:", error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Token has expired' });
        } else if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({ message: 'Token has been revoked' });
        } else if (error.code === 'auth/invalid-id-token') {
            return res.status(400).json({ message: 'Invalid token' });
        } else if (error.code === 'auth/argument-error') {
            return res.status(400).json({ message: 'Malformed token' });
        } else {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

// this function is used to verify token for login system
export const verifyAccessToken = (req, res) => {
    const { token } = req.body;

    // Check if token is provided
    if (!token) {
        return res.status(403).json({ valid: false, message: 'Token is required' });
    }

    try {
        // Verify token
        jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
            if (err) {
                // Handle specific token errors
                if (err.name === 'TokenExpiredError') {
                    return res.json({ valid: false, message: 'Token has expired' });
                }

                // For other errors (e.g., invalid token)
                return res.json({ valid: false, message: 'Invalid token' });
            }

            // Token is valid        
            return res.status(200).json({ valid: true, message: 'Token is valid' });
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

// this function is used to secure different backend api's
export const verifyToken = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return res.status(401).json({ error: true, message: 'Unauthorized Access' });
        }

        const token = authorization.split(' ')[1];
        jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
            if (error) {
                return res.status(401).json({ error: true, message: 'Unauthorized Access' });
            }
            req.decoded = decoded;
            next();
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};


export const verifyTokenToGetVideoPlaylist = (req, res, next) => {
    try {
        const token = req.params.jwtToken;
        
        if (!token) {
            return res.status(401).json({ error: true, message: 'Unauthorized Access' });
        }        
        jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
            if (error) {
                return res.status(401).json({ error: true, message: 'Unauthorized Access' });
            }
            req.decoded = decoded;
            next();
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};