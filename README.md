# Learning Management System (LMS) Backend

## 🚀 Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB**
- **Firebase** (Secure Token Generation)
- **Cloudinary** (Media Uploads)
- **Stripe** (Payment Processing)

## 📌 Features
- JWT-based authentication
- Secure JWT-based API integration
- Role-based access control (Admin, Instructor, Student)
- Course and instructor management
- Secure media uploads via Cloudinary
- Payment integration with Stripe

## 📂 Folder Structure
```
backend/
├── controllers/
│   ├── authorizationController.js
│   ├── bannerController.js
│   ├── cartController.js
│   ├── courseController.js
│   ├── dashboardController.js
│   ├── feedbackController.js
│   ├── instructorController.js
│   ├── jwtController.js
│   ├── mediaUploadController.js
│   ├── paymentController.js
│   ├── reviewController.js
│   ├── suspensionController.js
│   ├── userController.js
│   ├── wishlistController.js
│
├── routes/
│   ├── bannerRouter.js
│   ├── cartRouter.js
│   ├── courseRouter.js
│   ├── dashboardRouter.js
│   ├── feedbackRouter.js
│   ├── instructorRouter.js
│   ├── jwtRouter.js
│   ├── mediaUploadRouter.js
│   ├── paymentRouter.js
│   ├── reviewRouter.js
│   ├── suspensionRouter.js
│   ├── userRouter.js
│   ├── wishlistRouter.js
│
├── collections.js
├── index.js
```

## 🔧 Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Shihab066/learning-server.git
cd learning-server
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and add the following:
```
MONGODB_URI=your_mongodb_connection_string
SECRET_TOKEN=your_random_hex_token (256+ characters recommended)
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUD_NAME=your_cloudinary_cloud_name
IMAGE_UPLOAD_PRESET=your_cloudinary_preset_for_images
VIDEO_UPLOAD_PRESET=your_cloudinary_preset_for_videos
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_SECRET_KEY=your_cloudinary_secret_key
FIREBASE_SERVICE_ACCOUNT_KEY={"A":"One","B":"two","C":"three"}  # JSON format
```

### 4️⃣ Run the Server
```sh
npm run dev
```
The server will start on **http://localhost:PORT** (default port: 5000).

## 🔒 Authentication & Security
- Uses **JWT (JSON Web Token)** for authentication.
- Middleware verification:
  - `verifyToken` → Ensures valid JWT.
  - `verifyActiveUser` → Prevents suspended users from accessing resources.
  - `verifyRole(student, instructor, admin)` → Restricts access based on roles.
- Secure **JWT Token Generation**:
  - Extracts Firebase **access token** and verifies it using Firebase Admin SDK.
  - Generates a **custom JWT** with necessary user data for secure API access.

## 🛢️ Database
- Uses **MongoDB** for data storage.
- Collections include:
  - `users`
  - `suspendedUsers`
  - `courses`
  - `coursesReviews`
  - `payments`
  - `enrollment`
  - `banner`
  - `cart`
  - `wishlist`
  - `reviews`
  - `feedback`
  - `temporaryTokens`



