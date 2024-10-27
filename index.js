import express from 'express';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import cors from 'cors';
import Stripe from 'stripe';
import userRouter from './routes/userRouter.js';
import courseRouter from './routes/courseRouter.js';
import cartRouter from './routes/cartRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import instructorRouter from './routes/instructorRouter.js';
import jwtRouter from './routes/jwtRouter.js';
import mediaUploadRouter from './routes/mediaUploadRouter.js';
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

const corsConfig = {
    origin: ['https://learning-point-us.vercel.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}

app.use(cors(corsConfig))
app.options("", cors(corsConfig))

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// let coursesCollection, reviewsCollection, usersCollection, cart, paymentsCollection;

async function run() {
    try {
        //create intents
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({ clientSecret: paymentIntent.client_secret })
        })

        //payment related api
        //get payment data
        app.get('/paymentsData/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await paymentsCollection.find(query).sort({ date: -1 }).toArray();
            res.send(result)
        })

        //add payment data
        app.post('/payments', verifyJWT, async (req, res) => {
            const { payment, id, classId } = req.body;
            const insertPayment = await paymentsCollection.insertOne(payment);

            const query = { _id: new ObjectId(id) };
            const deleteResult = await cart.deleteOne(query)

            const classQuery = { _id: new ObjectId(classId) }
            const findClass = await classesCollection.findOne(classQuery)
            const { seats, students } = findClass;
            const updateDoc = {
                $set: {
                    students: students + 1,
                    seats: seats - 1
                }
            }
            const updateClass = await classesCollection.updateOne(classQuery, updateDoc)

            res.send(insertPayment);
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
// run().catch(console.dir);


// app.listen(port, () => {
//     console.log('server running on port: ', port);
// })

let coursesCollection, reviewsCollection, usersCollection, cart, paymentsCollection, videoPlaylistCollection;

// Connect to MongoDB
client.connect()
    .then(async () => {
        const database = client.db('shikhoDB');
        coursesCollection = database.collection('classes');
        reviewsCollection = database.collection('coursesReviews');
        usersCollection = database.collection('users');
        cart = database.collection('selectedClass');
        paymentsCollection = database.collection('payments');
        videoPlaylistCollection = database.collection('videoPlaylist');

        app.get('/', (req, res) => {
            res.send('server is running');
        })

        app.listen(port, () => {
            console.log(`Server running on port: ${port}`);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err)
    });

export { coursesCollection, reviewsCollection, usersCollection, cart, paymentsCollection, videoPlaylistCollection };

// API Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/instructor', instructorRouter);
app.use('/api/v1/course', courseRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/token', jwtRouter);
app.use('/api/v1/upload', mediaUploadRouter);