async function compareProteins() {
    // Get input values from the form
    const cathPdbCode = document.getElementById("cathPdbCode").value.trim();
    const cathChainId = document.getElementById("cathChainId").value.trim();
    const dyndomPdbCode = document.getElementById("dyndomPdbCode").value.trim();
    const dyndomChainId = document.getElementById("dyndomChainId").value.trim();

    // Clear previous results
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    // Validate inputs
    if (!cathPdbCode || !cathChainId || !dyndomPdbCode || !dyndomChainId) {
        resultsDiv.innerHTML = "<p style='color: red;'>Please enter all fields.</p>";
        return;
    }

    try {
        // Show loading message
        resultsDiv.innerHTML = "<p>Loading...</p>";

        // Fetch comparison data from API
        const response = await fetch(`/compare/${cathPdbCode}/${cathChainId}`);
        const data = await response.json();

        // Handle API errors
        if (!response.ok) {
            resultsDiv.innerHTML = `<p style='color: red;'>${data.message}</p>`;
            return;
        }

        // Display comparison results
        displayResults(data);
    } catch (error) {
        resultsDiv.innerHTML = "<p style='color: red;'>Error fetching data. Please try again.</p>";
        console.error("API Error:", error);
    }
}

// Function to display results in a table
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.length === 0) {
        resultsDiv.innerHTML = "<p>No matching proteins found.</p>";
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Dyndom PDB</th>
                    <th>Dyndom Chain</th>
                    <th>Dyndom Start</th>
                    <th>Dyndom End</th>
                    <th>CATH PDB</th>
                    <th>CATH Chain</th>
                    <th>CATH Start</th>
                    <th>CATH End</th>
                    <th>Overlap % (Dyndom)</th>
                    <th>Overlap % (CATH)</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(row => {
        tableHTML += `
            <tr>
                <td>${row.dyndom_pdbcode}</td>
                <td>${row.dyndom_chain}</td>
                <td>${row.dyndom_startres}</td>
                <td>${row.dyndom_endres}</td>
                <td>${row.cath_pdbchain}</td>
                <td>${row.cath_chain}</td>
                <td>${row.cath_startres}</td>
                <td>${row.cath_endres}</td>
                <td>${row.dyndom_overlap_percent}%</td>
                <td>${row.cath_overlap_percent}%</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    resultsDiv.innerHTML = tableHTML;
}
