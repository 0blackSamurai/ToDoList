const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const todoController = require('../controller/todoController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Route to get todos for today (default) or a specific date
router.get('/:date?', isAuthenticated, todoController.getTodosByDate);

// Route to add a new todo
router.post('/todo', isAuthenticated, todoController.addTodo);

// Route to toggle todo completion status
router.put('/todo/:id', isAuthenticated, todoController.toggleTodoStatus);

// Route to delete a todo
router.delete('/todo/:id', isAuthenticated, todoController.deleteTodo);

module.exports = router;