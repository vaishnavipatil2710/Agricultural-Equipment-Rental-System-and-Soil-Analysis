
const API_BASE_URL = "http://localhost:8080/api";

let delivery = null;
let deliveryMap = null;
let deliveryMarker = null;
let trackingInterval = null;
let isLoadingDelivery = false;

let requestedBookingId = null;


// ==========================================
// GET BOOKING ID FROM URL
// ==========================================

function getBookingId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("bookingId");
}


// ==========================================
// INITIALIZE PAGE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    requestedBookingId = getBookingId();

    if (!requestedBookingId) {
        showError("Booking ID missing. Please open Track Delivery from My Bookings.");
        showLoading(false);
        return;
    }

    loadDelivery();
});


// ==========================================
// LOAD DELIVERY FOR THIS BOOKING ONLY
// ==========================================

async function loadDelivery() {
    if (isLoadingDelivery) return;

    isLoadingDelivery = true;
    showLoading(true);

    try {
        const response = await fetch(
            `${API_BASE_URL}/deliveries/booking/${encodeURIComponent(requestedBookingId)}`
        );

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                "Delivery information not found."
            );
        }

        if (!data || Array.isArray(data)) {
            throw new Error(
                "Expected one delivery record for this booking."
            );
        }

        // Safety check: never show another booking's delivery.
        const actualBookingId =
            data.booking?.id ??
            data.bookingId;

        if (
            actualBookingId != null &&
            String(actualBookingId) !== String(requestedBookingId)
        ) {
            throw new Error(
                "The returned delivery does not belong to this booking."
            );
        }

        delivery = data;

        displayDelivery(data);
        updateMapLocation(data);

        startTrackingPolling(data.id ?? data.deliveryId);

        hideError();

    } catch (error) {
        console.error("Error loading delivery:", error);
        showError(error.message || "Unable to load delivery.");
    } finally {
        showLoading(false);
        isLoadingDelivery = false;
    }
}


// ==========================================
// SAFE RESPONSE PARSING
// ==========================================

async function readResponse(response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}


// ==========================================
// DISPLAY DELIVERY INFORMATION
// ==========================================

function displayDelivery(data) {
    document.getElementById("deliveryCard")
        ?.classList.remove("hidden");

    const booking = data.booking || {};

    setText(
        "bookingId",
        `#${booking.id ?? requestedBookingId}`
    );

    setText(
        "equipmentName",
        booking.equipment?.name ||
        data.equipment?.name ||
        "Equipment"
    );

    setText(
        "deliveryAddress",
        data.deliveryAddress || "Address not available"
    );

    updateStatus(data.status);
    updatePartner(data.deliveryPartner);
    updateOTPSection(data);

    // Map needs its container to be visible before sizing.
    if (deliveryMap) {
        setTimeout(() => deliveryMap.invalidateSize(), 100);
    }
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "";
    }
}


// ==========================================
// DELIVERY STATUS AND TIMELINE
// ==========================================

function updateStatus(status) {
    status = (status || "PENDING").toUpperCase();

    setText(
        "statusBadge",
        status.replaceAll("_", " ")
    );

    const steps = {
        PENDING: 1,
        APPROVED: 1,
        PAID: 1,
        READY_FOR_DELIVERY: 2,
        ASSIGNED: 3,
        PICKED_UP: 4,
        OUT_FOR_DELIVERY: 5,
        ARRIVED_AT_LOCATION: 5,
        DELIVERED: 6
    };

    const currentStep = steps[status] || 1;

    const stepIds = [
        "stepConfirmed",
        "stepReady",
        "stepAssigned",
        "stepPickup",
        "stepTransit",
        "stepDelivered"
    ];

    stepIds.forEach((id, index) => {
        const element = document.getElementById(id);

        if (!element) return;

        element.classList.toggle(
            "completed",
            index < currentStep
        );
    });
}


// ==========================================
// DELIVERY PARTNER DETAILS
// ==========================================

function updatePartner(partner) {
    const details = document.getElementById("partnerDetails");

    if (!details) return;

    details.replaceChildren();

    if (!partner) {
        setText(
            "partnerText",
            "Delivery partner has not been assigned yet."
        );
        return;
    }

    // Support both nested user object and flat API fields
    const user = partner.user || partner.deliveryPartner?.user || {};

    const name =
         user.name ||
        partner.name ||
        partner.fullName ||
        "Name not available";

    const mobile =
        user.mobile ||
        user.mobileNumber ||
        partner.mobile ||
        partner.mobileNumber ||
        partner.phone ||
        partner.contactNumber ||
        "Contact number not available";

    const vehicleType =
        partner.vehicleType || "Not Assigned";

    const vehicleNumber =
        partner.vehicleNumber || "Not Provided";

    // setText("partnerText", name);

    const fields = [
        ["Name", name],
        ["Contact Number", mobile],
        ["Vehicle", vehicleType],
        ["Vehicle Number", vehicleNumber]
    ];

    fields.forEach(([label, value]) => {
        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;

        paragraph.append(
            strong,
            document.createTextNode(value)
        );

        details.appendChild(paragraph);
    });
}




// ==========================================
// MAP INITIALIZATION
// ==========================================

function initializeDeliveryMap() {
    if (deliveryMap) return;

    const mapElement = document.getElementById("deliveryMap");

    if (!mapElement || typeof L === "undefined") {
        setText(
            "gpsStatus",
            "Map library unavailable. Check your internet connection."
        );
        return;
    }

    // Temporary neutral view; no fake delivery marker.
    deliveryMap = L.map(mapElement).setView([20.5937, 78.9629], 5);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(deliveryMap);
}

