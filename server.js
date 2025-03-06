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
        
        // Split into lines, filtering out empty lines and comment lines (starting with '#')
        const lines = data.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

        for (const line of lines) {
            console.log("\n--- Processing new line ---");
            console.log("Raw line:", line);

            const parts = line.trim().split(/\s+/);
            console.log("Split parts:", parts);

            if (parts.length < 10) {
                console.warn("⚠️  Skipping line (not enough columns):", parts.length);
                continue;
            }

            // Get the chain information from the first token.
            const chainName = parts[0];   // e.g., "1lfgA"
            // Extract PDB code and chain letter from chainName.
            const pdbcode = chainName.substring(0, 4);  // "1lfg"
            const chain = chainName.substring(4, 5);      // "A"

            // Get domain identifier; e.g., "D04" means there are 4 domains.
            const domain_id = parts[1];
            const totalDomains = parseInt(domain_id.substring(1), 10); // e.g., 4

            // Set pointer to 3 (after pdbChain, domain_id, family_id or similar)
            let pointer = 3;

            // Loop over each domain
            for (let domainNum = 1; domainNum <= totalDomains; domainNum++) {
                // Get the number of segments for this domain.
                const segCount = parseInt(parts[pointer], 10);
                pointer++; // move past the segment count

                for (let segNum = 1; segNum <= segCount; segNum++) {
                    // Expect tokens in the following order for each segment:
                    // start_chain, start_residue, '-' , end_chain, end_residue, '-'
                    const segStartChain = parts[pointer]; // should be "A"
                    pointer++;
                    const segStartResidue = parseInt(parts[pointer], 10);
                    pointer++;
                    pointer++; // skip the '-' token
                    const segEndChain = parts[pointer];   // should be "A"
                    pointer++;
                    const segEndResidue = parseInt(parts[pointer], 10);
                    pointer++;
                    pointer++; // skip the '-' token

                    if (Number.isNaN(segStartResidue) || Number.isNaN(segEndResidue)) {
                        console.warn(`⚠️  Skipping segment due to NaN: ${parts[pointer-3]}, ${parts[pointer-1]}`);
                        continue;
                    }

                    try {
                        await pool.query(
                            `INSERT INTO cath_domains_data (
                                pdbcode, chain, domain_number, segment_number, dombegin, domend
                            )
                            VALUES ($1, $2, $3, $4, $5, $6)`,
                            [pdbcode, chain, domainNum, segNum, segStartResidue, segEndResidue]
                        );
                        console.log(`✅ Inserted: Domain ${domainNum}, Segment ${segNum}: ${segStartResidue} - ${segEndResidue}`);
                    } catch (dbErr) {
                        console.error("❌ Database insert error:", dbErr);
                    }
                }
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
        SELECT
          cd.pdbcode                AS pdbcode,
          cd.chain                  AS chainid,
          'CATH'                    AS source,
          CONCAT('Domain ', cd.domain_number) AS domainid,
          cd.dombegin,
          cd.domend
        FROM cath_domains_data cd
        WHERE UPPER(cd.pdbcode) = UPPER($1)
          AND UPPER(cd.chain) = UPPER($2)
  
        UNION ALL
  
        SELECT
          c.pdbcode                 AS pdbcode,
          c.chainid                 AS chainid,
          'DYNDOM'                  AS source,
          'Domain ' || RIGHT(dr.domainid, 1) AS domainid,
          dr.dombegin,
          dr.domend
        FROM domainregion dr
        JOIN dyndomrun d
            ON dr.domainid LIKE d.ddid || '%'
        JOIN conformer c
            ON c.id = d.confid2
        WHERE UPPER(c.pdbcode) = UPPER($1)
          AND UPPER(c.chainid) = UPPER($2)
        
        ORDER BY source, domainid;
      `;
  
      const result = await pool.query(query, [pdb_code, chain_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "No data found for the given PDB code and chain." });
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
