# LibraryPro 📖

A modern, full-stack College Library Management System built with React (Vite) and Node.js/Express. It features a beautiful, responsive dark-themed UI and handles essential library operations efficiently.

## 🚀 Features

- **Dashboard:** At-a-glance statistics for total books, available books, issued books, and overdue records, along with a quick view of recent transactions.
- **Book Management:** Add, delete, and view books. Tracks total and available copies.
- **Student Management:** Add, edit, and remove student records (with custom branch options and phone number validation).
- **Issue & Return System:** Issue books to students with due dates, and process returns. Automatically updates available book counts and tracks overdue statuses.
- **Transaction History:** Comprehensive transaction logs with advanced filtering (Issued, Returned, Overdue) and search capabilities.
- **Secure Access:** Built-in login screen for restricted access.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Vanilla CSS (Custom dark theme with glassmorphism)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jemis-git/library-management.git
   cd library-management
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Start the Application**
   You can start both the frontend and backend simultaneously using the provided batch script:
   ```bash
   # On Windows
   start.bat
   ```
   *Alternatively, run them separately:*
   - Backend: `cd backend && node server.js` (Runs on Port 5000)
   - Frontend: `npm run dev` (Runs on Port 5173)

## 🔐 Default Credentials
- **Super Admin Username:** `Superadmin` (or `admin`)
- **Super Admin Password:** `admin123`
- **Tenant Accounts:** Self-register via the Registration page with complete data isolation.

---
*Developed for efficient college library administration.*
