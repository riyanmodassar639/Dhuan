const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DHUAN Backend API is running' });
});

// Route requests to AI Service will be added here

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
