const { Pool } = require('pg');

const pool = new Pool({
    user: 'dyndom-ckh21btu',       // Change to your PostgreSQL username
    host: 'cmpstudb-01.cmp.uea.ac.uk',           // Change if using a remote server
    database: 'dyndom-ckh21btu',   // Your database name
    password: 'c5v-TFy-J6K-TTX-MNV',   // Your database password
    port: 5432                   // Default PostgreSQL port
});

pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL database"))
    .catch(err => console.error("❌ Database connection error", err));

module.exports = pool;
