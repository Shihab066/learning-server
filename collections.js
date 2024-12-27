import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;
let isConnected = false;

async function connectToDatabase() {
    if (!isConnected) {
        await client.connect();
        db = client.db('shikhoDB');
        isConnected = true;
        console.log("Connected to MongoDB successfully!");
    }
    return db;
};

export async function getCoursesCollection() {
    const database = await connectToDatabase();
    return database.collection('classes');
};

export async function getReviewsCollection() {
    const database = await connectToDatabase();
    return database.collection('coursesReviews');
};

export async function getUsersCollection() {
    const database = await connectToDatabase();
    return database.collection('users');
};

export async function getCartCollection() {
    const database = await connectToDatabase();
    return database.collection('cart');
};

export async function getWishlistCollection() {
    const database = await connectToDatabase();
    return database.collection('wishList');
};

export async function getPaymentsCollection() {
    const database = await connectToDatabase();
    return database.collection('payments');
};

export async function getEnrollmentCollection() {
    const database = await connectToDatabase();
    return database.collection('enrollment');
};

export async function getVideoPlaylistCollection() {
    const database = await connectToDatabase();
    return database.collection('videoPlaylist');
};

export async function getTemporaryTokensCollection() {
    const database = await connectToDatabase();
    return database.collection('temporaryTokens');
};

export async function getFeedbackCollection() {
    const database = await connectToDatabase();
    return database.collection('feedback');
};

export async function getBannerCollection() {
    const database = await connectToDatabase();
    return database.collection('banner');
};

export async function getSuspendedUsersCollection() {
    const database = await connectToDatabase();
    return database.collection('suspendedUsers');
};