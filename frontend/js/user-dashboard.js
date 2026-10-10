// ==========================================
// USER DASHBOARD – FULL LOGIC
// ==========================================

// =========================================================
// GLOBAL CONFIGURATION
// =========================================================

const API = "http://localhost:8080/api";

const NOTIFICATION_API =
    `${API}/notifications`;


// =========================================================
// LIVE DELIVERY TRACKING VARIABLES
// =========================================================

let deliveryMap = null;

let deliveryMarker = null;

let trackingInterval = null;

let trackedDeliveryId = null;


// =========================================================
// DELIVERY OTP COUNTDOWN
// =========================================================

let otpCountdownIntervals = {};


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // Initial load of equipment
    loadEquipment();

    // Initial load of notifications
    loadNotifications();

    // Start checking for active delivery
    loadLiveDelivery();

});


// =========================================================
// LOAD AVAILABLE EQUIPMENT
// =========================================================

function loadEquipment() {

    const tbody =
        document.getElementById("equipmentBody");

    const noDataMsg =
        document.getElementById("noDataMsg");


    // Get current logged-in user

    const userRaw =
        sessionStorage.getItem("loggedInUser");

    const currentUser =
        userRaw ? JSON.parse(userRaw) : null;


    if (!tbody) return;


    tbody.innerHTML = "";


    // Fetch available equipment

    fetch(`${API}/equipment/available`)

        .then(res => {

            if (!res.ok) {

                throw new Error(
                    "Failed to fetch equipment"
                );

            }

            return res.json();

        })


        .then(equipmentList => {

            if (
                !equipmentList ||
                equipmentList.length === 0
            ) {

                if (noDataMsg) {

                    noDataMsg.style.display =
                        "block";

                }

                return;

            }


            if (noDataMsg) {

                noDataMsg.style.display =
                    "none";

            }


            equipmentList.forEach(eq => {


                // Check ownership

                const isOwner =
                    currentUser &&
                    eq.vendor &&
                    currentUser.id === eq.vendor.id;


                // =====================================================
                // IMAGE LOGIC
                // =====================================================

                const imagePath =
                    eq.imageUrl &&
                    eq.imageUrl.trim() !== ""

                        ? eq.imageUrl

                        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=200&auto=format&fit=crop";


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>

                        <img
                            src="${imagePath}"

                            onerror="
                                this.src='https://via.placeholder.com/100x80?text=No+Image'
                            "

                            alt="${escapeHtml(eq.name)}"

                            style="
                                width: 80px;
                                height: 60px;
                                border-radius: 4px;
                                object-fit: cover;
                                border: 1px solid #ddd;
                            "

                        >

                    </td>


                    <td>

                        <b>
                            ${escapeHtml(eq.name)}
                        </b>

                    </td>


                    <td>

                        ${escapeHtml(
                            eq.description || ""
                        )}

                    </td>


                    <td>

                        ₹${eq.pricePerDay}

                    </td>


                    <td>

                        ${eq.quantity}

                    </td>


                    <td>

                        ${
                            eq.vendor
                                ? escapeHtml(eq.vendor.name)
                                : "N/A"
                        }


                        ${
                            isOwner

                                ? `

                                    <br>

                                    <span
                                        style="
                                            color: #2e7d32;
                                            font-size: 0.8em;
                                            font-weight: bold;
                                        "
                                    >
                                        (Your Product)
                                    </span>

                                `

                                : ""
                        }

                    </td>


                    <td>

                        ${
                            isOwner

                                ? `

                                    <button
                                        class="book-btn"
                                        disabled
                                        title="You cannot rent your own items"

                                        style="
                                            background-color: #999;
                                            cursor: not-allowed;
                                            opacity: 0.7;
                                        "
                                    >
                                        Your Item
                                    </button>

                                `

                                : `

                                    <button
                                        class="book-btn"

                                        onclick="
                                            bookEquipment(
                                                ${eq.id},${eq.vendor ? eq.vendor.id : 0}
                                            )
                                        "
                                    >
                                        Book Now
                                    </button>

                                `
                        }

                    </td>

                `;


                tbody.appendChild(row);

            });

        })


        .catch(err => {

            console.error(
                "Error loading equipment:",
                err
            );


            if (noDataMsg) {

                noDataMsg.innerText =
                    "Error loading data. Please check if the server is running.";

                noDataMsg.style.display =
                    "block";

            }

        });

}


// =========================================================
// ROLE & OWNERSHIP GATEKEEPER
// =========================================================

function bookEquipment(
    equipmentId,
    itemVendorId
) {


    const userRaw =
        sessionStorage.getItem("loggedInUser");


    // ---------------------------------------------------------
    // SESSION CHECK
    // ---------------------------------------------------------

    if (!userRaw) {

        alert(
            "Please login first to book equipment."
        );


        sessionStorage.setItem(
            "pendingBookingId",
            equipmentId
        );


        window.location.href =
            "login.html";


        return;

    }


    const user =
        JSON.parse(userRaw);


    // ---------------------------------------------------------
    // SELF-BOOKING PROTECTION
    // ---------------------------------------------------------

    if (user.id === itemVendorId) {

        alert(
            "🚫 Action Denied: You cannot rent equipment that you have listed as a Vendor."
        );


        return;

    }


    // ---------------------------------------------------------
    // ROLE-BASED ROUTING
    // ---------------------------------------------------------

    if (user.role === "VENDOR") {

        alert(
            "Access Denied: Please login as a Farmer (User) to book equipment."
        );


        return;

    }


    // ---------------------------------------------------------
    // SUCCESS PATH
    // ---------------------------------------------------------

    window.location.href =
        `booking.html?equipmentId=${equipmentId}`;

}


// =========================================================
// NOTIFICATION SYSTEM
// =========================================================

function getLoggedInUser() {

    const userData =
        sessionStorage.getItem("loggedInUser");


    if (!userData) {

        return null;

    }


    try {

        return JSON.parse(userData);

    } catch (error) {

        console.error(
            "Invalid loggedInUser data:",
            error
        );

        return null;

    }

}


// =========================================================
// LOAD NOTIFICATIONS
// =========================================================

async function loadNotifications() {

    const user =
        getLoggedInUser();


    if (!user || !user.id) {

        console.warn(
            "No logged-in user found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${NOTIFICATION_API}/user/${user.id}`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load notifications"
            );

        }


        const notifications =
            await response.json();


        displayNotifications(
            notifications
        );


        updateNotificationBadge(
            notifications
        );


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

    }

}


// =========================================================
// DISPLAY NOTIFICATIONS
// =========================================================

function displayNotifications(
    notifications
) {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) return;


    list.innerHTML = "";


    if (
        !notifications ||
        notifications.length === 0
    ) {

        list.innerHTML = `
            <p class="no-notifications">
                No notifications
            </p>
        `;

        return;

    }


    notifications.forEach(
        notification => {

            const notificationItem =
                document.createElement("div");

            notificationItem.className =
                "notification-item";


            if (!notification.read) {

                notificationItem.classList.add(
                    "unread"
                );

            }


            const otpData =
                extractOtpInformation(
                    notification.message,
                    notification.createdAt
                );


            notificationItem.innerHTML = `

                <div class="notification-content">

                    <div class="notification-title">

                        ${escapeHtml(
                            notification.title || ""
                        )}

                    </div>


                    <div class="notification-message">

                        ${escapeHtml(
                            notification.message || ""
                        )}

                    </div>


                    ${
                        otpData.otp

                            ? `

                                <div class="otp-display-box">

                                    <div class="otp-title">
                                        🔐 Delivery OTP
                                    </div>

                                    <div class="otp-value">
                                        ${escapeHtml(
                                            otpData.otp
                                        )}
                                    </div>

                                    ${
                                        otpData.expiryTime

                                            ? `

                                                <div class="otp-expiry">
                                                    Expires at:
                                                    ${escapeHtml(
                                                        otpData.expiryTime
                                                    )}
                                                </div>

                                            `

                                            : ""
                                    }

                                    ${
                                        otpData.expiryTimestamp

                                            ? `

                                                <div
                                                    class="otp-countdown"
                                                    id="otp-countdown-${notification.id}"
                                                >
                                                    Calculating...
                                                </div>

                                            `

                                            : ""
                                    }

                                </div>

                            `

                            : ""
                    }


                    <div class="notification-time">

                        ${formatNotificationTime(
                            notification.createdAt
                        )}

                    </div>

                </div>


                ${
                    !notification.read

                        ? `

                            <button
                                class="notification-read-btn"
                                onclick="
                                    markNotificationAsRead(
                                        ${notification.id}
                                    )
                                "
                            >
                                ✓
                            </button>

                        `

                        : ""
                }

            `;


            list.appendChild(
                notificationItem
            );


            if (
                otpData.expiryTimestamp
            ) {

                startOtpCountdown(
                    notification.id,
                    otpData.expiryTimestamp
                );

            }

        }
    );

}

