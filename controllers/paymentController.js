import dotenv from 'dotenv';
dotenv.config();
import Stripe from 'stripe';
import { getCartCollection, getCoursesCollection, getEnrollmentCollection, getPaymentsCollection, getTemporaryTokensCollection } from '../collections.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateTemporaryToken = (length = 64) => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export const createCheckoutSession = async (req, res) => {
    try {
        const temporaryTokenCollection = await getTemporaryTokensCollection();
        const { userId, products } = req.body;
        const lineItems = products.map(product => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                    images: [product.image]
                },
                unit_amount: parseInt(product.price * 100),
            },
            quantity: 1,
        }));

        const courses = products.map(product => (
            {
                courseId: product.courseId,
                _instructorId: product._instructorId,
                courseName: product.name,
                price: product.price
            }
        ));

        // generate an unique token and save to database 
        const token = generateTemporaryToken(512);
        await temporaryTokenCollection.insertOne({ token })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:5173/paymentSuccess/${token}/{CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/cart?cancel=${token}&session={CHECKOUT_SESSION_ID}`,
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            metadata: {
                user_id: userId,
                courses: JSON.stringify(courses)
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve checkout session info with session ID
export const retrieveCheckoutSession = async (req, res) => {
    const { sessionId, token } = req.params;

    try {
        const coursesCollection = await getCoursesCollection();
        const cart = await getCartCollection();
        const paymentCollection = await getPaymentsCollection();
        const enrollmentCollection = await getEnrollmentCollection();
        const temporaryTokenCollection = await getTemporaryTokensCollection();

        // verify if the token exist
        const isTokenExist = await temporaryTokenCollection.findOne({ token });

        if (isTokenExist) {
            await temporaryTokenCollection.deleteOne({ token });

            // Fetch the session details from Stripe
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            // Retrieve the payment intent details for payment-specific information
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

            // Retrieve updated charge information
            const charges = await stripe.charges.list({ payment_intent: session.payment_intent });

            const courses = JSON.parse(session.metadata.courses);

            const courseIds = courses.map(course => course.courseId);

            // Insert payment info to the database
            const paymentInfo = {
                userId: session.metadata.user_id,
                courses: courses,
                amount: paymentIntent.amount_received / 100,
                status: paymentIntent.status,
                paymentMethod: paymentIntent.payment_method_types,
                transactionId: paymentIntent.id,
                receipt: charges.data[0].receipt_url,
                purchaseDate: new Date()
            };

            await paymentCollection.insertOne(paymentInfo);

            // Insert enrollment info to the database
            const enrollmentInfo = courses.map(({courseId, _instructorId, price}) => ({
                userId: session.metadata.user_id,
                _instructorId,
                courseId,
                enrollmentDate: new Date(),
                paymentId: paymentIntent.id,
                price,
                status: 'active',
                reviewed: false,
                complete: false,                
                totalLecturesWatched: 0
            }));

            await enrollmentCollection.insertMany(enrollmentInfo, { ordered: true });

            // Remove the courses from cart after enrollment        
            await cart.deleteMany({ courseId: { $in: courseIds } });

            // Increase student count for each course
            await coursesCollection.updateMany(
                { _id: { $in: courseIds.map(id => new ObjectId(id)) } },
                { $inc: { students: 1 } }
            );

            // Send success response
            res.json({ success: true });
        } else {
            return res.json({ success: false });
        }

    } catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).json({ error: error.message });
    }
};

// Expire checkout session by session ID
export const expireSession = async (req, res) => {
    const temporaryTokenCollection = await getTemporaryTokensCollection();
    try {
        const { sessionId, token } = req.body;
        await temporaryTokenCollection.deleteOne({ token });
        await stripe.checkout.sessions.expire(sessionId)

        res.status(200);
    } catch (error) {
        console.error('Error expiring session:', error);
        res.status(500).json({ error: error.message });
    }
}

// Retrieve payment info of student by studentID
export const getPaymentsData = async (req, res) => {
    try {
        const paymentCollection = await getPaymentsCollection();
        const { studentId } = req.params;

        const paymentsData = await paymentCollection.find(
            { userId: studentId },
            {
                projection: {
                    courses: 1,
                    amount: 1,
                    status: 1,
                    transactionId: 1,
                    receipt: 1,
                    purchaseDate: 1
                }
            }
        ).sort({ purchaseDate: -1 }).toArray();

        res.json(paymentsData);

    } catch (error) {
        console.error('Error retriving payments data:', error);
        res.status(500).json({ error: error.message });
    }
}
