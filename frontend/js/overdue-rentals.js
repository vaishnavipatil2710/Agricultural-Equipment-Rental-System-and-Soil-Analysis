// =====================================================
// overdue-rentals.js
// AgriRent Hub - Vendor Overdue Rentals
// =====================================================

const API_BASE_URL = "http://localhost:8080/api";

let currentVendor = null;


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        currentVendor = JSON.parse(userRaw);
    } catch (error) {
        console.error("Invalid login data:", error);
        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }

    // Only Vendor can access this page
    if (!currentVendor || currentVendor.role !== "VENDOR") {
        alert("Unauthorized access.");
        window.location.href = "login.html";
        return;
    }

    loadOverdueRentals();
});


// =====================================================
// LOAD OVERDUE RENTALS
// =====================================================

async function loadOverdueRentals() {

    const loadingMessage =
        document.getElementById("loadingMessage");

    const noOverdueMessage =
        document.getElementById("noOverdueMessage");

    const overdueList =
        document.getElementById("overdueList");

    try {

        if (loadingMessage) {
            loadingMessage.style.display = "block";
        }

        if (noOverdueMessage) {
            noOverdueMessage.style.display = "none";
        }

        if (overdueList) {
            overdueList.innerHTML = "";
        }

        const response = await fetch(
            `${API_BASE_URL}/bookings/vendor/${currentVendor.id}`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load bookings. Status: ${response.status}`
            );
        }

        const bookings = await response.json();

        // Only OVERDUE bookings
        const overdueBookings = bookings.filter(
            booking =>
                booking.status &&
                booking.status.toUpperCase() === "OVERDUE"
        );

        updateSummary(overdueBookings);

        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }

        if (overdueBookings.length === 0) {

            if (noOverdueMessage) {
                noOverdueMessage.style.display = "block";
            }

            return;
        }

        overdueBookings.forEach(booking => {
            createOverdueCard(booking);
        });

    } catch (error) {

        console.error("Error loading overdue rentals:", error);

        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }

        if (overdueList) {
            overdueList.innerHTML = `
                <div class="error-message">
                    ❌ Failed to load overdue rentals.
                    <br>
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }
}


// =====================================================
// UPDATE SUMMARY
// =====================================================

function updateSummary(overdueBookings) {

    const overdueCount =
        document.getElementById("overdueCount");

    const totalCharges =
        document.getElementById("totalCharges");

    // Number of overdue bookings
    if (overdueCount) {
        overdueCount.textContent = overdueBookings.length;
    }

    // Total overdue charges
    const total = overdueBookings.reduce(
        (sum, booking) => {
            return sum + (Number(booking.extraCharges) || 0);
        },
        0
    );

    if (totalCharges) {
        totalCharges.textContent =
            formatCurrency(total);
    }
}


// =====================================================
// CREATE OVERDUE CARD
// =====================================================

function createOverdueCard(booking) {

    const overdueList =
        document.getElementById("overdueList");

    if (!overdueList) {
        return;
    }

    const farmer =
        booking.user || {};

    const equipment =
        booking.equipment || {};

    const farmerName =
        farmer.name || "Unknown Farmer";

    const farmerMobile =
        farmer.mobile || "";

    const equipmentName =
        equipment.name || "Unknown Equipment";

    const rentalAmount =
        Number(booking.totalAmount) || 0;

    const extraCharges =
        Number(booking.extraCharges) || 0;

    const totalDue =
        rentalAmount + extraCharges;

    const card = document.createElement("div");

    card.className = "overdue-card";

    card.innerHTML = `

        <div class="overdue-card-header">

            <div>
                <h3>
                    ${escapeHtml(equipmentName)}
                </h3>

                <p>
                    Booking ID:
                    <strong>#${booking.id}</strong>
                </p>
            </div>

            <span class="overdue-badge">
                OVERDUE
            </span>

        </div>


        <div class="overdue-details">

            <div class="detail-item">

                <span class="detail-label">
                    👤 Farmer
                </span>

                <span class="detail-value">
                    ${escapeHtml(farmerName)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    📞 Mobile
                </span>

                <span class="detail-value">
                    ${escapeHtml(farmerMobile || "Not available")}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    📦 Equipment
                </span>

                <span class="detail-value">
                    ${escapeHtml(equipmentName)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    🕐 Booking Type
                </span>

                <span class="detail-value">
                    ${escapeHtml(booking.bookingType || "-")}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    ▶️ Rental Start
                </span>

                <span class="detail-value">
                    ${formatDateTime(booking.startDateTime)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    ⏰ Rental End
                </span>

                <span class="detail-value">
                    ${formatDateTime(booking.endDateTime)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    ⚠️ Overdue Since
                </span>

                <span class="detail-value">
                    ${formatDateTime(
                        booking.overdueSince ||
                        booking.endDateTime
                    )}
                </span>

            </div>

        </div>


        <div class="charge-section">

            <div class="charge-row">

                <span>
                    Rental Amount
                </span>

                <strong>
                    ${formatCurrency(rentalAmount)}
                </strong>

            </div>


            <div class="charge-row">

                <span>
                    Overdue Charges
                </span>

                <strong class="overdue-charge">
                    ${formatCurrency(extraCharges)}
                </strong>

            </div>


            <div class="charge-row total-due">

                <span>
                    Total Due
                </span>

                <strong>
                    ${formatCurrency(totalDue)}
                </strong>

            </div>

        </div>


        <div class="overdue-actions">

            ${
                farmerMobile
                ?
                `
                <button
                    class="call-btn"
                    onclick="callFarmer('${escapeAttribute(farmerMobile)}')"
                >
                    📞 Call Farmer
                </button>
                `
                :
                `
                <button
                    class="call-btn"
                    disabled
                >
                    📞 No Mobile Number
                </button>
                `
            }


            <button
                class="reminder-btn"
                id="reminder-${booking.id}"
                onclick="sendReminder(${booking.id})"
            >
                🔔 Send Reminder
            </button>

        </div>

    `;

    overdueList.appendChild(card);
}


// =====================================================
// CALL FARMER
// =====================================================

function callFarmer(mobile) {

    if (!mobile) {
        alert("Farmer mobile number is not available.");
        return;
    }

    window.location.href = `tel:${mobile}`;
}


// =====================================================
// SEND OVERDUE REMINDER
// =====================================================

async function sendReminder(bookingId) {

    if (!currentVendor) {
        alert("Vendor information not found.");
        return;
    }

    const button =
        document.getElementById(`reminder-${bookingId}`);

    if (!button) {
        return;
    }

    // Prevent multiple clicks
    button.disabled = true;
    button.textContent = "Sending...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/notifications/overdue-reminder` +
            `?bookingId=${bookingId}` +
            `&vendorUserId=${currentVendor.id}`,
            {
                method: "POST"
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        let result;

        if (contentType.includes("application/json")) {
            result = await response.json();
        } else {
            result = await response.text();
        }

        if (!response.ok) {

            let errorMessage = "Failed to send reminder.";

            if (typeof result === "string") {
                errorMessage = result;
            } else if (result && result.error) {
                errorMessage = result.error;
            }

            throw new Error(errorMessage);
        }

        // Success
        button.textContent = "✓ Reminder Sent";
        button.disabled = true;

        alert(
            "✅ Overdue reminder sent successfully to the farmer."
        );

    } catch (error) {

        console.error(
            "Error sending overdue reminder:",
            error
        );

        alert(
            "❌ Failed to send reminder.\n\n" +
            error.message
        );

        button.disabled = false;
        button.textContent = "🔔 Send Reminder";
    }
}


// =====================================================
// REFRESH
// =====================================================

function refreshOverdueRentals() {
    loadOverdueRentals();
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    sessionStorage.removeItem("loggedInUser");

    window.location.href = "login.html";
}


// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(amount) {

    return "₹" + Number(amount || 0).toFixed(2);
}


// =====================================================
// FORMAT DATE & TIME
// =====================================================

function formatDateTime(dateTime) {

    if (!dateTime) {
        return "-";
    }

    const date = new Date(dateTime);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =====================================================
// SECURITY HELPERS
// =====================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}