const pool = require('../db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        // Decode base64
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        // Check DB
        const [rows] = await pool.query(
            'SELECT * FROM admin WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;