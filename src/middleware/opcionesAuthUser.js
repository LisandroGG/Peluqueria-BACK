import jwt from 'jsonwebtoken';

export const optionalAuthUser = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
    } catch (error) {
        req.user = null;
    }   

    next();
};