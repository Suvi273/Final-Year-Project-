const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const pool = require('./db'); // Database connection

const app = express();
const port = 5500;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use(express.static('public'));

// ✅ Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

// ✅ Import CATH domain data from file
async function importCATH(filePath) {
    try {
        console.log(`\n=== Starting import of file: ${filePath} ===`);
        const data = fs.readFileSync(filePath, 'utf-8');
        
        // Split into lines, filtering out empty lines
        const lines = data.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            // 1️⃣ Log the raw line
            console.log("\n--- Processing new line ---");
            console.log("Raw line:", line);

            // 2️⃣ Split line by whitespace
            const parts = line.trim().split(/\s+/);
            console.log("Split parts:", parts);

            // 3️⃣ Check if enough columns exist
            if (parts.length < 10) {
                console.warn("⚠️  Skipping line (not enough columns):", parts.length);
                continue;
            }

            // 4️⃣ Parse columns
            const pdb_chain    = parts[0];   // PDB Code + Chain
            const domain_id    = parts[1];   // Domain ID
            const family_id    = parts[2];   // Family ID
            const class_val    = parseInt(parts[3], 10); // CATH class
            const chain_start  = parts[4];  
            const start_residue = parseInt(parts[5], 10);
            // parts[6] is '-'
            const chain_end    = parts[7];
            const end_residue  = parseInt(parts[8], 10);
            // parts[9] is '-'

            // 5️⃣ Log parsed values
            console.log("Parsed values:");
            console.log("  pdb_chain   =", pdb_chain);
            console.log("  domain_id   =", domain_id);
            console.log("  family_id   =", family_id);
            console.log("  class_val   =", class_val, "(NaN?)", Number.isNaN(class_val));
            console.log("  chain_start =", chain_start);
            console.log("  start_res   =", start_residue, "(NaN?)", Number.isNaN(start_residue));
            console.log("  chain_end   =", chain_end);
            console.log("  end_res     =", end_residue, "(NaN?)", Number.isNaN(end_residue));

            // 6️⃣ Validate numeric fields
            if (
                Number.isNaN(class_val) ||
                Number.isNaN(start_residue) ||
                Number.isNaN(end_residue)
            ) {
                console.warn("⚠️  Skipping line due to NaN in numeric fields.");
                continue;
            }

            // 7️⃣ Insert data into PostgreSQL inside a try/catch
            try {
                await pool.query(
                    `INSERT INTO cath_data (
                        pdb_chain, domain_id, family_id, class_val,
                        start_chain, start_residue, end_chain, end_residue
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (pdb_chain) DO NOTHING;`,
                    [
                        pdb_chain, domain_id, family_id, class_val,
                        chain_start, start_residue, chain_end, end_residue
                    ]
                );
                console.log("✅ Successfully inserted into cath_data.");
            } catch (dbErr) {
                console.error("❌ Database insert error on this line:", dbErr);
            }
        }

        console.log("\n=== Finished processing all lines ===");
        console.log("✅ CATH data import completed.\n");
    } catch (err) {
        console.error("❌ Error reading CATH data file:", err);
    }
}

app.get('/import-cath', async (req, res) => {
    const filePath = path.join(__dirname, 'data', 'cath-domain-boundaries.txt'); 
    await importCATH(filePath);
    res.json({ message: 'CATH import process started' });
});


// ✅ API route to fetch CATH domain data for a PDB Chain
app.get('/cath/:pdb_chain', async (req, res) => {
    try {
        const { pdb_chain } = req.params;
        const result = await pool.query(`SELECT * FROM cath_data WHERE pdb_chain = $1`, [pdb_chain]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "❌ No CATH domain found for this PDB chain." });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "❌ Error fetching CATH data", error: err });
    }
});

// ✅ API to check database connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        res.json({ message: "✅ Database is connected", tables: result.rows });
    } catch (error) {
        res.status(500).json({ message: "❌ Database connection failed", error });
    }
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




// ✅ Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

