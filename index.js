require('dotenv').config();

const express = require('express');
const app = express();
const pool = require('./db');
const authMiddleware = require('./middleware/auth');
const participantsRouter = require('./routes/participants');

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.use('/participants', authMiddleware, participantsRouter);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('Database connection successful:', rows);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
};

startServer();