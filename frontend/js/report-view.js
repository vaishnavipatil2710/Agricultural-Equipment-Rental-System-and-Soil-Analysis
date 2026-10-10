/**
 * ✅ SMART REPORT VIEW ENGINE (V18.0)
 * Syncs with Spring Boot SoilScan Entity & Database IDs
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get ID from URL and data from SessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    let reportData = JSON.parse(sessionStorage.getItem('currentSoilReport'));
    const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // 2. BACKUP: If session is empty, fetch from Spring Boot API using ID
    if (!reportData && reportId) {
        try {
            const response = await fetch(`http://localhost:8080/api/soil/report/${reportId}`);
            if (response.ok) {
                reportData = await response.json();
            }
        } catch (error) {
            console.error("Critical Error: Could not retrieve report from database.", error);
        }
    }

    // 3. Validation
    if (!reportData) {
        alert("Report data missing. Returning to scan page.");
        window.location.href = "soil-analysis.html";
        return;
    }

    // 4. Populate the UI with real Backend Keys
    renderReport(reportData, userData);
});

/**
 * Maps SoilScan Entity fields to the HTML elements
 */
function renderReport(data, user) {
    // User Info
    document.getElementById('farmerName').innerText = user ? (user.fullName || user.username) : "Valued Farmer";
    
    // Date & ID
    const scanDate = data.scanDate ? new Date(data.scanDate).toLocaleDateString() : new Date().toLocaleDateString();
    document.getElementById('reportDate').innerText = scanDate;
    document.getElementById('reportID').innerText = "AH-SCAN-" + (data.id || "TMP");

    // Results (Matching your SoilScan.java fields)
    document.getElementById('res-ph').innerText = data.ph || "--";
    document.getElementById('res-moisture').innerText = data.moisture ? data.moisture + "%" : "--";
    document.getElementById('res-n').innerText = data.nitrogen ? data.nitrogen + "%" : "--";
    document.getElementById('res-p').innerText = data.phosphorus ? data.phosphorus + "%" : "--";
    document.getElementById('res-k').innerText = data.potassium ? data.potassium + "%" : "--";
    
    // Dynamic Logic for Recommendations (if not provided by backend)
    let status = "Healthy";
    let advice = "Soil is balanced. Maintain organic matter.";
    let crops = "Wheat, Tomato, Corn";

    if (data.ph < 6.0) {
        status = "Acidic";
        advice = "High acidity detected. Add agricultural lime to balance pH.";
        crops = "Potatoes, Blueberries, Sweet Potatoes";
    } else if (data.ph > 7.2) {
        status = "Alkaline";
        advice = "High alkalinity. Add sulfur or organic mulch to lower pH.";
        crops = "Barley, Cabbage, Cauliflower";
    }

    document.getElementById('soilStatus').innerText = status;
    document.getElementById('res-advice').innerText = advice;

    // Populate Crops
    const cropsContainer = document.getElementById('res-crops');
    const cropsArray = crops.split(', ');
    cropsContainer.innerHTML = cropsArray.map(crop => `<span>${crop}</span>`).join('');
}

/**
 * Trigger browser-native high-quality PDF print
 */
function downloadReport() {
    const element = document.getElementById('printableReport'); // The main container
    
    // Options for the PDF library
    const opt = {
        margin:       0.5,
        filename:     `Soil_Health_Report_${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Use a slight timeout to ensure the browser has finished rendering the data
    setTimeout(() => {
        html2pdf().set(opt).from(element).save();
    }, 500);
}