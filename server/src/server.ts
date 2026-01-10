import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessionRoutes';
import participantRoutes from './routes/participantRoutes';
import itemRoutes from './routes/itemRoutes';
import settlementRoutes from './routes/settlementRoutes';
import friendRoutes from './routes/friendRoutes';
import groupRoutes from './routes/groupRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Amot Calculator API is running' });
});

app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', participantRoutes);
app.use('/api/sessions', itemRoutes);
app.use('/api/sessions', settlementRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
