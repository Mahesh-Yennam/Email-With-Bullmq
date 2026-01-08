import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import User from './models/user.js';
import sendMail from './utils/sendMail.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test');
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const bullClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: null,
});

// Define the queue name. All workers processing this queue must use the same name.
const myQueue = new Queue('email-queue', { connection: bullClient });

const workerFunction = async (job) => {
  console.log(`Processing job ${job.id}: Sending email to ${job.data.to}`);

  if (job.name === 'sendEmail') {
    const { to, subject, message } = job.data;
    await sendMail(to, subject, message);
    console.log(`✅ Email sent to ${to}`);
  }
};

const worker = new Worker('email-queue', workerFunction, { connection: bullClient, concurrency: 5 });

worker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

async function addJob(emailDetails) {
  const options = {
    // Optional job options:
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Initial delay of 1 second for retries
    },
    removeOnComplete: true, // Clean up completed jobs automatically
  };

  await myQueue.add('sendEmail', emailDetails, options);
  console.log(`Job added to queue for ${emailDetails.to}`);
}

// app.get('/', (req, res) => {
// //   addJob({ to: 'user1@example.com', subject: 'Welcome!', message: 'Thanks for signing up.' });
// //   addJob({ to: 'user2@example.com', subject: 'Newsletter', message: 'Read our latest updates.' });
//   res.render('login');
// });


let message = null;

app.get('/', (req, res) => {
  res.render('login', { message }) && (message = null);
});

app.post('/', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const user = await User.findOne({ email: email.toString().trim(), password }).lean();
  console.log(user);
  if (!user) {
    return res.render('login', { message: 'Invalid email or password' });
  }
  res.render('index')
});

app.get('/register', (req, res) => {
  res.render('signup');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email: email.toString().trim() }).lean();

  if (existingUser) {
    return res.render('login', { message: 'Email already registered' });
  }
  const newUser = new User({ email, password });
  await newUser.save();
  addJob({ to: email, subject: 'Welcome!', message: 'Thanks for signing up.' });

  message = 'Registration successful! Please log in.';
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
