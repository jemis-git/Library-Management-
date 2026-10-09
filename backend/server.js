// =============================================
// Library Management System - Backend Server
// Simple Express + MongoDB Server
// =============================================

// 1. Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 2. App setup
const app = express();
app.use(cors());              // Allow frontend requests
app.use(express.json({ limit: '10mb' }));      // Parse JSON data (with 10mb limit for logos)
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 3. Connect to MongoDB (local MongoDB Compass)
mongoose.connect('mongodb://localhost:27017/library_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    await ensureSuperadmin();
  })
  .catch((err) => console.log('❌ MongoDB error:', err));


// =============================================
// DATABASE MODELS (Schema)
// =============================================

// Book schema
const BookSchema = new mongoose.Schema({
  title: String,          // Book title
  author: String,         // Author name
  genre: String,          // Subject/genre
  isbn: String,           // ISBN number
  copies: Number,         // Total copies
  available: Number,      // Available copies
  accountUsername: { type: String, default: '' } // Isolated per account
});
const Book = mongoose.model('Book', BookSchema);

// Student schema
const StudentSchema = new mongoose.Schema({
  name: String,           // Student name
  rollNo: String,         // Roll number
  branch: String,         // Branch
  year: String,           // Year
  phone: String,          // Phone number
  email: String,          // Email
  accountUsername: { type: String, default: '' } // Isolated per account
});
const Student = mongoose.model('Student', StudentSchema);

// Transaction schema (book issue/return)
const TransactionSchema = new mongoose.Schema({
  bookId: String,
  studentId: String,
  bookTitle: String,
  studentName: String,
  rollNo: String,
  issueDate: String,
  dueDate: String,
  returnDate: String,
  status: String,          // 'issued', 'returned', 'overdue'
  accountUsername: { type: String, default: '' } // Isolated per account
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// User schema (Registration & Authentication)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  role: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Seed or ensure Superadmin and Admin users exist in MongoDB
async function ensureSuperadmin() {
  try {
    const existing = await User.findOne({
      $or: [
        { username: { $regex: /^superadmin$/i } },
        { email: 'superadmin@library.system' }
      ]
    });
    if (!existing) {
      await User.create({
        username: 'Superadmin',
        email: 'superadmin@library.system',
        password: 'admin123',
        companyName: 'Library Management System',
        logo: '',
        role: 'Super Admin'
      });
      console.log('👑 Superadmin user initialized: Superadmin / admin123');
    } else {
      if (existing.role !== 'Super Admin') {
        existing.role = 'Super Admin';
        await existing.save();
      }
    }

    // Also ensure default Admin user exists in MongoDB
    const existingAdmin = await User.findOne({
      $or: [
        { username: { $regex: /^admin$/i } },
        { email: 'admin@library.edu' }
      ]
    });
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: 'admin@library.edu',
        password: 'admin123',
        companyName: 'Library Management',
        logo: '',
        role: 'Super Admin'
      });
      console.log('🛡️ Default admin user initialized: admin / admin123');
    }
  } catch (err) {
    console.error('Error seeding default admin users:', err);
  }
}


// =============================================
// AUTH & REGISTRATION ROUTES
// =============================================

// Register a new user
app.post(['/api/register', '/api/auth/register'], async (req, res) => {
  try {
    const { email, username, password, confirmPassword, companyName, logo } = req.body;

    // Validate required fields
    if (!email || !username || !password || !companyName) {
      return res.status(400).json({ error: 'All fields (Email, Username, Password, Company Name) are required!' });
    }

    // Validate passwords match
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match!' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long!' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = companyName.trim();

    if (cleanUsername.toLowerCase() === 'superadmin') {
      return res.status(400).json({ error: 'Username "Superadmin" is reserved for the primary system administrator.' });
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken! Please choose another.' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered! Please sign in or use another email.' });
    }

    // Save to database
    const newUser = new User({
      email: cleanEmail,
      username: cleanUsername,
      password: password,
      companyName: cleanCompany,
      logo: logo || '',
      role: 'Admin'
    });
    await newUser.save();

    res.status(201).json({
      message: 'Registration successful! You can now sign in.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        companyName: newUser.companyName,
        logo: newUser.logo,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user. Please try again.' });
  }
});