// ==========================================
// UPDATE MAP - MARKER ONLY
// No latitude, longitude or timestamp on UI
// ==========================================

function updateMapLocation(data) {
    initializeDeliveryMap();

    if (!deliveryMap) return;

    // Hide GPS details from the UI
    ["gpsLatitude", "gpsLongitude", "gpsLastUpdated", "gpsStatus"]
        .forEach(id => {
            const element = document.getElementById(id);

            if (element) {
                element.style.display = "none";

                // Hide the associated label/details row too
                const row = element.closest("p, .gps-info, .gps-details");
                if (row) {
                    row.style.display = "none";
                }
            }
        });

    const latitude = toCoordinate(
        data.currentLatitude ??
        data.latitude ??
        data.currentLat ??
        data.lat
    );

    const longitude = toCoordinate(
        data.currentLongitude ??
        data.longitude ??
        data.currentLng ??
        data.lng ??
        data.lon
    );

    // No valid GPS location yet: keep the neutral map visible
    if (latitude === null || longitude === null) {
        return;
    }

    const location = [latitude, longitude];

    // Create or update the delivery marker
    if (!deliveryMarker) {
        deliveryMarker = L.marker(location)
            .addTo(deliveryMap)
            .bindPopup("Delivery partner location");

        deliveryMap.setView(location, 16);
    } else {
        deliveryMarker.setLatLng(location);
        deliveryMap.panTo(location);
    }

    setTimeout(() => {
        deliveryMap.invalidateSize();
    }, 100);
}


function toCoordinate(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}


// ==========================================
// POLL ONLY THIS DELIVERY ID
// ==========================================

function startTrackingPolling(deliveryId) {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    if (!deliveryId) {
        console.warn("Delivery ID unavailable; GPS polling not started.");
        return;
    }

    trackingInterval = setInterval(async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/deliveries/${encodeURIComponent(deliveryId)}`
            );

            const updated = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    updated.message ||
                    updated.error ||
                    "Unable to refresh delivery."
                );
            }

            // Confirm the polling result still belongs to the selected booking.
            const actualBookingId =
                updated.booking?.id ??
                updated.bookingId;

            if (
                actualBookingId != null &&
                String(actualBookingId) !== String(requestedBookingId)
            ) {
                console.error(
                    "Ignored GPS update from a different booking."
                );
                return;
            }

            delivery = updated;

            displayDelivery(updated);
            updateMapLocation(updated);

        } catch (error) {
            console.error("GPS refresh failed:", error);
            setText(
                "gpsStatus",
                "GPS refresh failed. Retrying..."
            );
        }
    }, 5000);
}


// ==========================================
// OTP SECTION
// ==========================================

function updateOTPSection(data) {
    const section = document.getElementById("otpSection");

    if (!section) return;

    section.classList.remove("hidden");

    if (data.otpVerified === true) {
        section.innerHTML = `
            <h3>✅ Delivery Verified</h3>
            <p>The delivery OTP has been verified successfully.</p>
        `;
        return;
    }

    if (data.status === "OUT_FOR_DELIVERY") {
        section.innerHTML = `
            <h3>🔐 Delivery OTP Verification</h3>
            <p>Enter the OTP provided for your delivery to verify receipt.</p>

            <div class="otp-box">
                <input
                    type="text"
                    id="otpInput"
                    placeholder="Enter OTP"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                    aria-label="Delivery OTP"
                >

                <button type="button" onclick="verifyOTP()">
                    Verify OTP
                </button>
            </div>

            <p id="otpMessage" aria-live="polite"></p>
        `;
        return;
    }

    section.classList.add("hidden");
}


// ==========================================
// VERIFY OTP
// ==========================================

async function verifyOTP() {
    if (!delivery) {
        alert("Delivery details are not loaded yet.");
        return;
    }

    const input = document.getElementById("otpInput");
    const message = document.getElementById("otpMessage");

    if (!input || !message) return;

    const otp = input.value.trim();

    if (!otp) {
        message.textContent = "Please enter the OTP.";
        message.style.color = "#c62828";
        return;
    }

    const deliveryId = delivery.id ?? delivery.deliveryId;

    if (!deliveryId) {
        message.textContent = "Delivery ID is unavailable.";
        message.style.color = "#c62828";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/deliveries/${encodeURIComponent(deliveryId)}/verify-otp?otp=${encodeURIComponent(otp)}`,
            { method: "POST" }
        );

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "OTP verification failed."
            );
        }

        message.textContent =
            result.message || "OTP verified successfully.";

        message.style.color = "#2e7d32";

        await loadDelivery();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "#c62828";
    }
}


// ==========================================
// LOADING AND ERROR HANDLING
// ==========================================

function showLoading(show) {
    document.getElementById("loading")
        ?.classList.toggle("hidden", !show);
}

function showError(message) {
    const box = document.getElementById("errorBox");

    if (box) box.classList.remove("hidden");

    setText("errorMessage", message);
}

function hideError() {
    document.getElementById("errorBox")
        ?.classList.add("hidden");
}


// ==========================================
// CLEAN UP POLLING WHEN PAGE CLOSES
// ==========================================

window.addEventListener("beforeunload", () => {
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
});
