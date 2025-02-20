const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Sample users (replace with database later)
const users = [{ username: 'admin', password: 'password' }];
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));


// Placeholder for protein domain comparison API
app.get('/compare-domains', (req, res) => {
    res.json({ message: 'Domain comparison logic will be implemented here' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

