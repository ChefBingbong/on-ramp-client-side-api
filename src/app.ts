import express from 'express';
import cors from 'cors';
import { config as _c } from 'dotenv';
import errorHandler from './middleware/errorHandlingMiddleware';
import router from './api/router';
import fs from 'fs'
const app = express();


app.use(express.json());
app.set("trust proxy", true);
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.status(200).send({ result: 'ok' });
});
app.use('/', router)
app.use(errorHandler);

app.get('/ip', (req, res) => {
  const ip = 
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress || ''
  res.send(ip)
})

// Define the endpoint
app.get('/checkItem', (req, res) => {
  const searchAddress = req.query.searchAddress;

  fs.readFile('./addresses.txt', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading wallet addresses:', err);
      return res.status(500).json({ error: 'Error reading wallet addresses' });
    }
    const addresses = data.split('\n').filter(address => address.trim() !== '');
    const found = addresses.includes(searchAddress as string);

    res.json({ found });
  });
});

export default app