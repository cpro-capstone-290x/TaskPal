import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json()); // Body parser middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Security middleware
app.use(morgan('dev')); // Logging middleware

app.get('/test', (req, res) => {
  console.log(res.getHeaders());
  res.send('Hello World! John Carlo');
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});