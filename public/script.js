async function compareProteins() {
    // Get input values from the form (single set of inputs)
    const pdbCode = document.getElementById("pdbCode").value.trim();
    const chainId = document.getElementById("chainId").value.trim();
  
    // Clear previous results
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
  
    // Validate inputs
    if (!pdbCode || !chainId) {
      resultsDiv.innerHTML = "<p style='color: red;'>Please enter both the PDB code and Chain ID.</p>";
      return;
    }
  
    try {
      // Show loading message
      resultsDiv.innerHTML = "<p>Loading...</p>";
  
      // Fetch comparison data from API using the single set of inputs
      const response = await fetch(`/compare/${pdbCode}/${chainId}`);
      const data = await response.json();
  
      // Handle API errors
      if (!response.ok) {
        resultsDiv.innerHTML = `<p style='color: red;'>${data.message}</p>`;
        return;
      }
  
      // Display comparison results and save the report
      displayResults(data);
      saveReport(data, { pdbCode, chainId });
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
      resultsDiv.innerHTML = "<p>No matching domains found.</p>";
      return;
    }
  
    // Build a table that shows source, domain, pdb code, chain id, start, and end residues
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Domain</th>
                    <th>PDB Code</th>
                    <th>Chain</th>
                    <th>Start Residue</th>
                    <th>End Residue</th>
                </tr>
            </thead>
            <tbody>
    `;
  
    data.forEach(row => {
      tableHTML += `
            <tr>
                <td>${row.source}</td>
                <td>${row.domainid}</td>
                <td>${row.pdbcode}</td>
                <td>${row.chainid}</td>
                <td>${row.dombegin}</td>
                <td>${row.domend}</td>
            </tr>
      `;
    });
  
    tableHTML += `</tbody></table>`;
    resultsDiv.innerHTML = tableHTML;
  }
  
  // Function to save the report in localStorage
  function saveReport(results, inputs) {
    let reports = JSON.parse(localStorage.getItem("reports")) || [];
  
    const newReport = {
      timestamp: new Date().toLocaleString(),
      inputs: inputs,
      resultsSummary: Array.isArray(results) && results.length > 0
        ? `${results.length} record(s)`
        : "No records"
    };
  
    reports.push(newReport);
    localStorage.setItem("reports", JSON.stringify(reports));
  }
  