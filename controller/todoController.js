const Todo = require("../models/TodoModel.js")

// Get todos for a specific date for the logged-in user
exports.getTodosByDate = async (req, res) => {
    try {
        const userId = req.user.Userid;
        const dateParam = req.params.date;
        let targetDate = dateParam ? new Date(dateParam) : new Date();
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
        targetDate.setUTCHours(0, 0, 0, 0);
        
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
        
        // Calculate week number and create week data
        const weekData = await getWeekData(userId, targetDate);
        
        res.render('todo', {
            title: isToday ? "Today's To-Do List" : `To-Do List for ${formattedDate}`,
            todos,
            currentDate: formattedDate,
            prevDate: formattedPrevDate,
            nextDate: formattedNextDate,
            isAuthenticated: req.isAuthenticated,
            isToday,
            weekNumber: weekData.weekNumber,
            weekYear: weekData.weekYear,
            weekDays: weekData.weekDays
        });
        
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).send('Error fetching todo list');
    }
};

// Helper function to get week data
// Helper function to get week data
async function getWeekData(userId, targetDate) {
    // Create a new date object to avoid modifying the original
    const targetDateObj = new Date(targetDate);
    
    // Get the first day of the week (Monday)
    const firstDayOfWeek = new Date(targetDateObj);
firstDayOfWeek.setDate(firstDayOfWeek.getDate() - ((firstDayOfWeek.getDay() + 6) % 7));
firstDayOfWeek.setHours(0, 0, 0, 0); 
    
    // Get the week number
    const firstDayOfYear = new Date(firstDayOfWeek.getFullYear(), 0, 1);
    const pastDaysOfYear = (firstDayOfWeek - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    // Create data for each day of the week
    const weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get todo counts for the whole week
    const weekStart = new Date(firstDayOfWeek);
    const weekEnd = new Date(firstDayOfWeek);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Find all todos for this week
    const weekTodos = await Todo.find({
        user: userId,
        date: {
            $gte: weekStart,
            $lt: weekEnd
        }
    });
    
    // Count todos by date
    const todoCountsByDate = {};
    weekTodos.forEach(todo => {
        const todoDate = new Date(todo.date);
        todoDate.setHours(0, 0, 0, 0);
        const dateKey = todoDate.toISOString().split('T')[0];
        
        if (!todoCountsByDate[dateKey]) {
            todoCountsByDate[dateKey] = 0;
        }
        
        todoCountsByDate[dateKey]++;
    });
    
    // Create day data with correct date display
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
        // Create a completely new date object for each day of the week
        const currentDate = new Date(firstDayOfWeek);
        currentDate.setDate(firstDayOfWeek.getDate() + i);
        
        // Ensure time is set to midnight
        currentDate.setHours(0, 0, 0, 0);
        
        // Format date for URL and comparison
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Push the day data to the weekDays array
        weekDays.push({
            date: dateKey,
            weekdayShort: dayNames[currentDate.getDay()],
            dayNumber: currentDate.getDate(),
            isToday: currentDate.getTime() === today.getTime(),
            isCurrentDay: currentDate.getTime() === targetDateObj.getTime(),
            todoCount: todoCountsByDate[dateKey] || 0
        });
    }
    
    return {
        weekNumber,
        weekYear: firstDayOfWeek.getFullYear(),
        weekDays
    };
}

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