import 'dotenv/config';
import express from 'express';
import analyze from '../api/analyze.js';
import weather from '../api/weather.js';
import health from '../api/health.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.all('/api/analyze', analyze);
app.all('/api/weather', weather);
app.all('/api/health', health);
app.use((error, req, res, next) => {
  res.status(error.status === 413 ? 413 : 400).json({ error: error.status === 413 ? 'The upload is too large.' : 'Invalid request body.' });
});
app.listen(3001, '127.0.0.1', () => console.log('Solluce API ready at http://127.0.0.1:3001'));
