const express = require('express');
const path = require('path');  // Import path module
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5500;

// Middleware
app.use(bodyParser.json());

// Enable CORS
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// Serve static files from the "public" folder
app.use(express.static('public'));

// ✅ Set "Home.html" as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

// Placeholder for protein domain comparison API
app.get('/compare-domains', (req, res) => {
    res.json({ message: 'Domain comparison logic will be implemented here' });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = [{ username: 'admin', password: 'password' }];
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
