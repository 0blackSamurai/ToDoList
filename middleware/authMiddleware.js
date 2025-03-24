const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

function isAuthenticated(req, res, next) {
    // Check if req.cookies exists before trying to access properties
    const token = req.cookies ? req.cookies.User : null;

    if (!token) {
        return res.redirect("/sign-in");
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT Error:", err);
            return res.redirect("/sign-in");
        }
        req.user = decoded;
        next();
    });
}

async function checkAuth(req, res, next) {
    const token = req.cookies.User;
    req.isAuthenticated = false;
    req.isAdmin = false;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.Userid);
            
            if (user) {
                req.isAuthenticated = true;
                req.user = user;
                req.isAdmin = user.isAdmin || false;
            }
        } catch (err) {
            console.error("Token verification error:", err);
        }
    }
    
    // Always continue to the next middleware/route handler
    next();
}

module.exports = { isAuthenticated, checkAuth };