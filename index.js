const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");
const { MONGO_URL } = process.env;
const PORT = 4000 || process.env
const User = require('./Models/UserModel')
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));


app.use(
  cors({
    origin: ["http://localhost:3000/signin"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());

app.use("/", authRoute);
app.get("/", (req, res) => {
  res.send("Hello World");
});
// app.post('/update-payment/:userId', (req, res) => {
//   const userId = parseInt(req.params.userId);
  
//   // Update the user's payment status in the database
//   // Set user.paid = true for the specified user
  
//   // Generate a new JWT token with the user's payment status
//   const token = createSecretToken(userId, true);
  
//   res.json({ token });
// });

app.post('/initiate-payment', async (req, res) => {
  try {
    // Create a new payment request with Paystack
    const paymentResponse = await paystack.transaction.initialize({
      email: req.body.email,
      amount: req.body.amount,
      reference: req.body.reference,
    });

    // Store the payment reference in your user model
    const user = await User.findOne({ email: req.body.email });
    user.paystackReference = req.body.reference;
    await user.save();

    // Return the payment URL to your frontend
    res.json({ paymentURL: paymentResponse.data.data.authorization_url });
  } catch (error) {
    console.log('Error initiating payment:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

app.post('/verify-payment', async (req, res) => {
  try {
    const user = await User.findOne({ paystackReference: req.body.reference });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify the payment with Paystack
    const verificationResponse = await paystack.transaction.verify({ reference: req.body.reference });

    if (verificationResponse.data.data.status === 'success') {
      user.isPayment = true;
      await user.save();
      res.json({ message: 'Payment successful' });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});




app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});