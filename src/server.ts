import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Webhooks endpoint
app.post('/webhooks', (req, res) => {
  console.log('Webhook received', req.body);
  res.status(200).json({ message: 'Webhook received' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhooks endpoint: http://localhost:${PORT}/webhooks`);
});

