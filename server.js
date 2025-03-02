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
            console.log("\n--- Processing new line ---");
            console.log("Raw line:", line);

            const parts = line.trim().split(/\s+/);
            console.log("Split parts:", parts);

            if (parts.length < 10) {
                console.warn("⚠️  Skipping line (not enough columns):", parts.length);
                continue;
            }

            const pdb_chain    = parts[0];
            const domain_id    = parts[1];
            const family_id    = parts[2];
            const class_val    = parseInt(parts[3], 10);
            const chain_start  = parts[4];  
            const start_residue = parseInt(parts[5], 10);
            const chain_end    = parts[7];
            const end_residue  = parseInt(parts[8], 10);

            if (
                Number.isNaN(class_val) ||
                Number.isNaN(start_residue) ||
                Number.isNaN(end_residue)
            ) {
                console.warn("⚠️  Skipping line due to NaN in numeric fields.");
                continue;
            }

            try {
                await pool.query(
                    `INSERT INTO cath_data (
                        pdb_chain, domain_id, family_id, class_val,
                        start_chain, start_residue, end_chain, end_residue
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        pdb_chain, domain_id, family_id, class_val,
                        chain_start, start_residue, chain_end, end_residue
                    ]
                );
                console.log("✅ Successfully inserted first segment into cath_data.");
            } catch (dbErr) {
                console.error("❌ Database insert error on this line:", dbErr);
            }

            let extraIndex = 10;
            while (extraIndex + 5 < parts.length) {
                const chain_start2  = parts[extraIndex];
                const start_res_str = parts[extraIndex + 1];
                const chain_end2    = parts[extraIndex + 3];
                const end_res_str   = parts[extraIndex + 4];

                const start_res2 = parseInt(start_res_str.replace('-', ''), 10);
                const end_res2   = parseInt(end_res_str.replace('-', ''), 10);

                if (Number.isNaN(start_res2) || Number.isNaN(end_res2)) {
                    console.log("⚠️  Could not parse numeric for extra segment:", start_res_str, end_res_str);
                    break;
                }

                try {
                    await pool.query(`
                        INSERT INTO cath_data (
                            pdb_chain, domain_id, family_id, class_val,
                            start_chain, start_residue, end_chain, end_residue
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        pdb_chain, domain_id, family_id, class_val,
                        chain_start2, start_res2, chain_end2, end_res2
                    ]);
                    console.log(`✅ Inserted extra segment: ${chain_start2}${start_res2} - ${chain_end2}${end_res2}`);
                } catch (exErr) {
                    console.error("❌ Database insert error (extra segment):", exErr);
                }

                extraIndex += 6;
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

// ✅ API route to compare CATH and Dyndom data
app.get('/compare/:pdb_code/:chain_id', async (req, res) => {
    try {
        const { pdb_code, chain_id } = req.params;

        const query = `
            WITH dyndom_ranges AS (
              SELECT
                c.pdbcode,
                c.chainid,
                split_ranges.min_val AS dyndom_start,
                split_ranges.max_val AS dyndom_end
              FROM conformer c
              CROSS JOIN LATERAL (
                SELECT
                  MIN( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS min_val,
                  MAX( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS max_val
                FROM unnest(regexp_split_to_array(c.pdbindex, ':')) AS t(x)
                WHERE REGEXP_REPLACE(x, '[^0-9]+', '', 'g') <> ''
              ) AS split_ranges
            )
            SELECT
              dr.pdbcode AS dyndom_pdbcode, dr.chainid AS dyndom_chain,
              dr.dyndom_start, dr.dyndom_end,
              cd.pdb_chain AS cath_pdbchain, cd.start_chain AS cath_chain,
              cd.start_residue AS cath_startres, cd.end_residue AS cath_endres,
              
              GREATEST(0, LEAST(dr.dyndom_end, cd.end_residue) - GREATEST(dr.dyndom_start, cd.start_residue) + 1) AS overlap_length,
              
              ROUND(
                (GREATEST(0, LEAST(dr.dyndom_end, cd.end_residue) - GREATEST(dr.dyndom_start, cd.start_residue) + 1)::float /
                 (dr.dyndom_end - dr.dyndom_start + 1) * 100)::numeric, 2
              ) AS dyndom_overlap_percent,
              
              ROUND(
                (GREATEST(0, LEAST(dr.dyndom_end, cd.end_residue) - GREATEST(dr.dyndom_start, cd.start_residue) + 1)::float /
                 (cd.end_residue - cd.start_residue + 1) * 100)::numeric, 2
              ) AS cath_overlap_percent
              
            FROM dyndom_ranges dr
            JOIN cath_data cd
              ON dr.pdbcode = cd.pdb_chain
              AND dr.chainid = cd.start_chain
            
            WHERE dr.pdbcode = $1 AND dr.chainid = $2
            ORDER BY dr.pdbcode, dr.chainid;
        `;

        const result = await pool.query(query, [pdb_code, chain_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No overlap found for the given PDB and Chain ID." });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching comparison data", error: err });
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
