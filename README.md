# Skill Swap Platform

A collaborative web application that allows users to exchange skills and expertise with one another. Users can browse other members, request skill swaps, chat in real-time, and rate their experiences.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

The Skill Swap Platform is a full-stack application designed to connect people who want to exchange skills. Whether you want to learn programming, language, music, or any other skill, this platform provides a safe and interactive way to connect with others and exchange knowledge.

## 🛠 Technology Stack

### Frontend
- **React** (v19.2.4) - UI library
- **React Router DOM** (v7.13.1) - Client-side routing
- **Axios** (v1.14.0) - HTTP client for API calls
- **Socket.io Client** (v4.8.3) - Real-time communication
- **Bootstrap** (v5.3.8) - CSS framework
- **React Scripts** (v5.0.1) - Build tooling

### Backend
- **Node.js** - JavaScript runtime
- **Express** (v4.18.2) - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** (v8.0.0) - ODM for MongoDB
- **Socket.io** (v4.8.3) - Real-time communication
- **JWT** (v9.0.0) - Authentication
- **Bcryptjs** (v2.4.3) - Password hashing
- **Multer** (v2.1.1) - File upload middleware
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing
- **Dotenv** (v16.0.3) - Environment variable management

## 📁 Project Structure

```
skill-swap-platform/
├── backend/                          # Node.js/Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection configuration
│   ├── controllers/
│   │   ├── adminAuth.js             # Admin authentication logic
│   │   ├── adminController.js       # Admin dashboard logic
│   │   ├── authController.js        # User authentication & registration
│   │   ├── messageController.js     # Message handling
│   │   ├── ratingController.js      # Rating/review logic
│   │   ├── swapController.js        # Skill swap request logic
│   │   └── userController.js        # User profile management
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Message.js               # Message schema
│   │   ├── Rating.js                # Rating schema
│   │   └── SwapRequest.js           # Swap request schema
│   ├── routes/
│   │   ├── authRoutes.js            # Authentication endpoints
│   │   ├── adminRoutes.js           # Admin endpoints
│   │   ├── userRoutes.js            # User profile endpoints
│   │   ├── messageRoutes.js         # Messaging endpoints
│   │   ├── ratingRoutes.js          # Rating endpoints
│   │   └── swapRoutes.js            # Swap request endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT authentication middleware
│   │   └── upload.js                # File upload configuration
│   ├── socket/                      # Socket.io event handlers
│   ├── uploads/                     # File storage directory
│   ├── server.js                    # Express server entry point
│   ├── package.json
│   └── .env                         # Environment variables (not committed)
│
├── frontend/                         # React application
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── App.js                   # Main App component
│   │   ├── index.js                 # Entry point
│   │   ├── index.css                # Global styles
│   │   ├── components/
│   │   │   ├── Logo.js              # Logo component
│   │   │   └── Navbar.js            # Navigation bar
│   │   ├── context/                 # React context for state management
│   │   ├── pages/
│   │   │   ├── Home.js              # Home/landing page
│   │   │   ├── Login.js             # User login page
│   │   │   ├── Register.js          # User registration page
│   │   │   ├── Dashboard.js         # User dashboard
│   │   │   ├── Profile.js           # User profile page
│   │   │   ├── BrowseUsers.js       # Browse other users
│   │   │   ├── SwapRequests.js      # View/manage swap requests
│   │   │   ├── ChatPage.js          # Real-time messaging
│   │   │   ├── Ratings.js           # View/manage ratings
│   │   │   ├── AdminLogin.js        # Admin login
│   │   │   └── AdminDashboard.js    # Admin management dashboard
│   │   ├── services/
│   │   │   └── api.js               # API service with Axios
│   │   └── package.json
│   └── README.md
│
├── uploads/                         # Shared uploads directory
├── .git/                            # Git repository
└── README.md                        # This file
```

## ✨ Features

### User Features
- **User Authentication** - Secure registration and login with JWT
- **Profile Management** - Create and update user profiles with skills
- **Browse Users** - Discover other members and their skills
- **Skill Swaps** - Request and manage skill exchange requests
- **Real-time Messaging** - Chat with other users via Socket.io
- **Ratings & Reviews** - Rate and review completed skill exchanges
- **File Uploads** - Upload profile pictures and other media

### Admin Features
- **Admin Dashboard** - Manage platform users and content
- **User Management** - View, moderate, and remove users
- **Platform Analytics** - Monitor platform activity and statistics
- **Admin Authentication** - Secure admin login system

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas for cloud hosting
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd skill-swap-platform
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the backend directory with the following variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/skill-swap-platform
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/skill-swap-platform

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the frontend directory (if needed):
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🏃 Running the Application

### Start MongoDB

If using local MongoDB:
```bash
mongod
```

If using MongoDB Atlas, ensure your connection string is set in `.env`.

### Start the Backend

In the backend directory:
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend will start on `http://localhost:5000`

### Start the Frontend

In a new terminal, in the frontend directory:
```bash
npm start
```

The frontend will open on `http://localhost:3000`

## 🔌 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/profile` - Get current user profile (protected)

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile by ID
- `PUT /api/users/:id` - Update user profile (protected)
- `DELETE /api/users/:id` - Delete user account (protected)
- `GET /api/users/:id/skills` - Get user's skills

### Swap Request Endpoints
- `POST /api/swaps` - Create a new swap request (protected)
- `GET /api/swaps` - Get all swap requests
- `GET /api/swaps/:id` - Get swap request details
- `PUT /api/swaps/:id` - Update swap request (protected)
- `DELETE /api/swaps/:id` - Delete swap request (protected)

### Message Endpoints
- `POST /api/messages` - Send a message (protected)
- `GET /api/messages/:userId` - Get conversation with user (protected)
- `GET /api/messages` - Get all messages (protected)

### Rating Endpoints
- `POST /api/ratings` - Create a rating (protected)
- `GET /api/ratings/:userId` - Get ratings for a user
- `GET /api/ratings` - Get all ratings

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/stats` - Get platform statistics (admin only)
- `DELETE /api/admin/users/:id` - Remove user (admin only)

## 🔐 Environment Variables

### Backend `.env` Variables
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development, production |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/skill-swap |
| JWT_SECRET | JWT signing secret | your_secret_key |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| UPLOAD_DIR | File upload directory | ./uploads |
| MAX_FILE_SIZE | Maximum file size in bytes | 5242880 |

### Frontend `.env` Variables
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000 |

## 💾 Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  skills: [String],
  bio: String,
  profilePicture: String,
  isAdmin: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### SwapRequest Model
```javascript
{
  initiator: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  skillOffered: String,
  skillRequested: String,
  status: String (pending, accepted, completed, rejected),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  sender: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  message: String,
  timestamp: Date
}
```

### Rating Model
```javascript
{
  rater: ObjectId (ref: User),
  rated: ObjectId (ref: User),
  score: Number (1-5),
  review: String,
  createdAt: Date
}
```

## 🤝 Contributing

We welcome contributions to improve the Skill Swap Platform! Here's how you can help:

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/skill-swap-platform.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes** and commit them
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request** with a clear description of your changes

### Code Standards
- Follow the existing code style
- Add comments for complex logic
- Test your changes before submitting
- Keep commits small and focused

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 💬 Support

For support, questions, or issues:
- Open an issue on GitHub
- Contact the development team
- Check the documentation in each module

---

**Last Updated:** April 2026

Made with ❤️ for skill sharing and community learning