async function markAllNotificationsRead() {

    const user = getLoggedInUser();

    if (!user || !user.id) {
        alert("Please login first.");
        return;
    }

    try {

        const response = await fetch(
            `${API}/notifications/user/${user.id}/read-all`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to mark all notifications as read."
            );
        }

        // Reload notifications after marking them as read
        await loadNotifications();

    } catch (error) {

        console.error(
            "Mark all notifications read error:",
            error
        );

        alert(
            error.message ||
            "Unable to mark notifications as read."
        );
    }
}

// =========================================================
// UPDATE NOTIFICATION BADGE
// =========================================================

function updateNotificationBadge(
    notifications
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) return;


    const unreadCount =
        notifications.filter(
            notification =>
                !notification.read
        ).length;


    if (unreadCount > 0) {

        badge.textContent =
            unreadCount;

        badge.style.display =
            "inline-block";

    } else {

        badge.style.display =
            "none";

    }

}


// =========================================================
// TOGGLE NOTIFICATION PANEL
// =========================================================

function toggleNotifications() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );


    if (!panel) return;


    if (
        panel.style.display ===
        "block"
    ) {

        panel.style.display =
            "none";

    } else {

        panel.style.display =
            "block";

    }

}


// =========================================================
// MARK NOTIFICATION AS READ
// =========================================================

