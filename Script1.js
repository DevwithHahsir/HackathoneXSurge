const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');  // To hash and compare passwords

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Database configuration
const dbConfig = {
    user: '',           // Replace with your SQL Server username
    password: '',       // Replace with your SQL Server password
    server: 'Hanzala\\SQLEXPRESS',   // Replace with SQL Server instance
    database: 'HACKATHON',  // Replace with your database name
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    port: 1433
};

// Function to connect to the database
async function connectToDB() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Database connected successfully!');
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return null;
    }
}

// Route to fetch all users
app.get('/api/users', async (req, res) => {
    const pool = await connectToDB();

    if (pool) {
        try {
            const result = await pool.request().query('SELECT * FROM Users');
            res.json(result.recordset);
        } catch (err) {
            res.status(500).send('Error fetching users: ' + err.message);
        }
    } else {
        res.status(500).send('Database connection failed.');
    }
});

// Route to register a user (sign-up)
app.post('/api/register', async (req, res) => {
    const { FullName, Email, Password } = req.body;

    if (!FullName || !Email || !Password) {
        return res.status(400).send('FullName, Email, and Password are required.');
    }

    const pool = await connectToDB();

    if (pool) {
        try {
            // Check if the user already exists
            const result = await pool.request()
                .input('Email', sql.NVarChar, Email)
                .query('SELECT * FROM Users WHERE Email = @Email');

            if (result.recordset.length > 0) {
                return res.status(400).send('User already exists with this email.');
            }

            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(Password, 10);

            // Insert the new user into the database
            const query = `
                INSERT INTO Users (FullName, Email, Password)
                VALUES (@FullName, @Email, @Password)
            `;

            await pool.request()
                .input('FullName', sql.NVarChar, FullName)
                .input('Email', sql.NVarChar, Email)
                .input('Password', sql.NVarChar, hashedPassword)
                .query(query);

            res.json({ message: 'User registered successfully!' });
        } catch (err) {
            res.status(500).send('Error registering user: ' + err.message);
        }
    } else {
        res.status(500).send('Database connection failed.');
    }
});

// Route to log in a user
app.post('/api/login', async (req, res) => {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).send('Email and Password are required.');
    }

    const pool = await connectToDB();

    if (pool) {
        try {
            // Check if the user exists
            const result = await pool.request()
                .input('Email', sql.NVarChar, Email)
                .query('SELECT * FROM Users WHERE Email = @Email');

            if (result.recordset.length === 0) {
                return res.status(400).send('User does not exist.');
            }

            const user = result.recordset[0];

            // Compare the provided password with the hashed password stored in the database
            const isMatch = await bcrypt.compare(Password, user.Password);

            if (!isMatch) {
                return res.status(400).send('Invalid password.');
            }

            res.json({ message: 'Login successful!', user: { FullName: user.FullName, Email: user.Email } });
        } catch (err) {
            res.status(500).send('Error logging in: ' + err.message);
        }
    } else {
        res.status(500).send('Database connection failed.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