// Login user
app.post(['/api/login', '/api/auth/login'], async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please enter both username and password!' });
    }

    const cleanLogin = username.trim();

    // 1. Check Superadmin explicitly
    if (cleanLogin.toLowerCase() === 'superadmin') {
      let saUser = await User.findOne({ username: { $regex: /^superadmin$/i } });
      if (!saUser) {
        saUser = await User.create({
          username: 'Superadmin',
          email: 'superadmin@library.system',
          password: 'admin123',
          companyName: 'Library Management System',
          logo: '',
          role: 'Super Admin'
        });
      }
      if (saUser.password === password) {
        return res.json({
          message: 'Login successful as Superadmin! 👑',
          user: {
            id: saUser._id,
            username: saUser.username,
            email: saUser.email,
            companyName: saUser.companyName || 'Library Management System',
            logo: saUser.logo || '',
            role: 'Super Admin',
            isSuperAdmin: true
          }
        });
      } else {
        return res.status(401).json({ error: 'Invalid password for Superadmin!' });
      }
    }

    // 2. Find registered user in MongoDB by username or email
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanLogin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { email: cleanLogin.toLowerCase() }
      ]
    });

    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password!' });
      }
      const isSuper = user.role === 'Super Admin' || user.username.toLowerCase() === 'superadmin' || user.username.toLowerCase() === 'admin';
      return res.json({
        message: 'Login successful!',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          companyName: user.companyName,
          logo: user.logo || '',
          role: user.role,
          isSuperAdmin: isSuper
        }
      });
    }

    // 3. Fallback for default admin
    if (cleanLogin.toLowerCase() === 'admin') {
      let adminUser = await User.findOne({ username: { $regex: /^admin$/i } });
      const adminPass = adminUser ? adminUser.password : 'admin123';
      if (password === adminPass) {
        return res.json({
          message: 'Login successful as Admin!',
          user: {
            username: 'admin',
            email: 'admin@library.edu',
            companyName: 'Library Management',
            logo: '',
            role: 'Super Admin',
            isSuperAdmin: true
          }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid username or password!' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// Fetch registered company name and logo
app.get('/api/company', async (req, res) => {
  try {
    const { account } = req.query;
    let targetUser = null;
    if (account && account.toLowerCase() !== 'superadmin') {
      const cleanAcc = String(account).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      targetUser = await User.findOne({ username: { $regex: new RegExp(`^${cleanAcc}$`, 'i') } });
    }
    if (!targetUser) {
      targetUser = await User.findOne({ username: { $not: /^superadmin$/i } }).sort({ createdAt: -1 });
    }
    res.json({
      companyName: targetUser ? targetUser.companyName : 'Library Management',
      logo: targetUser && targetUser.logo ? targetUser.logo : ''
    });
  } catch (err) {
    res.json({ companyName: 'Library Management', logo: '' });
  }
});


// =============================================
// SUPER ADMIN ACCOUNTS ROUTES
// =============================================

// Get all registered accounts with statistics (Super Admin panel)
app.get('/api/accounts', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    const accountsWithStats = await Promise.all(
      users.map(async (u) => {
        const cleanName = u.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usernameRegex = new RegExp(`^${cleanName}$`, 'i');
        const isLegacyAdmin = u.username.toLowerCase() === 'admin';

        const filter = isLegacyAdmin
          ? { $or: [{ accountUsername: usernameRegex }, { accountUsername: { $in: ['', null] } }] }
          : { accountUsername: usernameRegex };

        const [booksCount, studentsCount, activeIssuesCount] = await Promise.all([
          Book.countDocuments(filter),
          Student.countDocuments(filter),
          Transaction.countDocuments({ ...filter, status: { $in: ['issued', 'overdue'] } })
        ]);

        return {
          id: u._id,
          username: u.username,
          email: u.email,
          companyName: u.companyName,
          logo: u.logo || '',
          role: u.role || 'Admin',
          createdAt: u.createdAt,
          booksCount,
          studentsCount,
          activeIssuesCount
        };
      })
    );

    res.json(accountsWithStats);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts list' });
  }
});

// Delete account (Super Admin only)
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const accountParam = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(accountParam)) {
      user = await User.findById(accountParam);
    }
    if (!user) {
      const cleanParam = String(accountParam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ username: { $regex: new RegExp(`^${cleanParam}$`, 'i') } });
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    if (user.username.toLowerCase() === 'superadmin' || user.username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'System administrator accounts cannot be deleted!' });
    }

    // Clean up this account's books, students, and transactions
    const cleanUser = user.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usernameRegex = new RegExp(`^${cleanUser}$`, 'i');
    await Promise.all([
      Book.deleteMany({ accountUsername: usernameRegex }),
      Student.deleteMany({ accountUsername: usernameRegex }),
      Transaction.deleteMany({ accountUsername: usernameRegex }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({ message: `Account "${user.username}" and associated library data removed successfully!` });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Reveal account username & password (protected by Superadmin password)
app.post('/api/accounts/:id/credentials', async (req, res) => {
  try {
    const { superadminPassword } = req.body;
    if (!superadminPassword || typeof superadminPassword !== 'string') {
      return res.status(400).json({ error: 'Superadmin password is required.' });
    }

    // 1. Verify Superadmin password against database
    const superadminUser = await User.findOne({
      $or: [
        { username: { $regex: /^superadmin$/i } },
        { role: 'Super Admin' }
      ]
    });

    const isMatch = (superadminUser && superadminUser.password === superadminPassword) ||
                    (!superadminUser && superadminPassword === 'admin123');

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect Superadmin password!' });
    }

    // 2. Retrieve target account (support ObjectId or username)
    const accountParam = req.params.id;
    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(accountParam)) {
      targetUser = await User.findById(accountParam);
    }
    if (!targetUser) {
      const cleanParam = String(accountParam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      targetUser = await User.findOne({ username: { $regex: new RegExp(`^${cleanParam}$`, 'i') } });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    res.json({
      id: targetUser._id,
      username: targetUser.username,
      password: targetUser.password,
      email: targetUser.email,
      companyName: targetUser.companyName
    });
  } catch (err) {
    console.error('Error revealing account credentials:', err);
    res.status(500).json({ error: 'Failed to retrieve account credentials.' });
  }
});

// Change user password (persists directly in MongoDB)
app.put('/api/users/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { email: cleanUsername.toLowerCase() }
      ]
    });

    if (user) {
      if (user.password !== currentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect!' });
      }
      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password updated successfully!' });
    }

    return res.status(404).json({ error: 'User account not found.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});





// =============================================
// BOOK ROUTES (Account Isolated)
// =============================================

// Helper for multi-tenant query filter
function buildAccountFilter(account) {
  if (!account || account === 'all' || account.toLowerCase() === 'superadmin') {
    return {};
  }
  if (account.toLowerCase() === 'admin') {
    return {
      $or: [
        { accountUsername: { $regex: /^admin$/i } },
        { accountUsername: { $in: ['', null] } }
      ]
    };
  }
  const cleanAccount = String(account).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { accountUsername: { $regex: new RegExp(`^${cleanAccount}$`, 'i') } };
}

// Get books (filtered by account or all for Superadmin)
app.get('/api/books', async (req, res) => {
  try {
    const filter = buildAccountFilter(req.query.account);
    const books = await Book.find(filter);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Add a new book (tagged with accountUsername)
app.post('/api/books', async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.json(newBook);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save book' });
  }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Book ID' });
    }
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Update a book (for available count)
app.put('/api/books/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Book ID' });
    }
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    const book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});


// =============================================
// STUDENT ROUTES (Account Isolated)
// =============================================

// Get students (filtered by account or all for Superadmin)
app.get('/api/students', async (req, res) => {
  try {
    const filter = buildAccountFilter(req.query.account);
    const students = await Student.find(filter);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add a new student
app.post('/api/students', async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save student' });
  }
});

// Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Update a student
app.put('/api/students/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});


// =============================================
// TRANSACTION ROUTES (Account Isolated)
// =============================================

// Get transactions (with automatic overdue check)
app.get('/api/transactions', async (req, res) => {
  try {
    const filter = buildAccountFilter(req.query.account);
    const today = new Date().toISOString().split('T')[0];

    // Atomically mark any past-due issued transactions as overdue
    await Transaction.updateMany(
      { ...filter, status: 'issued', dueDate: { $lt: today, $ne: '' } },
      { $set: { status: 'overdue' } }
    );

    const transactions = await Transaction.find(filter);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Issue a book (new transaction)
app.post('/api/transactions', async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();
    res.json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// Return a book (update transaction)
app.put('/api/transactions/:id/return', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Transaction ID' });
    }
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: 'returned', returnDate: req.body.returnDate || new Date().toISOString().split('T')[0] },
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process return' });
  }
});


// =============================================
// SERVER START
// =============================================
app.listen(5000, () => {
  console.log('🚀 Server is running at: http://localhost:5000');
  console.log('📚 Library Management System Ready!');
});
