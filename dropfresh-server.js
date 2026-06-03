const express = require('express');
const stripe = require('stripe')(process.env.SECRET_KEY_STRIPE);
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('DropFresh Checkout Server Running');
});

app.post('/create-checkout', async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone, address, date, time, services } = req.body;
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (!amountCents || amountCents < 100) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const siteUrl = process.env.SITE_URL || 'https://drop-fresh.netlify.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DropFresh Laundry Service',
            description: services || 'Laundry pickup & delivery',
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      metadata: {
        name: customerName || '',
        phone: customerPhone || '',
        address: address || '',
        date: date || '',
        time: time || '',
        services: services || '',
        total: '$' + amount,
      },
      success_url: siteUrl + '/?booking=success&amount=' + amount,
      cancel_url: siteUrl + '/?booking=cancelled',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
