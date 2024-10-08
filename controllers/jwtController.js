import jwt from 'jsonwebtoken';

export const generateToken = (req, res) => {
    try {
        const token = jwt.sign(req.body, process.env.SECRET_TOKEN, { expiresIn: '12h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

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
