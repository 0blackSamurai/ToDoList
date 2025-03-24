const User = require('../models/userModel');
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
                feedback: 'User not found'
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