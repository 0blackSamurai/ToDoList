const User = require('../models/userModel');
const Todo = require('../models/TodoModel');
const bcrypt = require('bcrypt');

// Get user profile with stats
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.Userid;
        
        // Get user details
        const user = await User.findById(userId);
        
        if (!user) {
            return res.redirect('/sign-in');
        }
        
        // Get todo statistics
        const totalTodos = await Todo.countDocuments({ user: userId });
        const completedTodos = await Todo.countDocuments({ user: userId, completed: true });
        const pendingTodos = totalTodos - completedTodos;
        
        const stats = {
            totalTodos,
            completedTodos,
            pendingTodos
        };
        
        res.render('Profile', {
            title: 'User Profile',
            isAuthenticated: req.isAuthenticated,
            user,
            stats
        });
        
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Error loading profile');
    }
};

// Render change password form
exports.renderChangePassword = (req, res) => {
    res.render('change-password', { title: 'Change Password' });
};

// Process change password request
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.Userid;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        return res.render('change-password', {
            title: 'Change Password',
            feedback: 'New passwords do not match'
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
                feedback: 'Current password is incorrect'
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
            success: true
        });
        
    } catch (error) {
        console.error('Error changing password:', error);
        return res.render('change-password', {
            title: 'Change Password',
            feedback: 'An error occurred while changing password'
        });
    }
};