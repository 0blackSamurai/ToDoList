require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
const Todo = require('./models/todoModel');

// Connect to MongoDB
mongoose.connect(process.env.DB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample user data
const users = [
  {
    navn: 'John Doe',
    epost: 'john@example.com',
    passord: 'password123',
  },
  {
    navn: 'Jane Smith',
    epost: 'jane@example.com',
    passord: 'password123',
  },
  {
    navn: 'Admin User',
    epost: 'admin@example.com',
    passord: 'admin123',
    isAdmin: true
  }
];

// Sample todo data for each user
const todos = [
  // User 1 todos
  {
    title: 'Finish project proposal',
    description: 'Complete the draft and send it to the team for review',
    date: new Date(),
    completed: false
  },
  {
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, and vegetables',
    date: new Date(),
    completed: true
  },
  {
    title: 'Call dentist',
    description: 'Schedule appointment for next week',
    date: new Date(),
    completed: false
  },
  {
    title: 'Gym session',
    description: 'Focus on cardio and upper body',
    date: new Date(Date.now() + 86400000), // Tomorrow
    completed: false
  },
  {
    title: 'Pay rent',
    description: 'Due on the 5th',
    date: new Date(Date.now() - 86400000), // Yesterday
    completed: false
  },
  
  // User 2 todos
  {
    title: 'Submit report',
    description: 'Complete the quarterly report',
    date: new Date(),
    completed: false
  },
  {
    title: 'Team meeting',
    description: 'Project status update at 3 PM',
    date: new Date(),
    completed: false
  },
  {
    title: 'Pick up kids',
    description: 'School ends at 3:30 PM',
    date: new Date(),
    completed: false
  },
  {
    title: 'Doctor appointment',
    description: 'Annual checkup at 10 AM',
    date: new Date(Date.now() + 86400000), // Tomorrow
    completed: false
  },
  {
    title: 'Plan weekend trip',
    description: 'Research hotels and activities',
    date: new Date(Date.now() - 86400000), // Yesterday
    completed: true
  },
  
  // User 3 todos
  {
    title: 'System backup',
    description: 'Run weekly backup of all servers',
    date: new Date(),
    completed: false
  },
  {
    title: 'Security audit',
    description: 'Review access logs and permissions',
    date: new Date(),
    completed: true
  },
  {
    title: 'Update documentation',
    description: 'Add new API endpoints to the docs',
    date: new Date(),
    completed: false
  },
  {
    title: 'Plan sprint meeting',
    description: 'Prepare agenda and review backlog',
    date: new Date(Date.now() + 86400000), // Tomorrow
    completed: false
  },
  {
    title: 'Code review',
    description: 'Review pull requests from the team',
    date: new Date(Date.now() - 86400000), // Yesterday
    completed: false
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Todo.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create users
    const saltRounds = parseInt(process.env.SALTROUNDS) || 10;
    const createdUsers = [];
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.passord, saltRounds);
      
      const user = new User({
        navn: userData.navn,
        epost: userData.epost,
        passord: hashedPassword,
        isAdmin: userData.isAdmin || false
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.navn} (${savedUser.epost})`);
    }
    
    // Create todos for each user
    let todoIndex = 0;
    for (let userIndex = 0; userIndex < createdUsers.length; userIndex++) {
      const user = createdUsers[userIndex];
      
      // Add 5 todos per user
      for (let i = 0; i < 5; i++) {
        const todoData = todos[todoIndex++];
        
        const todo = new Todo({
          title: todoData.title,
          description: todoData.description,
          date: todoData.date,
          completed: todoData.completed,
          user: user._id
        });
        
        await todo.save();
        console.log(`Created todo for ${user.navn}: ${todo.title}`);
      }
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();