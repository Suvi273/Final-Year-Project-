// Function to compare two protein sequences
function compareProteins() {
    // Get the protein sequences from the text areas
    const protein1 = document.getElementById("protein1").value.trim();
    const protein2 = document.getElementById("protein2").value.trim();
    
    // Clear previous results
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = '';

    // Check if both sequences are entered
    if (protein1 === '' || protein2 === '') {
        resultsDiv.innerHTML = "<p style='color: red;'>Please enter both protein sequences.</p>";
        return;
    }

    // Compare the two protein sequences
    const similarity = calculateSimilarity(protein1, protein2);
    
    // Display the results
    if (similarity === 100) {
        resultsDiv.innerHTML = "<p>The protein sequences are identical.</p>";
    } else if (similarity > 0) {
        resultsDiv.innerHTML = `<p>The protein sequences have a ${similarity}% similarity.</p>`;
    } else {
        resultsDiv.innerHTML = "<p>The protein sequences have no similarity.</p>";
    }
}

// Function to calculate the similarity percentage between two sequences
function calculateSimilarity(seq1, seq2) {
    let matches = 0;
    const maxLength = Math.max(seq1.length, seq2.length);
    
    // Compare the sequences character by character
    for (let i = 0; i < maxLength; i++) {
        if (seq1[i] === seq2[i]) {
            matches++;
        }
    }

    // Return similarity as a percentage
    return ((matches / maxLength) * 100).toFixed(2);
}
