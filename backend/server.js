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
app.use(express.json());      // Parse JSON data

// 3. Connect to MongoDB (local MongoDB Compass)
mongoose.connect('mongodb://localhost:27017/library_db')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
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
  available: Number       // Available copies
});
const Book = mongoose.model('Book', BookSchema);

// Student schema
const StudentSchema = new mongoose.Schema({
  name: String,           // Student name
  rollNo: String,         // Roll number
  branch: String,         // Branch
  year: String,           // Year
  phone: String,          // Phone number
  email: String           // Email
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
  status: String           // 'issued', 'returned', 'overdue'
});
const Transaction = mongoose.model('Transaction', TransactionSchema);


// =============================================
// BOOK ROUTES
// =============================================

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Add a new book
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
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Update a book (for available count)
app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});


// =============================================
// STUDENT ROUTES
// =============================================

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
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
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Update a student
app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});



// =============================================
// TRANSACTION ROUTES
// =============================================

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find();
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
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: 'returned', returnDate: req.body.returnDate },
      { new: true }
    );
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
