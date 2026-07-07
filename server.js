const express = require('express');
const app = express();
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('items.json', 'utf8'));
dotenv.config({ path: './.env' });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'Public')));

let instance = new Razorpay({
    key_id: process.env.RazorPay_Key,
    key_secret: process.env.RazorPay_Secret
});
// Send merch data to client
app.get('/items', (req, res) => {
    res.json(items);
});
// send public key to client
app.get('/razorpay-key', (req, res) => {
    res.json({ key: process.env.RazorPay_Key || '' });
});

// create order route for Razorpay
app.post('/create-order', (req, res) => {
    const amount = Number(req.body.amount || 50000);
    const options = {
        amount,
        currency: req.body.currency || 'INR',
        receipt: `receipt_${Date.now()}`
    };

    instance.orders.create(options, (err, order) => {
        if (err) {
            console.error('Error creating Razorpay order:', err);
            return res.status(500).json({ error: 'Failed to create order' });
        }

        res.json(order);
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});