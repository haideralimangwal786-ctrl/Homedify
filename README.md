




### 🏠 Homedify – Empowering Women Through E-Commerce

Homedify is a full-stack e-commerce marketplace developed as a Final Year Project (FYP). The platform is designed to empower female home-based sellers by providing a secure online marketplace where they can showcase and sell their products while customers can browse, purchase, and review items.

---

## 🚀 Project Overview

Homedify connects female entrepreneurs with customers through a modern and user-friendly platform. The system includes secure authentication, product management, order processing, payment integration, and AI-powered seller verification.

---

## ✨ Key Features

### 👩 Seller Features
- Seller Registration & Login
- Product Management
- Product Upload with Images
- Order Management
- Sales Tracking
- Profile Management

### 🛍️ Customer Features
- User Registration & Login
- Browse Products
- Search & Filter Products
- Add to Cart
- Place Orders
- Order Tracking
- Product Reviews & Ratings
- Wishlist/Favorites

### 👨‍💼 Admin Features
- Admin Dashboard
- User Management
- Seller Approval System
- Product Moderation
- Order Monitoring
- Platform Analytics

### 🤖 AI Verification System
- CNIC Verification
- Face Detection
- Face Matching
- Identity Validation
- Fraud Prevention

### 💳 Payment System
- SafePay Integration
- Secure Checkout
- Order Confirmation

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript (ES6+)
- CSS3

### Backend
- Node.js
- Express.js
- JWT Authentication
- REST APIs

### Database
- MongoDB Atlas
- Mongoose

### AI Microservice
- Python
- Flask
- DeepFace
- MTCNN
- EasyOCR
- TensorFlow

### Payment Gateway
- SafePay Sandbox

---

## 📂 Project Structure

```bash
Homedify/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── uploads/
│   └── package.json
│
├── Ai_Model/
│   ├── api.py
│   ├── models/
│   └── processed/
│
└── README.md
```

---

## 📸 Screenshots

### Homedify system

<img width="387" height="227" alt="Homedify (7)" src="https://github.com/user-attachments/assets/4bebc8de-02e0-4cea-a3e7-76c07aa3f091" />

---

### Landing Page
<img width="1920" height="9572" alt="screencapture-localhost-5173-2026-06-16-22_50_37" src="https://github.com/user-attachments/assets/750a4e4c-9279-44fb-97f9-ee638f07b2f1" />

---

### Shop page

<img width="1920" height="1800" alt="screencapture-localhost-5173-shop-2026-06-16-23_27_28" src="https://github.com/user-attachments/assets/ada0c3d6-c586-47b6-a14c-4bc05aa4fcbf" />

---

### Login and Sigup

<img width="1920" height="1207" alt="screencapture-localhost-5173-register-2026-06-09-07_28_25" src="https://github.com/user-attachments/assets/2a6d27e2-5892-4964-9e7a-0e5fa6f73277" />

---

### Seller Dashboard

<img width="1524" height="1649" alt="screencapture-localhost-5173-seller-dashboard-2026-06-21-05_05_05" src="https://github.com/user-attachments/assets/345fba7c-1e4e-4cb9-b6fd-bfee01dc6755" />

---

### Admin Panel

<img width="1556" height="1118" alt="screencapture-localhost-5173-admin-2026-06-21-05_03_44" src="https://github.com/user-attachments/assets/f6fcab5a-e34c-4bfc-851f-8d5a54e4629c" />


---

### User Dashboard

<img width="1571" height="900" alt="screencapture-localhost-5173-customer-dashboard-2026-06-17-00_31_13" src="https://github.com/user-attachments/assets/72691b3c-a743-4d1e-b69f-3a491ed664ae" />

---

## ⚙️ Installation Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/haideralimangwal786-ctrl/Homedify.git
```

### Step 2: Open Project

```bash
cd Homedify
```

---

## Backend Setup

### Navigate to Backend

```bash
cd backend
```

### Install Dependencies

```bash
npm install
```

### Create .env File

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:5001
```

### Run Backend

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

## Frontend Setup

### Navigate to Frontend

```bash
cd frontend
```

### Install Dependencies

```bash
npm install
```

### Run Frontend

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

## AI Service Setup

### Navigate to AI Model Folder

```bash
cd Ai_Model
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

### Install Requirements

```bash
pip install -r requirements.txt
```

### Run AI Service

```bash
python api.py
```

AI Service will run on:

```text
http://localhost:5001
```

---

## 🔒 Security Features

- JWT Authentication
- Password Encryption
- Secure Payment Processing
- CNIC Verification
- Face Matching Authentication
- Protected API Routes

---

## 🌟 Future Enhancements

- Mobile Application
- Real-Time Chat System
- Recommendation Engine
- Multi-Payment Support
- Cloud Image Storage
- Advanced Analytics Dashboard

---

## 👨‍💻 Developer

**Haider Ali**

Computer Science Student  
Full Stack MERN Developer  
Flutter Developer

### Connect With Me

- GitHub: https://github.com/haideralimangwal786-ctrl
- LinkedIn: Add Your LinkedIn Profile
- Email: haideralimangwal786@gmail.com

---

## 📜 License

This project was developed for educational and academic purposes as a Final Year Project (FYP).
