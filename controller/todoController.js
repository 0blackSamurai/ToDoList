const Todo = require("../models/TodoModel.js")

// Get todos for a specific date for the logged-in user
exports.getTodosByDate = async (req, res) => {
    try {
        const userId = req.user.Userid;
        const dateParam = req.params.date;
        
        // If no date provided, use today
        let targetDate;
        if (dateParam) {
            const parsedDate = new Date(dateParam);
            if (!isNaN(parsedDate.getTime())) {
                // Valid date
                targetDate = parsedDate;
            } else {
                // Invalid date, use today
                targetDate = new Date();
            }
        } else {
            targetDate = new Date();
        }
        
        // Set time to midnight for date comparison
        targetDate.setHours(0, 0, 0, 0);
        
        // Find next day
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Find todos for this user on the target date
        const todos = await Todo.find({
            user: userId,
            date: {
                $gte: targetDate,
                $lt: nextDay
            }
        }).sort({ completed: 1, date: 1 });
        
        // Format date for display
        const formattedDate = targetDate.toISOString().split('T')[0];
        
        // Calculate previous and next dates for navigation
        const prevDate = new Date(targetDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const formattedPrevDate = prevDate.toISOString().split('T')[0];
        
        const formattedNextDate = nextDay.toISOString().split('T')[0];
        
        // Is the target date today?
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = targetDate.getTime() === today.getTime();
        
        res.render('todo', {
            title: isToday ? "Today's To-Do List" : `To-Do List for ${formattedDate}`,
            todos,
            currentDate: formattedDate,
            prevDate: formattedPrevDate,
            nextDate: formattedNextDate,
            isAuthenticated: req.isAuthenticated,
            isToday
        });
        
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).send('Error fetching todo list');
    }
};

// Get all todos for the current user (API endpoint)
exports.getAllTodos = async (req, res) => {
    try {
        const userId = req.user.Userid;
        
        // Find all todos for this user
        const todos = await Todo.find({
            user: userId
        }).sort({ date: 1, completed: 1 });
        
        res.json(todos);
    } catch (error) {
        console.error('Error fetching all todos:', error);
        res.status(500).json({ error: 'Error fetching todos' });
    }
};

// Add a new todo
exports.addTodo = async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const userId = req.user.Userid;
        
        // Validate required fields
        if (!title) {
            return res.status(400).send('Title is required');
        }
        
        // Create new todo
        const newTodo = new Todo({
            title,
            description,
            date: date || new Date(),
            user: userId
        });
        
        await newTodo.save();
        
        // Redirect back to the todo list for that date
        const todoDate = new Date(newTodo.date);
        const formattedDate = todoDate.toISOString().split('T')[0];
        res.redirect(`/${formattedDate}`);
        
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).send('Error creating todo item');
    }
};

// Toggle todo completion status
exports.toggleTodoStatus = async (req, res) => {
    try {
        const todoId = req.params.id;
        
        // Find the todo
        const todo = await Todo.findById(todoId);
        
        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }
        
        // Check if the todo belongs to the logged-in user
        if (todo.user.toString() !== req.user.Userid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Toggle completion status
        todo.completed = !todo.completed;
        await todo.save();
        
        return res.json({ success: true, completed: todo.completed });
        
    } catch (error) {
        console.error('Error toggling todo status:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a todo
exports.deleteTodo = async (req, res) => {
    try {
        const todoId = req.params.id;
        
        // Find the todo
        const todo = await Todo.findById(todoId);
        
        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }
        
        // Check if the todo belongs to the logged-in user
        if (todo.user.toString() !== req.user.Userid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Delete the todo
        await Todo.findByIdAndDelete(todoId);
        
        return res.json({ success: true });
        
    } catch (error) {
        console.error('Error deleting todo:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};