async function markNotificationAsRead(
    notificationId
) {

    try {

        const response =
            await fetch(
                `${NOTIFICATION_API}/${notificationId}/read`,
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to mark notification as read"
            );

        }


        await loadNotifications();


    } catch (error) {

        console.error(
            "Error marking notification as read:",
            error
        );

    }

}


// =========================================================
// MARK ALL NOTIFICATIONS AS READ
// =========================================================

async function markAllNotificationsAsRead() {

    const user =
        getLoggedInUser();


    if (!user || !user.id) {

        return;

    }


    try {

        const response =
            await fetch(
                `${NOTIFICATION_API}/user/${user.id}/read-all`,
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to mark all notifications as read"
            );

        }


        await loadNotifications();


    } catch (error) {

        console.error(
            "Error marking all notifications as read:",
            error
        );

    }

}


// =========================================================
// NOTIFICATION TIME FORMAT
// =========================================================

function formatNotificationTime(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================================
// OTP INFORMATION EXTRACTION
// =========================================================

function extractOtpInformation(
    message,
    notificationCreatedAt
) {

    if (!message) {

        return {
            otp: "",
            expiryTime: "",
            expiryTimestamp: null
        };

    }


    const otpMatch =
        message.match(
            /OTP is\s+(\d{4})/i
        );


    const otp =
        otpMatch
            ? otpMatch[1]
            : "";


    const expiryMatch =
        message.match(
            /Expires at\s+(\d{1,2}:\d{2}\s*[AP]M)/i
        );


    const expiryTime =
        expiryMatch
            ? expiryMatch[1]
            : "";


    let expiryTimestamp =
        null;


    if (notificationCreatedAt) {

        const createdTime =
            new Date(
                notificationCreatedAt
            ).getTime();


        if (
            !Number.isNaN(
                createdTime
            )
        ) {

            expiryTimestamp =
                createdTime +
                (10 * 60 * 1000);

        }

    }


    return {
        otp: otp,
        expiryTime: expiryTime,
        expiryTimestamp:
            expiryTimestamp
    };

}


// =========================================================
// OTP COUNTDOWN
// =========================================================

function startOtpCountdown(
    notificationId,
    expiryTimestamp
) {

    if (
        otpCountdownIntervals[
            notificationId
        ]
    ) {

        clearInterval(
            otpCountdownIntervals[
                notificationId
            ]
        );

    }


    const countdownElement =
        document.getElementById(
            `otp-countdown-${notificationId}`
        );


    if (!countdownElement) {

        return;

    }


    function updateCountdown() {

        const now =
            Date.now();


        const remaining =
            expiryTimestamp - now;


        if (remaining <= 0) {

            const notificationCard =
    countdownElement.closest(".notification-item");

if (notificationCard) {
    notificationCard.remove();
}
            countdownElement.textContent =
                "⛔ OTP Expired";

            countdownElement.style.color =
                "#d32f2f";


            clearInterval(
                otpCountdownIntervals[
                    notificationId
                ]
            );


            return;

        }


        const totalSeconds =
            Math.floor(
                remaining / 1000
            );


        const minutes =
            Math.floor(
                totalSeconds / 60
            );


        const seconds =
            totalSeconds % 60;


        countdownElement.textContent =
            `Valid for: ${minutes}:${String(
                seconds
            ).padStart(2, "0")}`;

    }


    updateCountdown();


    otpCountdownIntervals[
        notificationId
    ] = setInterval(
        updateCountdown,
        1000
    );

}


// =========================================================
// NOTIFICATION ICON
// =========================================================

function getNotificationIcon(type) {

    switch (type) {

        case "RENTAL_EXPIRED":
            return "⏰";

        case "OVERDUE_REMINDER":
            return "⚠️";

        case "RETURN_REQUESTED":
            return "📦";

        case "PAYMENT_SUCCESS":
            return "💰";

        case "DELIVERY_OTP":
            return "🚚";

        default:
            return "🔔";
    }

}


// =========================================================
// BASIC HTML ESCAPING
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// LIVE DELIVERY TRACKING
// =========================================================

async function loadLiveDelivery() {

    const user =
        getLoggedInUser();


    if (!user || !user.id) {

        return;

    }


    const section =
        document.getElementById(
            "liveTrackingSection"
        );


    if (!section) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/bookings/user/${user.id}`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load farmer bookings"
            );

        }


        const bookings =
            await response.json();


        if (
            !bookings ||
            bookings.length === 0
        ) {

            hideTrackingSection();

            stopTrackingPolling();

            return;

        }


        let activeDelivery = null;


        for (
            const booking of bookings
        ) {

            if (!booking.id) {

                continue;

            }


            try {

                const deliveryResponse =
                    await fetch(
                        `${API}/deliveries/booking/${booking.id}/all`
                    );


                if (
                    !deliveryResponse.ok
                ) {

                    continue;

                }


                const deliveries =
                    await deliveryResponse.json();


                if (
                    !Array.isArray(
                        deliveries
                    ) ||
                    deliveries.length === 0
                ) {

                    continue;

                }


                for (
                    const delivery of deliveries
                ) {

                    if (
                        !delivery ||
                        !delivery.deliveryType
                    ) {

                        continue;

                    }


                    if (
                        delivery.deliveryType
                            .toUpperCase() !==
                        "OUTBOUND"
                    ) {

                        continue;

                    }


                    const status =
                        delivery.status
                            ? delivery.status.toUpperCase()
                            : "";


                    if (
                        status ===
                            "OUT_FOR_DELIVERY" ||

                        status ===
                            "ARRIVED_AT_LOCATION"
                    ) {

                        activeDelivery =
                            delivery;

                        break;

                    }

                }


                if (activeDelivery) {

                    break;

                }


            } catch (error) {

                console.warn(
                    "Could not load delivery for booking:",
                    booking.id
                );

            }

        }


        if (!activeDelivery) {

            hideTrackingSection();

            stopTrackingPolling();

            return;

        }


        displayLiveDelivery(
            activeDelivery
        );


        startTrackingPolling(
            activeDelivery.id
        );


    } catch (error) {

        console.error(
            "Live delivery loading error:",
            error
        );

    }

}


// =========================================================
// DISPLAY LIVE DELIVERY (COMPLETED)
// =========================================================

function displayLiveDelivery(
    delivery
) {

    const section =
        document.getElementById(
            "liveTrackingSection"
        );


    if (!section) return;


    section.style.display =
        "block";


    // Delivery partner
    const partnerName =
        document.getElementById(
            "trackingPartnerName"
        );


    if (partnerName) {

        const name =
            delivery.deliveryPartner &&
            delivery.deliveryPartner.user

                ? delivery.deliveryPartner.user.name

                : "Delivery Partner";


        partnerName.textContent =
            name || "Delivery Partner";

    }


    // Equipment
    const equipmentName =
        document.getElementById(
            "trackingEquipment"
        );


    if (equipmentName) {

        const equipment =
            delivery.booking &&
            delivery.booking.equipment

                ? delivery.booking.equipment.name

                : "Equipment";


        equipmentName.textContent =
            equipment || "Equipment";

    }


    // Status
    const statusElement =
        document.getElementById(
            "trackingDeliveryStatus"
        );


    const badge =
        document.getElementById(
            "trackingBadge"
        );


    const status =
        delivery.status
            ? delivery.status.toUpperCase()
            : "UNKNOWN";


    if (statusElement) {

        statusElement.textContent =
            formatDeliveryStatus(
                status
            );

    }


    if (badge) {

        badge.textContent =
            formatDeliveryStatus(
                status
            );

    }


    // Last updated
    const lastUpdated =
        document.getElementById(
            "trackingLastUpdated"
        );


    if (lastUpdated) {

        if (
            delivery.lastLocationUpdatedAt
        ) {

            lastUpdated.textContent =
                formatTrackingTime(
                    delivery.lastLocationUpdatedAt
                );

        } else {

            lastUpdated.textContent =
                "Waiting for GPS...";

        }

    }


    // Tracking status message
    const trackingStatus =
        document.getElementById(
            "trackingStatusMsg"
        );


    if (trackingStatus) {

        if (status === "ARRIVED_AT_LOCATION") {

            trackingStatus.textContent =
                "📍 Partner has arrived at your location!";

            trackingStatus.style.color =
                "#2e7d32";

        } else if (status === "OUT_FOR_DELIVERY") {

            trackingStatus.textContent =
                "🚚 Delivery partner is on the way.";

            trackingStatus.style.color =
                "#0288d1";

        } else {

            trackingStatus.textContent =
                "Tracking delivery update...";

            trackingStatus.style.color =
                "#666666";

        }

    }


    // Initialize or update map marker
    if (
        delivery.currentLatitude != null &&
        delivery.currentLongitude != null
    ) {

        updateMapLocation(
            delivery.currentLatitude,
            delivery.currentLongitude
        );

    }

}


// =========================================================
// MAP AND GPS LOCATION UPDATES (LEAFLET)
// =========================================================

function updateMapLocation(lat, lng) {

    const mapContainer =
        document.getElementById("deliveryMap");


    if (!mapContainer || typeof L === "undefined") {

        return;

    }


    if (!deliveryMap) {

        deliveryMap = L.map("deliveryMap").setView(
            [lat, lng],
            15
        );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(deliveryMap);


        deliveryMarker = L.marker([lat, lng]).addTo(
            deliveryMap
        );

    } else {

        const newPos = new L.LatLng(lat, lng);

        deliveryMarker.setLatLng(newPos);

        deliveryMap.panTo(newPos);

    }

}


// =========================================================
// TRACKING POLLING & HELPERS
// =========================================================

function startTrackingPolling(deliveryId) {

    if (trackedDeliveryId === deliveryId && trackingInterval) {

        return;

    }


    stopTrackingPolling();

    trackedDeliveryId = deliveryId;


    trackingInterval = setInterval(async () => {

        try {

            const res = await fetch(
                `${API}/deliveries/${deliveryId}`
            );


            if (!res.ok) return;


            const updatedDelivery = await res.json();


            const status =
                updatedDelivery.status
                    ? updatedDelivery.status.toUpperCase()
                    : "";


            if (
                status !== "OUT_FOR_DELIVERY" &&
                status !== "ARRIVED_AT_LOCATION"
            ) {

                hideTrackingSection();

                stopTrackingPolling();

                return;

            }


            displayLiveDelivery(updatedDelivery);

        } catch (err) {

            console.warn(
                "Error polling delivery status:",
                err
            );

        }

    }, 5000);

}


function stopTrackingPolling() {

    if (trackingInterval) {

        clearInterval(trackingInterval);

        trackingInterval = null;

    }

    trackedDeliveryId = null;

}


function hideTrackingSection() {

    const section =
        document.getElementById(
            "liveTrackingSection"
        );


    if (section) {

        section.style.display = "none";

    }

}


function formatDeliveryStatus(status) {

    switch (status) {

        case "OUT_FOR_DELIVERY":
            return "Out for Delivery";

        case "ARRIVED_AT_LOCATION":
            return "Arrived at Location";

        case "DELIVERED":
            return "Delivered";

        case "PENDING":
            return "Pending";

        default:
            return status;

    }

}


function formatTrackingTime(dateString) {

    if (!dateString) return "N/A";


    const date = new Date(dateString);


    if (Number.isNaN(date.getTime())) return "N/A";


    return date.toLocaleTimeString("en-IN", {

        hour: "2-digit",

        minute: "2-digit",

        second: "2-digit"

    });

}