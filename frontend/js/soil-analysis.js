/**
 * ✅ SMART SOIL ANALYSIS ENGINE (V21.0)
 * Strategy: Public Analysis with Color-Based Validation & UI State Management
 */

let isProcessing = false;

/**
 * Handles image selection and preview
 */
async function processSoilImage(input) {
    if (isProcessing) return;
    const file = input.files[0];
    if (!file) return;

    const placeholder = document.getElementById('uploadPlaceholder');
    const preview = document.getElementById('imagePreview');
    const loader = document.getElementById('scanLoader');

    resetUI();

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        runSmartAnalysis(file, loader);
    };
    reader.readAsDataURL(file);
}

/**
 * Sends image to Spring Boot -> Python ML Engine
 * Includes logic to handle Plant vs. Soil validation errors
 */
async function runSmartAnalysis(file, loader) {
    isProcessing = true;
    loader.style.display = 'block';

    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    const username = user ? (user.mobile || user.username) : "guest_farmer";

    const formData = new FormData();
    formData.append("soilImage", file);
    formData.append("username", username);

    try {
        const response = await fetch('http://localhost:8080/api/soil/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Server analysis failed");
        
        const apiResponse = await response.json();

        // --- NEW VALIDATION CHECK ---
        // If Python detected too much green (a plant), it returns an error
        if (apiResponse.error === "INVALID_IMAGE") {
            alert("❌ " + apiResponse.message);
            resetUI(); // Completely clear UI and hide any static text
            return; 
        }
        
        // Store successful technical data in session
        sessionStorage.setItem('currentSoilReport', JSON.stringify(apiResponse));
        unlockStep2(apiResponse);

    } catch (error) {
        console.error("Connection Error:", error);
        alert("please upload a valid soil image.");
        resetUI();
    } finally {
        loader.style.display = 'none';
        isProcessing = false;
    }
}

/**
 * Unlocks Step 2 and populates technical parameters
 */
function unlockStep2(data) {
    document.getElementById('ph').value = data.ph;
    document.getElementById('moisture').value = data.moisture + "%";
    
    animateNutrient('n', data.nitrogen);
    animateNutrient('p', data.phosphorus);
    animateNutrient('k', data.potassium);

    const step2 = document.getElementById('step2');
    step2.classList.replace('disabled-step', 'active-step');
    document.getElementById('analyzeBtn').disabled = false;
    step2.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Generates advice based on pH and toggles visibility of the dynamic results div
 */
/**
 * ✅ DYNAMIC RECOMMENDATION ENGINE (V22.0)
 * Logic: Analyzes pH + Nitrogen to suggest specific crop types.
 */
function generateReport() {
    const phValue = document.getElementById('ph').value;
    const nValue = parseInt(document.getElementById('val-n').innerText.match(/\d+/));
    const step3 = document.getElementById('step3');

    if (!phValue || isNaN(nValue)) {
        alert("Please complete the soil scan first.");
        return;
    }

    const ph = parseFloat(phValue);
    let report = { status: "", advice: "", crops: [] };

    // --- 1. ANALYSIS LOGIC: pH + NITROGEN ---
    if (ph < 6.0) {
        report.status = "Acidic";
        report.advice = "High acidity detected. Add agricultural lime to balance pH.";
        report.crops = nValue < 40 ? ["Peanuts", "Soybeans"] : ["Potatoes", "Blueberries", "Sweet Potatoes"];
    } 
    else if (ph > 7.2) {
        report.status = "Alkaline";
        report.advice = "High alkalinity. Add organic mulch or sulfur to lower pH.";
        report.crops = nValue < 40 ? ["Alfalfa", "Peas"] : ["Barley", "Cabbage", "Asparagus"];
    } 
    else {
        report.status = "Healthy";
        report.advice = "Soil is balanced. Maintain organic matter.";
        report.crops = nValue < 40 ? ["Beans", "Lentils"] : ["Wheat", "Tomato", "Corn", "Cotton"];
    }

    // --- 2. DYNAMIC UI UPDATES ---
    document.getElementById('resultsContent').style.display = 'block';
    document.getElementById('noDataMsg').style.display = 'none';

    document.getElementById('soilStatus').innerText = report.status;
    document.getElementById('soilStatus').className = `status-badge ${report.status.toLowerCase()}`;
    document.getElementById('adviceText').innerText = report.advice;
    
    // Inject different crops based on the dynamic logic
    document.getElementById('cropTags').innerHTML = report.crops
        .map(c => `<span class="crop-tag">${c}</span>`).join('');
    
    // Save merged data for the PDF generator
    const currentData = JSON.parse(sessionStorage.getItem('currentSoilReport'));
    const updatedData = {
        ...currentData,
        derivedStatus: report.status,
        derivedAdvice: report.advice,
        derivedCrops: report.crops.join(', ')
    };
    sessionStorage.setItem('currentSoilReport', JSON.stringify(updatedData));

    step3.classList.replace('disabled-step', 'active-step');
    step3.scrollIntoView({ behavior: 'smooth' });
}
/**
 * Redirects to detailed report or login
 */
function viewReport() {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    const reportData = JSON.parse(sessionStorage.getItem('currentSoilReport'));

    if (!reportData || !reportData.id) {
        alert("Please complete the analysis first.");
        return;
    }

    if (!user) {
        alert("Authentication Required: Please login to save your analysis and download the PDF.");
        sessionStorage.setItem('pendingReportId', reportData.id); 
        window.location.href = "login.html";
    } else {
        window.location.href = `report-view.html?id=${reportData.id}`;
    }
}

/**
 * Visual nutrient bars animation
 */
function animateNutrient(type, value) {
    document.getElementById(`val-${type}`).innerText = `${type.toUpperCase()}: ${value}%`;
    const styleId = `style-${type}`;
    let styleTag = document.getElementById(styleId) || document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = `.${type}-bar::after { width: ${value}%; }`;
    document.head.appendChild(styleTag);
}

/**
 * Resets the entire UI to a clean state
 */
function resetUI() {
    // Hide results and show placeholder message
    const resultsDiv = document.getElementById('resultsContent');
    const noDataMsg = document.getElementById('noDataMsg');
    
    if (resultsDiv) resultsDiv.style.display = 'none';
    if (noDataMsg) noDataMsg.style.display = 'block';

    // Disable cards
    document.getElementById('step2').className = 'card step-card disabled-step';
    document.getElementById('step3').className = 'card step-card disabled-step';
    document.getElementById('analyzeBtn').disabled = true;
    
    // Clear input values
    document.getElementById('ph').value = "";
    document.getElementById('moisture').value = "";
    
    // Reset nutrient bars
    ['n', 'p', 'k'].forEach(type => {
        document.getElementById(`val-${type}`).innerText = `${type.toUpperCase()}: --`;
        const styleTag = document.getElementById(`style-${type}`);
        if (styleTag) styleTag.remove();
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}