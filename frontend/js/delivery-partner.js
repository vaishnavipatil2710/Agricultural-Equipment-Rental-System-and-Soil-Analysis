const API = "http://localhost:8080/api";

let loggedInUser = null;

/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    const userData = sessionStorage.getItem("loggedInUser");

    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        loggedInUser = JSON.parse(userData);
    } catch (error) {
        console.error(error);
        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }

    if (loggedInUser.role !== "DELIVERY_PARTNER") {
        alert("Unauthorized access.");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("partnerName").textContent =
        loggedInUser.name;

    document.getElementById("welcomeName").textContent =
        loggedInUser.name;

    loadPartnerInfo();
    loadDeliveries();
});


/* ==========================================
   LOAD PARTNER INFORMATION
========================================== */

async function loadPartnerInfo() {

    try {

        const response = await fetch(
            `${API}/delivery-partners/user/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load partner information"
            );
        }

        document.getElementById("vehicleInfo").textContent =
            `${data.vehicleNumber} - ${data.vehicleType}`;

        document.getElementById("partnerStatus").textContent =
            data.available ? "Available" : "Busy";

    } catch (error) {

        console.error(
            "Partner information error:",
            error
        );

        document.getElementById("vehicleInfo").textContent =
            "Not available";

        document.getElementById("partnerStatus").textContent =
            "Unknown";
    }
}


/* ==========================================
   LOAD ASSIGNED DELIVERIES
========================================== */

async function loadDeliveries() {

    const container =
        document.getElementById("deliveryContainer");

    container.innerHTML = `
        <div class="loading">
            Loading deliveries...
        </div>
    `;

    try {

        const response = await fetch(
            `${API}/deliveries/partner/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Unable to load deliveries"
            );
        }

        document.getElementById("deliveryCount").textContent =
            data.length;

        renderDeliveries(data);

    } catch (error) {

        console.error(
            "Delivery loading error:",
            error
        );

        container.innerHTML = `
            <div class="error-state">
                <h3>❌ Unable to load deliveries</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


/* ==========================================
   RENDER DELIVERY CARDS
========================================== */

function renderDeliveries(deliveries) {

    const container =
        document.getElementById("deliveryContainer");

    if (!deliveries || deliveries.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📦
                </div>

                <h3>
                    No deliveries assigned
                </h3>

                <p>
                    Your assigned deliveries
                    will appear here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = "";

    deliveries.forEach(function (delivery) {

        const booking = delivery.booking || {};
        const farmer = booking.user || {};
        const equipment = booking.equipment || {};

        const isReturn =
            delivery.deliveryType === "RETURN";

        const deliveryTitle =
            isReturn
                ? `Return #${delivery.id}`
                : `Delivery #${delivery.id}`;

        const deliveryTypeLabel =
            isReturn
                ? "🔄 RETURN TO VENDOR"
                : "🚚 OUTBOUND DELIVERY";

        const card = document.createElement("div");

        card.className =
            isReturn
                ? "delivery-card return-delivery-card"
                : "delivery-card";

        card.innerHTML = `

            <div class="delivery-header">

                <div>
                    <h3>
                        ${deliveryTitle}
                    </h3>

                    <small>
                        ${deliveryTypeLabel}
                    </small>
                </div>

                <span class="status ${getStatusClass(delivery.status, isReturn)}">
                    ${formatStatus(delivery.status)}
                </span>

            </div>


            <div class="delivery-details">

                <div class="detail-box">

                    <span>Farmer</span>

                    <strong>
                        ${escapeHtml(
                            farmer.name || "Unknown"
                        )}
                    </strong>

                </div>


                <div class="detail-box">

                    <span>Farmer Mobile</span>

                    <strong>
                        ${
                            farmer.mobile
                                ? `<a href="tel:${escapeHtml(farmer.mobile)}"
                                     class="call-farmer-btn">
                                     📞 Call Farmer
                                   </a>`
                                : "Not available"
                        }
                    </strong>

                </div>


                <div class="detail-box">

                    <span>Equipment</span>

                    <strong>
                        ${escapeHtml(
                            equipment.name ||
                            "Unknown Equipment"
                        )}
                    </strong>

                </div>


                <div class="detail-box">

                    <span>
                        ${isReturn
                            ? "Pickup Address"
                            : "Delivery Address"}
                    </span>

                    <strong>
                        ${escapeHtml(
                            delivery.deliveryAddress ||
                            "Not available"
                        )}
                    </strong>

                </div>


                <div class="detail-box">

                    <span>Booking ID</span>

                    <strong>
                        #${booking.id || "N/A"}
                    </strong>

                </div>

            </div>


            <div class="delivery-actions">

                ${getActionButton(delivery)}

            </div>


            <div id="message-${delivery.id}">

                ${getDeliveryMessage(delivery)}

            </div>

        `;

        container.appendChild(card);
    });
}


