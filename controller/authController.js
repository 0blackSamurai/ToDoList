const User = require('../models/userModel');
const Todo = require('../models/TodoModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { navn, epost, passord, confirmpassord } = req.body;

    if (passord !== confirmpassord) {
        return res.render('sign-up', { 
            title: 'Sign Up',
            feedback: 'Passwords do not match'
        });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ epost });
        if (existingUser) {
            return res.render('sign-up', { 
                title: 'Sign Up',
                feedback: 'Email already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(passord, parseInt(process.env.SALTROUNDS));

        const newUser = new User({
            navn,
            epost,
            passord: hashedPassword
        });

        await newUser.save();
        res.redirect("/sign-in");
    } catch (error) {
        console.error('Error registering user:', error);
        res.render('sign-up', { 
            title: 'Sign Up',
            feedback: 'Error registering user'
        });
    }
};

exports.login = async (req, res) => {
    const { epost, passord } = req.body;
    
    try {
        const user = await User.findOne({ epost });

        if (!user) {
            return res.render('sign-in', { 
                title: 'Sign In',
                feedback: 'User not found',
                isAuthenticated: req.isAuthenticated
            });
        }

        const isMatch = await bcrypt.compare(passord, user.passord);

        if (!isMatch) {
            return res.render('sign-in', { 
                title: 'Sign In',
                feedback: 'Invalid password'
            });
        }

        const token = jwt.sign({ Userid: user._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
        res.cookie('User', token, { httpOnly: true });
        
        return res.redirect("/");
    } catch (error) {
        console.error('Login error:', error);
        return res.render('sign-in', { 
            title: 'Sign In',
            feedback: 'An error occurred during login'
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('User'); 
    res.redirect("/");
};  

exports.renderLogoutConfirmation = (req, res) => {
    res.render('logout-confirmation', {
         title: 'Confirm Logout', 
        isAuthenticated: req.isAuthenticated });
};

exports.renderSignUp = (req, res) => {
    // If user is already logged in, redirect to home
    if (req.isAuthenticated) {
        return res.redirect('/');
    }
    res.render("sign-up", { title: "Sign Up" });
};

exports.renderSignIn = (req, res) => {
    // If user is already logged in, redirect to home
    if (req.isAuthenticated) {
        return res.redirect('/');
    }
    res.render("sign-in", { title: "Sign In" });
};

// Profile controller functions moved from profileController.js
// Get user profile with user's todos
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.Userid;
        
        // Get user details
        const user = await User.findById(userId);
        
        if (!user) {
            return res.redirect('/sign-in');
        }
        
        // Get user's todos
        const todos = await Todo.find({ user: userId }).sort({ date: -1, completed: 1 });
        
        res.render('Profile', {
            title: 'My Todos',
            isAuthenticated: req.isAuthenticated,
            user,
            todos
        });
        
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Error loading profile');
    }
};

// Get all todos (admin function)
exports.getAllTodos = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.isAdmin) {
            return res.redirect('/');
        }
        
        // Get all todos with user information
        const todos = await Todo.find()
            .populate('user', 'navn epost')
            .sort({ date: -1, completed: 1 });
        
        res.render('all-todos', {
            title: 'All Todos',
            isAuthenticated: req.isAuthenticated,
            isAdmin: req.isAdmin,
            todos
        });
        
    } catch (error) {
        console.error('Error fetching all todos:', error);
        res.status(500).send('Error loading todos');
    }
};

// Render change password form
exports.renderChangePassword = (req, res) => {
    res.render('change-password', { 
        title: 'Change Password',
        isAuthenticated: req.isAuthenticated
    });
};

// Process change password request
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.Userid;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        return res.render('change-password', {
            title: 'Change Password',
            feedback: 'New passwords do not match',
            isAuthenticated: req.isAuthenticated
        });
    }
    
    try {
        // Get user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.redirect('/sign-in');
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.passord);
        
        if (!isMatch) {
            return res.render('change-password', {
                title: 'Change Password',
                feedback: 'Current password is incorrect',
                isAuthenticated: req.isAuthenticated
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALTROUNDS) || 10);
        
        // Update password
        user.passord = hashedPassword;
        await user.save();
        
        return res.render('change-password', {
            title: 'Change Password',
            feedback: 'Password updated successfully',
            success: true,
            isAuthenticated: req.isAuthenticated
        });
        
    } catch (error) {
        console.error('Error changing password:', error);
        return res.render('change-password', {
            title: 'Change Password',
            feedback: 'An error occurred while changing password',
            isAuthenticated: req.isAuthenticated
        });
    }
};