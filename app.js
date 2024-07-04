require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database', err);
        return;
    }
    console.log('Connected to database');
});

const SECRET_KEY = process.env.SECRET_KEY;

app.get('/tokenLogs', (req, res) => {
    db.query('SELECT * FROM token_logs', (err, results) => {
        if (err) {
            res.status(500).send({ message: 'Error fetching token logs', error: err });
            return;
        }
        res.status(200).send({ message: 'Fetched token logs successfully', logs: results });
    });
});

app.post('/verifyToken', (req, res) => {
    console.log('Received request body:', req.body);

    const { token_data } = req.body;
    if (!token_data) {
        return res.status(400).send({ message: 'No token provided' });
    }

    verifyAndProcessToken(token_data, res);
});

function verifyAndProcessToken(token, res) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('Decoded token:', decoded);
        verifyUserExists(decoded.user_id, (err, userExists) => {
            if (err || !userExists) {
                res.status(401).send({ message: 'User does not exist', error: err });
                return;
            }
            storeTokenInfo(decoded, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'Failed to store token information', error: err });
                } else {
                    res.status(200).send({ message: 'Token processed successfully', data: decoded });
                    console.log('Token processed and stored:', decoded);
                }
            });
        });
    } catch (error) {
        res.status(401).send({ message: 'Invalid token', error: error.message });
        console.error('Invalid token:', error.message);
    }
}

function verifyUserExists(user_id, callback) {
    const query = "SELECT COUNT(*) as count FROM users WHERE id = ?";
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error verifying user existence:', err);
            callback(err, null);
            return;
        }
        const userExists = results[0].count > 0;
        console.log('User exists:', userExists);
        callback(null, userExists);
    });
}

function storeTokenInfo(tokenData, callback) {
    const query = "INSERT INTO token_logs (user_id, token_data) VALUES (?, ?)";
    db.query(query, [tokenData.user_id, JSON.stringify(tokenData)], (err, results) => {
        if (err) {
            console.error('Failed to insert token data:', err);
            callback(err, null);
            return;
        }
        callback(null, results);
    });
}

app.get('/connectionHistory/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = "SELECT * FROM token_logs WHERE user_id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) {
            res.status(500).send({ message: 'Error fetching connection history', error: err });
            return;
        }
        const history = results.map(entry => {
            const tokenData = JSON.parse(entry.token_data);
            return {
                id: entry.id,
                ...tokenData,
                timestamp: entry.timestamp
            };
        });

        res.status(200).send({ message: 'Fetched connection history successfully', history });
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