/* ==========================================
   ACTION BUTTONS
========================================== */

function getActionButton(delivery) {

    const id = delivery.id;

    const isReturn =
        delivery.deliveryType === "RETURN";


    /* ======================================
       ASSIGNED → PICKUP
    ====================================== */

    if (delivery.status === "ASSIGNED") {

        return `

            <button
                class="action-btn pickup-btn"
                onclick="pickupDelivery(${id})">

                📦
                ${isReturn
                    ? "Pickup Equipment From Farmer"
                    : "Pickup Equipment"}

            </button>

        `;
    }


    /* ======================================
       PICKED_UP → START
    ====================================== */

    if (delivery.status === "PICKED_UP") {

        return `

            <button
                class="action-btn start-btn"
                onclick="startDelivery(${id})">

                🚚
                ${isReturn
                    ? "Start Return"
                    : "Start Delivery"}

            </button>

        `;
    }


    /* ======================================
       OUT_FOR_DELIVERY
    ====================================== */

    if (delivery.status === "OUT_FOR_DELIVERY") {

        /* RETURN DELIVERY
           No OTP required
        */

        if (isReturn) {

            return `

                <button
                    class="action-btn complete-btn"
                    onclick="completeReturnDelivery(${id})">

                    ✅ Complete Return

                </button>

            `;
        }


        /* OUTBOUND DELIVERY
           Partner can mark arrival or report failure
        */

        return `
            <div class="delivery-actions">

                <button
                    class="action-btn arrival-btn"
                    onclick="arriveAtLocation(${id})">

                    📍 I Have Arrived

                </button>

                <button
                    class="action-btn failure-btn"
                    onclick="reportUnableToDeliver(${id})">

                    ⚠️ Unable to Deliver

                </button>

            </div>
        `;
    }


    /* ======================================
       ARRIVED_AT_LOCATION
    ====================================== */

    if (
        !isReturn &&
        delivery.status === "ARRIVED_AT_LOCATION"
    ) {

        if (delivery.otpVerified === true) {

            return `

                <button
                    class="action-btn complete-btn"
                    onclick="completeDelivery(${id})">

                    ✅ Complete Delivery

                </button>

            `;
        }


        return `

            <button
                class="action-btn"
                disabled>

                ⏳ Waiting for Farmer OTP

            </button>

        `;
    }


    /* ======================================
       DELIVERED
    ====================================== */

    if (delivery.status === "DELIVERED") {

        return `

            <button
                class="action-btn complete-btn"
                disabled>

                ${
                    isReturn
                        ? "✅ Equipment Returned"
                        : "✅ Delivered"
                }

            </button>

        `;
    }


    /* ======================================
       DELIVERY FAILED
    ====================================== */

    if (delivery.status === "DELIVERY_FAILED") {

        return `

            <button
                class="action-btn failure-btn"
                disabled>

                ⚠️ Delivery Failed

            </button>

        `;
    }


    return "";
}
/* ==========================================
   ARRIVE AT FARMER LOCATION
========================================== */

