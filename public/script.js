async function compareProteins() {
    // Single input fields for PDB code and chain ID
    const pdbCode = document.getElementById("pdbCode").value.trim();
    const chainId = document.getElementById("chainId").value.trim();
  
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
  
    if (!pdbCode || !chainId) {
      resultsDiv.innerHTML = "<p style='color: red;'>Please enter both the PDB code and Chain ID.</p>";
      return;
    }
  
    try {
      resultsDiv.innerHTML = "<p>Loading...</p>";
      const response = await fetch(`/compare/${pdbCode}/${chainId}`);
      const data = await response.json();
  
      if (!response.ok) {
        resultsDiv.innerHTML = `<p style='color: red;'>${data.message}</p>`;
        return;
      }
  
      // Display the domain segments in two side-by-side tables (CATH vs. DYNDOM)
      displayResultsGrouped(data);
  
      // Compare domain segments in detail and display results
      const compareHtml = compareDomainsDetailed(data);
      resultsDiv.innerHTML += compareHtml;
  
      // Optionally, save the report
      saveReport(data, { pdbCode, chainId });
    } catch (error) {
      resultsDiv.innerHTML = "<p style='color: red;'>Error fetching data. Please try again.</p>";
      console.error("API Error:", error);
    }
  }
  
  /**
   * Displays two tables (CATH Data and DYNDOM Data) side by side by wrapping them in a container.
   */
  function displayResultsGrouped(data) {
    const resultsDiv = document.getElementById("results");
  
    const cathData = data.filter(row => row.source === 'CATH');
    const dyndomData = data.filter(row => row.source === 'DYNDOM');
  
    let html = `
      <div class="domain-tables-container">
        <div>
          ${renderDomainTable("CATH Data", cathData)}
        </div>
        <div>
          ${renderDomainTable("DYNDOM Data", dyndomData)}
        </div>
      </div>
    `;
  
    resultsDiv.innerHTML = html;
  }
  
  /**
   * Renders a table grouping each domain's segments into a single row.
   * Columns: Domain, Residue Ranges.
   */
  function renderDomainTable(title, rows) {
    if (!rows || rows.length === 0) {
      return `<h2>${title}</h2><p>No data found.</p>`;
    }
  
    // Build a map of domainNum -> array of [start,end]
    const domainMap = {};
    rows.forEach(row => {
      const domainNum = parseInt(row.domainid.replace(/\D+/g, ""), 10);
      if (!domainMap[domainNum]) {
        domainMap[domainNum] = [];
      }
      domainMap[domainNum].push([row.dombegin, row.domend]);
    });
  
    const sortedDomainNums = Object.keys(domainMap)
      .map(Number)
      .sort((a, b) => a - b);
  
    let html = `<h2>${title}</h2>
      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Residue Ranges</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    sortedDomainNums.forEach(num => {
      const segments = domainMap[num];
      const rangeStr = segments.map(([s, e]) => `${s}-${e}`).join(", ");
      html += `
        <tr>
          <td>${num}</td>
          <td>${rangeStr}</td>
        </tr>
      `;
    });
  
    html += `</tbody></table>`;
    return html;
  }
  
  /**
   * Compares the domain segments in detail.
   * For each common domain:
   *   - We list matched segments (exact matches) with green highlight.
   *   - We list segments only in CATH with red highlight.
   *   - We list segments only in DYNDOM with red highlight.
   */
  function compareDomainsDetailed(data) {
    const cathRows = data.filter(r => r.source === 'CATH');
    const dyndomRows = data.filter(r => r.source === 'DYNDOM');
  
    const cathMap = buildDomainMap(cathRows);
    const dyndomMap = buildDomainMap(dyndomRows);
  
    const cathDomains = Object.keys(cathMap).map(Number);
    const dyndomDomains = Object.keys(dyndomMap).map(Number);
    const commonDomains = cathDomains.filter(d => dyndomDomains.includes(d));
  
    let html = `<div class="comparison-section"><h2>Domain Residue Comparison</h2>`;
    if (commonDomains.length === 0) {
      html += `<p>No common domain numbers found between CATH and DYNDOM.</p></div>`;
      return html;
    }
  
    commonDomains.forEach(domainNum => {
      const cSegments = cathMap[domainNum];
      const dSegments = dyndomMap[domainNum];
  
      const { matched, onlyCath, onlyDyndom } = compareSegmentSets(cSegments, dSegments);
  
      html += `<h3>Domain ${domainNum}</h3>`;
  
      if (matched.length > 0) {
        const matchStr = matched
          .map(([s, e]) => `<span class="comparison-match">${s}-${e}</span>`)
          .join(" ");
        html += `<p><strong>Matched segments:</strong> ${matchStr}</p>`;
      } else {
        html += `<p><strong>Matched segments:</strong> <span class="comparison-no-match">None</span></p>`;
      }
  
      if (onlyCath.length > 0) {
        const onlyCathStr = onlyCath
          .map(([s, e]) => `<span class="comparison-no-match">${s}-${e}</span>`)
          .join(" ");
        html += `<p><strong>Only in CATH:</strong> ${onlyCathStr}</p>`;
      }
      if (onlyDyndom.length > 0) {
        const onlyDyndomStr = onlyDyndom
          .map(([s, e]) => `<span class="comparison-no-match">${s}-${e}</span>`)
          .join(" ");
        html += `<p><strong>Only in DYNDOM:</strong> ${onlyDyndomStr}</p>`;
      }
    });
  
    html += `</div>`;
    return html;
  }
  
  /**
   * Builds a domain -> segments map from the given rows.
   * e.g. { 1: [[1,91],[251,339]], 2: [[92,250]], ... }
   */
  function buildDomainMap(rows) {
    const domainMap = {};
    rows.forEach(row => {
      const domainNum = parseInt(row.domainid.replace(/\D+/g, ""), 10);
      if (!domainMap[domainNum]) {
        domainMap[domainNum] = [];
      }
      domainMap[domainNum].push([row.dombegin, row.domend]);
    });
    return domainMap;
  }
  
  /**
   * Compares two arrays of segments for exact matches.
   * Returns an object with:
   *   matched: segments that appear in both,
   *   onlyCath: segments only in CATH,
   *   onlyDyndom: segments only in DYNDOM.
   */
  function compareSegmentSets(segmentsA, segmentsB) {
    const sortedA = segmentsA
      .map(([s, e]) => [s, e])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const sortedB = segmentsB
      .map(([s, e]) => [s, e])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  
    const matched = [];
    const onlyCath = [];
    const onlyDyndom = [];
  
    let i = 0, j = 0;
    while (i < sortedA.length && j < sortedB.length) {
      const [aStart, aEnd] = sortedA[i];
      const [bStart, bEnd] = sortedB[j];
      if (aStart === bStart && aEnd === bEnd) {
        matched.push([aStart, aEnd]);
        i++;
        j++;
      } else {
        if (aStart < bStart || (aStart === bStart && aEnd < bEnd)) {
          onlyCath.push([aStart, aEnd]);
          i++;
        } else {
          onlyDyndom.push([bStart, bEnd]);
          j++;
        }
      }
    }
  
    while (i < sortedA.length) {
      onlyCath.push(sortedA[i]);
      i++;
    }
    while (j < sortedB.length) {
      onlyDyndom.push(sortedB[j]);
      j++;
    }
  
    return { matched, onlyCath, onlyDyndom };
  }
  
  /**
   * Saves the report in localStorage.
   */
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
  