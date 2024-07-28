const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// app.use(cors());
app.use(express.json());
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))

// Vefify JWT Token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' });
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: 'Unauthorized Access' })
        }
        req.decoded = decoded;
        next();
    })
}

//MONGO_DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cxwtjms.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const database = client.db('shikhoDB');
        const classesCollection = database.collection('classes');
        const usersCollection = database.collection('users');
        const selectedClassCollection = database.collection('selectedClass');
        const paymentsCollection = database.collection('payments');

        //JWT Token genarate
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '12h' });
            res.send({ token })
        })

        //Verify Instructor
        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'Forbidden Access' });
            }
            next();
        }

        //Verify Admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'Forbidden Access' });
            }
            next();
        }

        //Users API
        //get all users
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        // get user info
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        })

        app.get('/getSignupMethod/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const optoins = {
                projection: { _id: 0, signupMethod: 1 }
            };
            const signupMethod = await usersCollection.findOne(query, optoins);
            res.send(signupMethod);
        })

        //get user role api
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = await user?.role === 'student' && 'student' || user?.role === 'instructor' && 'instructor' || user?.role === 'admin' && 'admin';
            res.send(result);
        })

        //add user api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // update user info
        app.patch('/updateUser/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const { name, image } = updateInfo;
            console.log(name, image);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    name,
                    image
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //update user type/role 
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const updateRole = req.body;
            const { role } = updateRole
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: role
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })



        //API FOR CLASS DATA
        //get allClass Data
        app.get('/allClasses', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result)
        })

        //get all approved Class Data
        app.get('/classes', async (req, res) => {
            const page = req.query.page;
            const pageSize = parseInt(req.query.limit);
            const sortValue = parseInt(req.query.sort);
            const searchValue = req.query.search === "undefined" ? '' : req.query.search;
            const skipDocument = (page - 1) * pageSize;
            const query = { status: 'approved', name: { $regex: searchValue, $options: 'i' } };
            const cursor = sortValue ? classesCollection.find(query).sort({ price: sortValue }).skip(skipDocument).limit(pageSize) : classesCollection.find(query).skip(skipDocument).limit(pageSize);
            const classesCount = await classesCollection.countDocuments(query);
            const classes = await cursor.toArray();
            res.send({ classes, classesCount })
        })

        //get class by email
        app.get('/classes/:email', verifyJWT, verifyInstructor, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.send({ error: true, message: 'Forbidden Access' })
            }
            const query = { email: email }
            const result = await classesCollection.find(query).toArray();
            res.send(result)
        })

        //get topClass Data
        app.get('/topclass', async (req, res) => {
            const query = {};
            const options = {
                sort: { 'students': -1 }
            }
            const cursor = classesCollection.find(query, options);
            const result = await cursor.limit(6).toArray();
            res.send(result)
        })

        //get selected class 
        app.get('/selectedClass/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = {
                email: email
            }
            const result = await selectedClassCollection.find(query).toArray();
            res.send(result)
        })

        //Add new Class api
        app.post('/classes', verifyJWT, verifyInstructor, async (req, res) => {
            const newClass = req.body;
            const result = await classesCollection.insertOne(newClass);
            res.send(result);
        })

        //Add Selected class
        app.post('/selectClass/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const { email } = req.body;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { _id: 0, name: 1, image: 1, price: 1, instructorName: 1 }
            }
            const classData = await classesCollection.findOne(query, options)
            classData.email = email;
            classData.classId = id;
            const existingClass = await selectedClassCollection.findOne(classData)
            if (existingClass) {
                return res.send({ error: true, message: 'class already added' })
            }
            const result = await selectedClassCollection.insertOne(classData);
            res.send(result);

        })

        //Update Class data by id
        app.patch('/classes/:id', verifyJWT, verifyInstructor, async (req, res) => {
            const id = req.params.id;
            const classData = req.body;
            const { price, seats } = classData;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    price: price, seats: seats
                },
            }
            const result = await classesCollection.updateOne(filter, updateDoc)
            res.send(result);
        })

        //Update class feedback by id
        app.patch('/feedback/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const classData = req.body;
            const { feedback } = classData;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    feedback: feedback
                },
            }
            console.log(classData)
            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //update class status by id
        app.patch('/status/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const classData = req.body;
            const { status } = classData;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: status
                },
            }
            console.log(classData)
            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //Delete class by id
        app.delete('/classes/:id', verifyJWT, verifyInstructor, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/selectedClass/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await selectedClassCollection.deleteOne(query);
            res.send(result)
        })

        //API FOR INSTRUCTOR DATA

        //get allInstructors Data
        app.get('/instructors', async (req, res) => {
            const query = { role: 'instructor' };
            const cursor = usersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //get topInstructorsData
        app.get('/topinstructors', async (req, res) => {
            // step1: find all instructor email
            const query = { role: 'instructor' };
            const options = {
                projection: { _id: 0, email: 1 }
            };
            const cursor = usersCollection.find(query, options);
            const instructorsEmailCollection = await cursor.toArray();

            //step2: find total student of each instructor            
            async function getPopularInstructors() {
                const promises = instructorsEmailCollection.map(async ({ email }) => {
                    const pipeline = [
                        { $match: { email: email } },
                        { $group: { _id: '$email', totalStudents: { $sum: '$students' } } },
                        { $project: { _id: 0, email: '$_id', totalStudents: 1 } }
                        // { $sort: { totalStudents: -1 } } //sorting not working in this senario
                    ];

                    const findTotalStudent = classesCollection.aggregate(pipeline);
                    const res = await findTotalStudent.toArray();

                    if (res.length) {
                        return res[0];
                    }
                });

                const results = await Promise.all(promises);

                // Filter out any undefined results before logging
                const filteredResults = results.filter(result => result !== undefined);
                console.log(filteredResults);
                // Sort the results in descending order based on totalStudents
                const sortedResults = filteredResults.sort((a, b) => b.totalStudents - a.totalStudents);

                let sortedInstructor = sortedResults.slice(0, 6);
                let getInstructorPromise = sortedInstructor.map(async (instructor) => {
                    let query = { email: instructor.email };
                    let result = await usersCollection.findOne(query);
                    return result;
                })

                const popularInstructor = await Promise.all(getInstructorPromise);
                res.send(popularInstructor);
            }

            getPopularInstructors();
        })


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
            const deleteResult = await selectedClassCollection.deleteOne(query)

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

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running');
})

app.listen(port, () => {
    console.log('server running on port: ', port);
})