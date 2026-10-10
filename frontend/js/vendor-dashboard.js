// ==========================================
// USER DASHBOARD – LOAD AVAILABLE EQUIPMENT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Public access: Guests and Vendors can see the list
    loadEquipment();
});

/**
 * Fetches available equipment from the backend
 */
function loadEquipment() {
    const tbody = document.getElementById("equipmentBody");
    const noDataMsg = document.getElementById("noDataMsg");

    if (!tbody) return;
    tbody.innerHTML = "";

    fetch("http://localhost:8080/api/equipment/available")
        .then(res => res.json())
        .then(equipmentList => {
            if (!equipmentList || equipmentList.length === 0) {
                if (noDataMsg) noDataMsg.style.display = "block";
                return;
            }
            if (noDataMsg) noDataMsg.style.display = "none";

            equipmentList.forEach(eq => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><b>${eq.name}</b></td>
                    <td>${eq.description}</td>
                    <td>₹${eq.pricePerDay}</td>
                    <td>${eq.quantity}</td> 
                    <td>${eq.vendor ? eq.vendor.name : 'N/A'}</td>
                    <td>
                        <img src="${eq.imageUrl}" alt="${eq.name}" width="80" 
                             style="border-radius: 4px; object-fit: cover; height: 50px;">
                    </td>
                    <td>
                        <button class="book-btn" onclick="bookEquipment(${eq.id})">
                            Book Now
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error("Error loading equipment:", err));
}

/**
 * ✅ ROLE-BASED GATEKEEPER
 * 1. Checks if logged in.
 * 2. Checks if the role is USER (Allow) or VENDOR (Redirect to Vendor Dashboard).
 */
function bookEquipment(id) {
    const userRaw = localStorage.getItem("loggedInUser");

    // 1. Check if logged in at all
    if (!userRaw || userRaw === "null") {
        alert("Please login first to book equipment.");
        localStorage.setItem("pendingBookingId", id);
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userRaw);

    // 2. Role Check: If Vendor, don't let them book
    if (user.role === "VENDOR") {
        alert("Vendors cannot book equipment. Redirecting to your Vendor Dashboard.");
        window.location.href = "vendor-dashboard.html"; 
        return;
    }

    // 3. Success: If role is USER, proceed to booking
    if (user.role === "USER") {
        window.location.href = `booking.html?equipmentId=${id}`;
    } else {
        alert("Unauthorized role. Please contact support.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}