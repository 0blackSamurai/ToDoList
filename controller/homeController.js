const Todo = require('../models/TodoModel');

exports.getHomePage = async (req, res) => {
    if (!req.isAuthenticated) {
        // If not logged in, show the landing page
        return res.render("index", { 
            title: "Fiks ferdig - Your Todo List App",
            isAuthenticated: false
        });
    }
    
    try {
        // If logged in, fetch today's todos and redirect to today's list
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const formattedDate = today.toISOString().split('T')[0];
        
        return res.redirect(`/${formattedDate}`);
    } catch (error) {
        console.error("Error fetching todos:", error);
        return res.render("index", { 
            title: "Fiks ferdig - Your Todo List App",
            isAuthenticated: req.isAuthenticated,
            user: req.user
        });
    }
};