async function arriveAtLocation(deliveryId) {

    const confirmArrival = confirm(
        "Have you reached the farmer's location?"
    );

    if (!confirmArrival) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/arrived?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Unable to mark arrival"
            );
        }

        alert(
            "📍 Arrival recorded successfully. OTP is now required after the farmer receives the equipment."
        );

        await loadDeliveries();

    } catch (error) {

        console.error(
            "Arrival error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   DELIVERY MESSAGE
========================================== */

function getDeliveryMessage(delivery) {

    const isReturn =
        delivery.deliveryType === "RETURN";

    if (delivery.status === "DELIVERY_FAILED") {

        return `
            <div class="waiting-box">

                ⚠️ Delivery could not be completed.

                ${
                    delivery.failureReason
                        ? `<br><strong>Reason:</strong> ${escapeHtml(delivery.failureReason)}`
                        : ""
                }

            </div>
        `;
    }


    /* ======================================
       RETURN DELIVERY
    ====================================== */

    if (
        isReturn &&
        delivery.status === "OUT_FOR_DELIVERY"
    ) {

        return `

            <div class="verified-box">

                🔄 Return delivery is in progress.

                <br><br>

                Return the equipment to the vendor
                and click <b>Complete Return</b>.

            </div>

        `;
    }


    /* ======================================
       OUTBOUND DELIVERY
    ====================================== */

    if (
        !isReturn &&
        delivery.status === "OUT_FOR_DELIVERY"
    ) {

        return `

            <div class="waiting-box">

                🚚 Delivery is on the way.

                <br>

                Reach the farmer's location and
                click <b>I Have Arrived</b>.

                <br><br>

                If you cannot complete the delivery,
                click <b>Unable to Deliver</b> and
                provide the reason.

            </div>

        `;
    }


    /* ======================================
       ARRIVED AT LOCATION
    ====================================== */

    if (
        !isReturn &&
        delivery.status === "ARRIVED_AT_LOCATION"
    ) {

        if (delivery.otpVerified === true) {

            return `

                <div class="verified-box">

                    ✅ Farmer OTP verified.

                    <br>

                    You can now complete
                    the delivery.

                </div>

            `;
        }


        return `

            <div class="waiting-box">

                📍 You have arrived at the farmer's location.

                <br><br>

                📞 Contact the farmer and hand over
                the equipment.

                <br><br>

                🔐 After receiving the equipment,
                the farmer must verify the OTP.

            </div>

        `;
    }


    /* ======================================
       DELIVERED
    ====================================== */

    if (delivery.status === "DELIVERED") {

        if (isReturn) {

            return `

                <div class="verified-box">

                    🎉 Equipment returned
                    successfully to vendor.

                </div>

            `;
        }


        return `

            <div class="verified-box">

                🎉 Delivery completed
                successfully.

            </div>

        `;
    }


    return "";
}


/* ==========================================
   REPORT UNABLE TO DELIVER
========================================== */

async function reportUnableToDeliver(deliveryId) {

    const reason = prompt(
        "Please enter the reason you cannot deliver this equipment:"
    );

    if (reason === null) {
        return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {

        alert(
            "Please enter a reason before submitting."
        );

        return;
    }

    const confirmed = confirm(
        "Report this delivery as failed? Please confirm the reason is correct."
    );

    if (!confirmed) {
        return;
    }

    try {

        const url = new URL(
            `${API}/deliveries/${deliveryId}/unable-to-deliver`
        );

        url.searchParams.set(
            "partnerUserId",
            loggedInUser.id
        );

        url.searchParams.set(
            "reason",
            cleanReason
        );

        const response = await fetch(
            url.toString(),
            {
                method: "PUT"
            }
        );

        const data = await response.json().catch(
            () => ({})
        );

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Unable to report delivery failure."
            );
        }

        alert(
            "Delivery failure reported successfully."
        );

        await loadDeliveries();
        await loadPartnerInfo();

    } catch (error) {

        console.error(
            "Unable-to-deliver error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}

/* ==========================================
   ARRIVE AT FARMER LOCATION
========================================== */

async function arriveAtLocation(deliveryId) {

    const confirmArrival = confirm(
        "Have you reached the farmer's location?"
    );

    if (!confirmArrival) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/arrived?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Unable to mark arrival"
            );
        }

        alert(
            "📍 Arrival recorded successfully. OTP is now required after the farmer receives the equipment."
        );

        await loadDeliveries();

    } catch (error) {

        console.error(
            "Arrival error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   DELIVERY MESSAGE
========================================== */

function getDeliveryMessage(delivery) {

    const isReturn =
        delivery.deliveryType === "RETURN";

    if (delivery.status === "DELIVERY_FAILED") {

        return `
            <div class="waiting-box">

                ⚠️ Delivery could not be completed.

                ${
                    delivery.failureReason
                        ? `<br><strong>Reason:</strong> ${escapeHtml(delivery.failureReason)}`
                        : ""
                }

            </div>
        `;
    }


    /* ======================================
       RETURN DELIVERY
    ====================================== */

    if (
        isReturn &&
        delivery.status === "OUT_FOR_DELIVERY"
    ) {

        return `

            <div class="verified-box">

                🔄 Return delivery is in progress.

                <br><br>

                Return the equipment to the vendor
                and click <b>Complete Return</b>.

            </div>

        `;
    }


    /* ======================================
       OUTBOUND DELIVERY
    ====================================== */

    if (
        !isReturn &&
        delivery.status === "OUT_FOR_DELIVERY"
    ) {

        return `

            <div class="waiting-box">

                🚚 Delivery is on the way.

                <br>

                Reach the farmer's location and
                click <b>I Have Arrived</b>.

                <br><br>

                If you cannot complete the delivery,
                click <b>Unable to Deliver</b> and
                provide the reason.

            </div>

        `;
    }


    /* ======================================
       ARRIVED AT LOCATION
    ====================================== */

    if (
        !isReturn &&
        delivery.status === "ARRIVED_AT_LOCATION"
    ) {

        if (delivery.otpVerified === true) {

            return `

                <div class="verified-box">

                    ✅ Farmer OTP verified.

                    <br>

                    You can now complete
                    the delivery.

                </div>

            `;
        }


        return `

            <div class="waiting-box">

                📍 You have arrived at the farmer's location.

                <br><br>

                📞 Contact the farmer and hand over
                the equipment.

                <br><br>

                🔐 After receiving the equipment,
                the farmer must verify the OTP.

            </div>

        `;
    }


    /* ======================================
       DELIVERED
    ====================================== */

    if (delivery.status === "DELIVERED") {

        if (isReturn) {

            return `

                <div class="verified-box">

                    🎉 Equipment returned
                    successfully to vendor.

                </div>

            `;
        }


        return `

            <div class="verified-box">

                🎉 Delivery completed
                successfully.

            </div>

        `;
    }


    return "";
}


/* ==========================================
   REPORT UNABLE TO DELIVER
========================================== */

async function reportUnableToDeliver(deliveryId) {

    const reason = prompt(
        "Please enter the reason you cannot deliver this equipment:"
    );

    if (reason === null) {
        return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {

        alert(
            "Please enter a reason before submitting."
        );

        return;
    }

    const confirmed = confirm(
        "Report this delivery as failed? Please confirm the reason is correct."
    );

    if (!confirmed) {
        return;
    }

    try {

        const url = new URL(
            `${API}/deliveries/${deliveryId}/unable-to-deliver`
        );

        url.searchParams.set(
            "partnerUserId",
            loggedInUser.id
        );

        url.searchParams.set(
            "reason",
            cleanReason
        );

        const response = await fetch(
            url.toString(),
            {
                method: "PUT"
            }
        );

        const data = await response.json().catch(
            () => ({})
        );

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Unable to report delivery failure."
            );
        }

        alert(
            "Delivery failure reported successfully."
        );

        await loadDeliveries();
        await loadPartnerInfo();

    } catch (error) {

        console.error(
            "Unable-to-deliver error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   PICKUP EQUIPMENT
========================================== */

async function pickupDelivery(deliveryId) {

    const confirmPickup = confirm(
        "Have you picked up the equipment?"
    );

    if (!confirmPickup) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/pickup?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Pickup failed"
            );
        }

        alert(
            "✅ Equipment picked up successfully."
        );

        await loadDeliveries();
        await loadPartnerInfo();

    } catch (error) {

        console.error(
            "Pickup error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   START DELIVERY / RETURN
========================================== */

async function startDelivery(deliveryId) {

    const confirmStart = confirm(
        "Are you ready to start this delivery?"
    );

    if (!confirmStart) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/start?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Unable to start delivery"
            );
        }

        if (data.deliveryType === "RETURN") {

            alert(
                "🔄 Return journey started successfully."
            );

        } else {

            alert(
                "🚚 Delivery started successfully."
            );
        }

        await loadDeliveries();

    } catch (error) {

        console.error(
            "Start delivery error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   COMPLETE OUTBOUND DELIVERY
========================================== */

async function completeDelivery(deliveryId) {

    const confirmComplete = confirm(
        "Farmer OTP is verified. Complete this delivery?"
    );

    if (!confirmComplete) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/delivered?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Unable to complete delivery"
            );
        }

        alert(
            "🎉 Delivery completed successfully!"
        );

        await loadDeliveries();
        await loadPartnerInfo();

    } catch (error) {

        console.error(
            "Complete delivery error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   COMPLETE RETURN DELIVERY
========================================== */

async function completeReturnDelivery(deliveryId) {

    const confirmComplete = confirm(
        "Have you returned the equipment to the vendor?"
    );

    if (!confirmComplete) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/deliveries/${deliveryId}/return-complete?partnerUserId=${loggedInUser.id}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to complete return"
            );
        }

        alert(
            "🎉 Equipment returned successfully to vendor!"
        );

        await loadDeliveries();
        await loadPartnerInfo();

    } catch (error) {

        console.error(
            "Complete return error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* ==========================================
   FORMAT STATUS
========================================== */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}


/* ==========================================
   STATUS CSS CLASS
========================================== */

function getStatusClass(status, isReturn = false) {

    switch (status) {

        case "RETURN_REQUESTED":
            return "status-return-requested";

        case "READY_FOR_DELIVERY":
            return "status-ready";

        case "ASSIGNED":
            return "status-assigned";

        case "PICKED_UP":
            return "status-picked";

        case "OUT_FOR_DELIVERY":
            return "status-out";

        case "ARRIVED_AT_LOCATION":
            return "status-arrived";

        case "DELIVERED":
            return isReturn
                ? "status-returned"
                : "status-delivered";

        case "DELIVERY_FAILED":
            return "status-failed";

        default:
            return "";
    }
}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    sessionStorage.clear();

    window.location.href = "login.html";
}