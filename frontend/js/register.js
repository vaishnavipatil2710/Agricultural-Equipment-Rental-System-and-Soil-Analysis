/**
 * ✅ 1. Input Validation Helpers
 * Restricts typing to digits only and enforces max length
 */
function allowOnlyDigits(event, maxLength, input) {
    const key = event.key;
    const controlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    
    if (controlKeys.includes(key)) return true;
    
    // Block non-numbers
    if (!/^\d$/.test(key)) return false;

    // Block extra digits
    if (input.value.length >= maxLength) return false;

    return true;
}

function sanitizeInput(input, maxLength) {
    input.value = input.value.replace(/\D/g, "").slice(0, maxLength);
}

/**
 * ✅ 2. Main Registration Function
 */
function registerUser() {
    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const aadhaar = document.getElementById("aadhaar").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const role = document.getElementById("role").value; 
    const msg = document.getElementById("msg");

    // Reset UI state
    msg.style.color = "red";
    msg.innerText = "";

    // Frontend Validations
    if (!name || !address || !role) {
        msg.innerText = "All fields are required.";
        return;
    }

    if (aadhaar.length !== 12) {
        msg.innerText = "Aadhaar must be exactly 12 digits.";
        return;
    }

    if (mobile.length !== 10) {
        msg.innerText = "Mobile number must be exactly 10 digits.";
        return;
    }

    const userData = { name, address, aadhaar, mobile, role };

    fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    })
    .then(async response => {
        const data = await response.json().catch(() => null);

        if (response.ok) {
            msg.style.color = "green";
            msg.innerText = `Registration successful as ${role}! Redirecting...`;
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            // ✅ IMPROVED ERROR CAPTURE
            // Spring Boot usually puts the RuntimeException message in 'data.message'
            const errorMsg = (data && data.message) ? data.message : "Registration failed. This account type may already exist.";
            throw new Error(errorMsg);
        }
    })
    .catch(err => {
        console.error("Registration Error:", err);
        msg.style.color = "red";
        msg.innerText = err.message; // Displays "This Aadhaar is already registered as a USER/VENDOR"
    });
}