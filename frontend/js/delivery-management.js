// ============================================================
// AGRIRENT HUB
// VENDOR DELIVERY MANAGEMENT
// ============================================================

const API_BASE = "http://localhost:8080/api";

let loggedInVendor = null;
let selectedBookingId = null;
let selectedDeliveryId = null;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeVendor();
});


// ============================================================
// INITIALIZE VENDOR
// ============================================================

function initializeVendor() {

    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw || userRaw === "null") {

        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {

        loggedInVendor = JSON.parse(userRaw);

    } catch (error) {

        console.error("Invalid logged-in user:", error);

        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }


    // Only vendor allowed

    if (
        !loggedInVendor ||
        loggedInVendor.role !== "VENDOR"
    ) {

        alert(
            "Unauthorized access. Vendor account required."
        );

        window.location.href = "login.html";
        return;
    }


    if (!loggedInVendor.id) {

        alert(
            "Vendor ID is missing. Please login again."
        );

        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }


    loadVendorBookings();
}


// ============================================================
// LOAD VENDOR BOOKINGS
// ============================================================

function loadVendorBookings() {

    showLoading(true);
    hideError();
    hideNoData();

    const vendorId = loggedInVendor.id;

    fetch(
        `${API_BASE}/bookings/vendor/${vendorId}`
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Failed to load vendor bookings"
                );
            }

            return response.json();
        })

        .then(bookings => {

            /*
             * We need bookings which can participate
             * in the delivery/return lifecycle.
             *
             * APPROVED → outbound delivery
             * PAID → payment completed
             * ACTIVE → equipment with farmer
             * OVERDUE → rental expired
             * RETURNED → return completed
             */

            const deliveryBookings =
                (bookings || []).filter(booking =>
                    [
                        "APPROVED",
                        "PAID",
                        "ACTIVE",
                        "OVERDUE",
                        "RETURNED"
                    ].includes(
                        String(booking.status || "").toUpperCase()
                    )
                );


            updateApprovedBookingCount(
                deliveryBookings.length
            );


            if (deliveryBookings.length === 0) {

                showLoading(false);
                showNoData();

                return;
            }


            hideNoData();


            /*
             * Load delivery information for
             * every relevant booking.
             */

            loadDeliveriesForBookings(
                deliveryBookings
            );

        })

        .catch(error => {

            console.error(
                "Error loading bookings:",
                error
            );

            showLoading(false);

            showError(
                "Unable to load bookings. Make sure the backend is running."
            );
        });
}


// ============================================================
// LOAD ALL DELIVERIES FOR BOOKINGS
// OUTBOUND + RETURN
// ============================================================

async function loadDeliveriesForBookings(
    bookings
) {

    const container =
        document.getElementById(
            "deliveryContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    let activeCount = 0;
    let completedCount = 0;


    /*
     * Load all deliveries for every booking.
     */

    for (const booking of bookings) {

        try {

            const response =
                await fetch(
                    `${API_BASE}/deliveries/booking/${booking.id}/all`
                );


            if (response.ok) {

                const deliveries =
                    await response.json();


                /*
                 * Make sure response is an array.
                 */

                const deliveryList =
                    Array.isArray(deliveries)
                        ? deliveries
                        : [];


                /*
                 * Separate outbound and return deliveries.
                 */

                const outboundDelivery =
                    deliveryList.find(
                        delivery =>
                            String(
                                delivery.deliveryType || ""
                            ).toUpperCase() === "OUTBOUND"
                    );


                const returnDelivery =
                    deliveryList.find(
                        delivery =>
                            String(
                                delivery.deliveryType || ""
                            ).toUpperCase() === "RETURN"
                    );


                /*
                 * Count active/completed deliveries.
                 */

                deliveryList.forEach(
                    delivery => {

                        const status =
                            String(
                                delivery.status || ""
                            ).toUpperCase();

                        if (
                            status !== "DELIVERED"
                        ) {

                            activeCount++;

                        } else {

                            completedCount++;
                        }
                    }
                );


                /*
                 * Display outbound delivery if it exists.
                 */

                if (outboundDelivery) {

                    container.appendChild(
                        createDeliveryCard(
                            booking,
                            outboundDelivery
                        )
                    );

                } else {

                    /*
                     * No outbound delivery yet.
                     */

                    if (
                        ["APPROVED", "PAID"]
                            .includes(
                                String(
                                    booking.status || ""
                                ).toUpperCase()
                            )
                    ) {

                        container.appendChild(
                            createBookingCard(
                                booking
                            )
                        );
                    }
                }


                /*
                 * Display return delivery if it exists.
                 */

                if (returnDelivery) {

                    container.appendChild(
                        createReturnDeliveryCard(
                            booking,
                            returnDelivery
                        )
                    );
                }

            } else {

                /*
                 * If there are no deliveries yet,
                 * show booking card only when
                 * outbound delivery can be created.
                 */

                if (
                    ["APPROVED", "PAID"]
                        .includes(
                            String(
                                booking.status || ""
                            ).toUpperCase()
                        )
                ) {

                    container.appendChild(
                        createBookingCard(
                            booking
                        )
                    );
                }
            }

        } catch (error) {

            console.error(
                `Delivery error for booking ${booking.id}:`,
                error
            );


            /*
             * Don't stop other bookings if
             * one booking has an error.
             */

            if (
                ["APPROVED", "PAID"]
                    .includes(
                        String(
                            booking.status || ""
                        ).toUpperCase()
                    )
            ) {

                container.appendChild(
                    createBookingCard(
                        booking
                    )
                );
            }
        }
    }


    const activeElement =
        document.getElementById(
            "activeDeliveries"
        );

    if (activeElement) {
        activeElement.textContent =
            activeCount;
    }


    const completedElement =
        document.getElementById(
            "completedDeliveries"
        );

    if (completedElement) {
        completedElement.textContent =
            completedCount;
    }


    showLoading(false);
}


// ============================================================
// CREATE CARD WHEN OUTBOUND DELIVERY DOES NOT EXIST
// ============================================================

function createBookingCard(
    booking
) {

    const card =
        document.createElement("div");

    card.className =
        "delivery-card";


    const customerName =
        booking.user?.name ||
        "Unknown Farmer";


    /*
     * IMPORTANT:
     * Use booking-specific delivery address.
     *
     * Do NOT use:
     * booking.user.address
     *
     * because that is the farmer's registered address.
     *
     * Example:
     * Registered Address = Sangli
     * Booking Address   = Delhi
     *
     * Vendor should see = Delhi
     */

    const customerAddress =
        booking.deliveryAddress ||
        "Address unavailable";


    const equipmentName =
        booking.equipment?.name ||
        "Unknown Equipment";


    const amount =
        typeof booking.totalAmount === "number"
            ? booking.totalAmount.toFixed(2)
            : "0.00";


    const duration =
        calculateDuration(
            booking.startDateTime,
            booking.endDateTime
        );


    card.innerHTML = `

        <div class="delivery-card-header">

            <div class="booking-title">
                Booking #${booking.id}
            </div>

            <span class="status-badge status-pending">
                DELIVERY NOT CREATED
            </span>

        </div>


        <div class="delivery-card-body">

            <div class="info-row">

                <span class="info-label">
                    Farmer
                </span>

                <span class="info-value">
                    ${escapeHtml(customerName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Equipment
                </span>

                <span class="info-value">
                    ${escapeHtml(equipmentName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Duration
                </span>

                <span class="info-value">
                    ${duration}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Amount
                </span>

                <span class="info-value">
                    ₹${amount}
                </span>

            </div>


            <!-- BOOKING-SPECIFIC DELIVERY ADDRESS -->

            <div class="info-row">

                <span class="info-label">
                    Delivery Address
                </span>

                <span class="info-value">
                    ${escapeHtml(customerAddress)}
                </span>

            </div>

        </div>


        <div class="delivery-actions">

            <button
                class="action-btn assign-btn"
                onclick="createDelivery(${booking.id})">

                🚚 Create Delivery

            </button>

        </div>

    `;


    return card;
}


// ============================================================
// CREATE OUTBOUND DELIVERY
// ============================================================

function createDelivery(
    bookingId
) {

    if (
        !confirm(
            "Create delivery for this booking?"
        )
    ) {

        return;
    }


    fetch(
        `${API_BASE}/deliveries/booking/${bookingId}`,
        {
            method: "POST"
        }
    )

        .then(response => {

            return response.json()
                .then(data => ({
                    ok: response.ok,
                    data: data
                }));

        })

        .then(result => {

            if (!result.ok) {

                throw new Error(
                    result.data.error ||
                    "Failed to create delivery"
                );
            }


            alert(
                "✅ Delivery created successfully."
            );


            loadVendorBookings();

        })

        .catch(error => {

            console.error(
                "Create delivery error:",
                error
            );

            alert(
                "❌ " + error.message
            );
        });
}


// ============================================================
// CREATE OUTBOUND DELIVERY CARD
// ============================================================

function createDeliveryCard(
    booking,
    delivery
) {

    const card =
        document.createElement("div");

    card.className =
        "delivery-card";


    const statusClass =
        getStatusClass(
            delivery.status
        );


    const statusText =
        formatStatus(
            delivery.status
        );


    const customerName =
        booking.user?.name ||
        "Unknown Farmer";


    const customerAddress =
    delivery.deliveryAddress?.trim() ||
    booking.deliveryAddress?.trim() ||
    "Booking delivery address unavailable";


    const equipmentName =
        booking.equipment?.name ||
        "Unknown Equipment";


    const amount =
        typeof booking.totalAmount === "number"
            ? booking.totalAmount.toFixed(2)
            : "0.00";


    const duration =
        calculateDuration(
            booking.startDateTime,
            booking.endDateTime
        );


    let partnerHtml = "";


    if (delivery.deliveryPartner) {

        const partner =
            delivery.deliveryPartner;

        const partnerUser =
            partner.user || {};


        partnerHtml = `

            <div class="partner-info">

                <h4>
                    🚚 Assigned Delivery Partner
                </h4>

                <p>

                    <strong>
                        Name:
                    </strong>

                    ${escapeHtml(
                        partnerUser.name ||
                        "Unknown"
                    )}

                </p>

                <p>

                    <strong>
                        Vehicle:
                    </strong>

                    ${escapeHtml(
                        partner.vehicleNumber ||
                        "N/A"
                    )}

                </p>

                <p>

                    <strong>
                        Vehicle Type:
                    </strong>

                    ${escapeHtml(
                        partner.vehicleType ||
                        "N/A"
                    )}

                </p>

            </div>

        `;
    }


    card.innerHTML = `

        <div class="delivery-card-header">

            <div class="booking-title">

                Booking #${booking.id}

                <small>
                    • OUTBOUND
                </small>

            </div>

            <span class="status-badge ${statusClass}">

                ${statusText}

            </span>

        </div>


        <div class="delivery-card-body">

            <div class="info-row">

                <span class="info-label">
                    Farmer
                </span>

                <span class="info-value">
                    ${escapeHtml(customerName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Equipment
                </span>

                <span class="info-value">
                    ${escapeHtml(equipmentName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Duration
                </span>

                <span class="info-value">
                    ${duration}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Amount
                </span>

                <span class="info-value">
                    ₹${amount}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Delivery Address
                </span>

                <span class="info-value">
                    ${escapeHtml(customerAddress)}
                </span>

            </div>


            ${partnerHtml}


            ${createTimeline(
                delivery.status,
                false
            )}

        </div>


        <div class="delivery-actions">

            ${getActionButtons(
                delivery
            )}

        </div>

    `;


    return card;
}


// ============================================================
// CREATE RETURN DELIVERY CARD
// ============================================================

function createReturnDeliveryCard(
    booking,
    delivery
) {

    const card =
        document.createElement("div");

    card.className =
        "delivery-card return-delivery-card";


    const statusClass =
        getReturnStatusClass(
            delivery.status
        );


    const statusText =
        formatReturnStatus(
            delivery.status
        );


    const customerName =
        booking.user?.name ||
        "Unknown Farmer";


    const returnAddress =
        delivery.deliveryAddress ||
        booking.user?.address ||
        "Address unavailable";


    const equipmentName =
        booking.equipment?.name ||
        "Unknown Equipment";


    let partnerHtml = "";


    if (delivery.deliveryPartner) {

        const partner =
            delivery.deliveryPartner;

        const partnerUser =
            partner.user || {};


        partnerHtml = `

            <div class="partner-info">

                <h4>
                    🚚 Return Delivery Partner
                </h4>

                <p>

                    <strong>
                        Name:
                    </strong>

                    ${escapeHtml(
                        partnerUser.name ||
                        "Unknown"
                    )}

                </p>

                <p>

                    <strong>
                        Vehicle:
                    </strong>

                    ${escapeHtml(
                        partner.vehicleNumber ||
                        "N/A"
                    )}

                </p>

                <p>

                    <strong>
                        Vehicle Type:
                    </strong>

                    ${escapeHtml(
                        partner.vehicleType ||
                        "N/A"
                    )}

                </p>

            </div>

        `;
    }


    card.innerHTML = `

        <div class="delivery-card-header">

            <div class="booking-title">

                Booking #${booking.id}

                <small>
                    • RETURN
                </small>

            </div>

            <span class="status-badge ${statusClass}">

                ${statusText}

            </span>

        </div>


        <div class="delivery-card-body">

            <div class="return-request-banner">

                🔄 <strong>Equipment Return</strong>

                <p>
                    Farmer has requested pickup of
                    the rented equipment.
                </p>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Farmer
                </span>

                <span class="info-value">
                    ${escapeHtml(customerName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Equipment
                </span>

                <span class="info-value">
                    ${escapeHtml(equipmentName)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    Pickup Address
                </span>

                <span class="info-value">
                    ${escapeHtml(returnAddress)}
                </span>

            </div>


            ${partnerHtml}


            ${createTimeline(
                delivery.status,
                true
            )}

        </div>


        <div class="delivery-actions">

            ${getReturnActionButtons(
                delivery
            )}

        </div>

    `;


    return card;
}


// ============================================================
// OUTBOUND ACTION BUTTONS
// ============================================================

function getActionButtons(
    delivery
) {

    const status =
        String(
            delivery.status || ""
        ).toUpperCase();


    // -----------------------------------------
    // PENDING
    // -----------------------------------------

    if (status === "PENDING") {

        return `

            <button
                class="action-btn ready-btn"
                onclick="markDeliveryReady(${delivery.id})">

                📦 Mark Ready

            </button>

        `;
    }


    // -----------------------------------------
    // READY FOR DELIVERY
    // -----------------------------------------

    if (
        status === "READY_FOR_DELIVERY"
    ) {

        return `

            <button
                class="action-btn assign-btn"
                onclick="openPartnerModal(
                    ${delivery.id},
                    ${delivery.booking?.id || 0}
                )">

                🚚 Assign Delivery Partner

            </button>

        `;
    }


    // -----------------------------------------
    // ASSIGNED
    // -----------------------------------------

    if (status === "ASSIGNED") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                ✓ Partner Assigned

            </button>

        `;
    }


    // -----------------------------------------
    // PICKED UP
    // -----------------------------------------

    if (status === "PICKED_UP") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                📦 Equipment Picked Up

            </button>

        `;
    }


    // -----------------------------------------
    // OUT FOR DELIVERY
    // -----------------------------------------

    if (status === "OUT_FOR_DELIVERY") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                🚚 Out for Delivery

            </button>

        `;
    }


    // -----------------------------------------
    // DELIVERED
    // -----------------------------------------

    if (status === "DELIVERED") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                ✓ Delivery Completed

            </button>

        `;
    }


    return "";
}


// ============================================================
// RETURN ACTION BUTTONS
// ============================================================

function getReturnActionButtons(
    delivery
) {

    const status =
        String(
            delivery.status || ""
        ).toUpperCase();


    // -----------------------------------------
    // RETURN REQUESTED
    // -----------------------------------------

    if (status === "RETURN_REQUESTED") {

        return `

            <button
                class="action-btn ready-btn"
                onclick="markDeliveryReady(${delivery.id})">

                📦 Mark Return Ready

            </button>

        `;
    }


    // -----------------------------------------
    // READY FOR DELIVERY
    // -----------------------------------------

    if (
        status === "READY_FOR_DELIVERY"
    ) {

        return `

            <button
                class="action-btn assign-btn"
                onclick="openPartnerModal(
                    ${delivery.id},
                    ${delivery.booking?.id || 0}
                )">

                🚚 Assign Return Partner

            </button>

        `;
    }


    // -----------------------------------------
    // ASSIGNED
    // -----------------------------------------

    if (status === "ASSIGNED") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                ✓ Return Partner Assigned

            </button>

        `;
    }


    // -----------------------------------------
    // PICKED UP
    // -----------------------------------------

    if (status === "PICKED_UP") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                📦 Equipment Picked Up

            </button>

        `;
    }


    // -----------------------------------------
    // OUT FOR DELIVERY
    // -----------------------------------------

    if (status === "OUT_FOR_DELIVERY") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                🚚 Returning to Vendor

            </button>

        `;
    }


    // -----------------------------------------
    // RETURN COMPLETED
    // -----------------------------------------

    if (status === "DELIVERED") {

        return `

            <button
                class="action-btn disabled-btn"
                disabled>

                ✓ Equipment Returned

            </button>

        `;
    }


    return "";
}


// ============================================================
// MARK DELIVERY READY
// Works for OUTBOUND and RETURN
// ============================================================

function markDeliveryReady(
    deliveryId
) {

    if (
        !confirm(
            "Mark this equipment as ready?"
        )
    ) {

        return;
    }


    fetch(
        `${API_BASE}/deliveries/${deliveryId}/ready`,
        {
            method: "PUT"
        }
    )

        .then(response => {

            return response.json()
                .then(data => ({
                    ok: response.ok,
                    data: data
                }));

        })

        .then(result => {

            if (!result.ok) {

                throw new Error(
                    result.data.error ||
                    "Unable to mark delivery ready"
                );
            }


            alert(
                "✅ Delivery marked READY_FOR_DELIVERY."
            );


            loadVendorBookings();

        })

        .catch(error => {

            console.error(
                "Mark ready error:",
                error
            );


            alert(
                "❌ " + error.message
            );
        });
}


// ============================================================
// OPEN PARTNER MODAL
// ============================================================

function openPartnerModal(
    deliveryId,
    bookingId
) {

    selectedDeliveryId =
        deliveryId;

    selectedBookingId =
        bookingId;


    const modal =
        document.getElementById(
            "partnerModal"
        );


    const info =
        document.getElementById(
            "partnerBookingInfo"
        );


    const partnerList =
        document.getElementById(
            "partnerList"
        );


    const loading =
        document.getElementById(
            "partnerLoading"
        );


    const noPartner =
        document.getElementById(
            "noPartnerBox"
        );


    if (!modal) {

        alert(
            "Partner modal not found in HTML."
        );

        return;
    }


    modal.style.display =
        "flex";


    if (info) {

        info.textContent =
            `Select an available delivery partner for Booking #${bookingId}.`;
    }


    if (partnerList) {

        partnerList.innerHTML =
            "";
    }


    if (loading) {

        loading.style.display =
            "block";
    }


    if (noPartner) {

        noPartner.style.display =
            "none";
    }


    fetch(
        `${API_BASE}/delivery-partners/available`
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Unable to load delivery partners"
                );
            }

            return response.json();
        })

        .then(partners => {

            if (loading) {

                loading.style.display =
                    "none";
            }


            if (
                !partners ||
                partners.length === 0
            ) {

                if (noPartner) {

                    noPartner.style.display =
                        "block";
                }

                return;
            }


            partners.forEach(
                partner => {

                    if (partnerList) {

                        partnerList.appendChild(
                            createPartnerCard(
                                partner
                            )
                        );
                    }
                }
            );

        })

        .catch(error => {

            if (loading) {

                loading.style.display =
                    "none";
            }


            console.error(
                "Partner loading error:",
                error
            );


            if (partnerList) {

                partnerList.innerHTML = `

                    <div class="no-partner">

                        ❌
                        Unable to load delivery partners.

                    </div>

                `;
            }
        });
}


// ============================================================
// CREATE PARTNER CARD
// ============================================================

function createPartnerCard(
    partner
) {

    const card =
        document.createElement("div");

    card.className =
        "partner-card";


    const user =
        partner.user || {};


    card.innerHTML = `

        <div>

            <div class="partner-name">

                ${escapeHtml(
                    user.name ||
                    "Unknown Partner"
                )}

            </div>


            <div class="partner-details">

                📱
                ${escapeHtml(
                    user.mobile ||
                    "N/A"
                )}

                <br>

                🚚
                ${escapeHtml(
                    partner.vehicleType ||
                    "Vehicle"
                )}

                <br>

                🔢
                ${escapeHtml(
                    partner.vehicleNumber ||
                    "N/A"
                )}

            </div>

        </div>


        <button
            class="select-partner-btn"
            onclick="assignDeliveryPartner(
                ${partner.id}
            )">

            Assign

        </button>

    `;


    return card;
}


// ============================================================
// ASSIGN PARTNER
// ============================================================

function assignDeliveryPartner(
    partnerId
) {

    if (
        !selectedDeliveryId ||
        !loggedInVendor ||
        !loggedInVendor.id
    ) {

        alert(
            "Invalid delivery or vendor information."
        );

        return;
    }


    if (
        !confirm(
            "Assign this delivery partner?"
        )
    ) {

        return;
    }


    const vendorId =
        loggedInVendor.id;


    const url =
        `${API_BASE}/deliveries/` +
        `${selectedDeliveryId}/assign/` +
        `${partnerId}` +
        `?vendorUserId=${vendorId}`;


    fetch(
        url,
        {
            method: "PUT"
        }
    )

        .then(response => {

            return response.json()
                .then(data => ({
                    ok: response.ok,
                    data: data
                }));

        })

        .then(result => {

            if (!result.ok) {

                throw new Error(
                    result.data.error ||
                    "Unable to assign partner"
                );
            }


            alert(
                "✅ Delivery partner assigned successfully."
            );


            closePartnerModal();

            loadVendorBookings();

        })

        .catch(error => {

            console.error(
                "Partner assignment error:",
                error
            );


            alert(
                "❌ " + error.message
            );
        });
}


// ============================================================
// CLOSE PARTNER MODAL
// ============================================================

function closePartnerModal() {

    const modal =
        document.getElementById(
            "partnerModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    selectedDeliveryId =
        null;

    selectedBookingId =
        null;
}


// ============================================================
// TIMELINE
// ============================================================

function createTimeline(
    currentStatus,
    isReturn = false
) {

    let statuses;


    if (isReturn) {

        statuses = [

            {
                key: "RETURN_REQUESTED",
                text: "Return Requested"
            },

            {
                key: "READY_FOR_DELIVERY",
                text: "Return Ready"
            },

            {
                key: "ASSIGNED",
                text: "Partner Assigned"
            },

            {
                key: "PICKED_UP",
                text: "Equipment Picked Up"
            },

            {
                key: "OUT_FOR_DELIVERY",
                text: "Returning to Vendor"
            },

            {
                key: "DELIVERED",
                text: "Equipment Returned"
            }

        ];

    } else {

        statuses = [

            {
                key: "PENDING",
                text: "Delivery Created"
            },

            {
                key: "READY_FOR_DELIVERY",
                text: "Equipment Ready"
            },

            {
                key: "ASSIGNED",
                text: "Delivery Partner Assigned"
            },

            {
                key: "PICKED_UP",
                text: "Equipment Picked Up"
            },

            {
                key: "OUT_FOR_DELIVERY",
                text: "Out for Delivery"
            },

            {
                key: "DELIVERED",
                text: "Delivered"
            }

        ];
    }


    const currentIndex =
        statuses.findIndex(
            item =>
                item.key === currentStatus
        );


    return `

        <div class="timeline">

            ${statuses.map(
                (item, index) => {

                    const completed =
                        index <= currentIndex;


                    return `

                        <div
                            class="timeline-item
                            ${completed
                                ? "completed"
                                : ""}">

                            ${completed
                                ? "✓"
                                : "○"}

                            &nbsp;

                            ${item.text}

                        </div>

                    `;

                }
            ).join("")}

        </div>

    `;
}


// ============================================================
// OUTBOUND STATUS CLASS
// ============================================================

function getStatusClass(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

        case "PENDING":
            return "status-pending";

        case "READY_FOR_DELIVERY":
            return "status-ready";

        case "ASSIGNED":
            return "status-assigned";

        case "PICKED_UP":
            return "status-picked";

        case "OUT_FOR_DELIVERY":
            return "status-out";

        case "DELIVERED":
            return "status-delivered";

        default:
            return "status-pending";
    }
}


// ============================================================
// OUTBOUND FORMAT STATUS
// ============================================================

function formatStatus(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

        case "PENDING":
            return "PENDING";

        case "READY_FOR_DELIVERY":
            return "READY FOR DELIVERY";

        case "ASSIGNED":
            return "PARTNER ASSIGNED";

        case "PICKED_UP":
            return "PICKED UP";

        case "OUT_FOR_DELIVERY":
            return "OUT FOR DELIVERY";

        case "DELIVERED":
            return "DELIVERED";

        default:
            return status || "UNKNOWN";
    }
}


// ============================================================
// RETURN STATUS CLASS
// ============================================================

function getReturnStatusClass(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

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

        case "DELIVERED":
            return "status-delivered";

        default:
            return "status-return-requested";
    }
}


// ============================================================
// RETURN FORMAT STATUS
// ============================================================

function formatReturnStatus(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

        case "RETURN_REQUESTED":
            return "RETURN REQUESTED";

        case "READY_FOR_DELIVERY":
            return "RETURN READY";

        case "ASSIGNED":
            return "PARTNER ASSIGNED";

        case "PICKED_UP":
            return "EQUIPMENT PICKED UP";

        case "OUT_FOR_DELIVERY":
            return "RETURNING TO VENDOR";

        case "DELIVERED":
            return "EQUIPMENT RETURNED";

        default:
            return status || "UNKNOWN";
    }
}


// ============================================================
// CALCULATE DURATION
// ============================================================

function calculateDuration(
    startDateTime,
    endDateTime
) {

    if (
        !startDateTime ||
        !endDateTime
    ) {

        return "N/A";
    }


    const start =
        new Date(startDateTime);

    const end =
        new Date(endDateTime);


    const diffMs =
        end - start;


    if (diffMs <= 0) {

        return "N/A";
    }


    const diffHours =
        diffMs /
        (1000 * 60 * 60);


    if (diffHours >= 24) {

        return `${Math.ceil(
            diffHours / 24
        )} Day(s)`;
    }


    return `${Math.ceil(
        diffHours
    )} Hour(s)`;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

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


// ============================================================
// LOADING
// ============================================================

function showLoading(
    show
) {

    const loading =
        document.getElementById(
            "loadingBox"
        );


    if (loading) {

        loading.style.display =
            show ? "block" : "none";
    }
}


// ============================================================
// NO DATA
// ============================================================

function showNoData() {

    const box =
        document.getElementById(
            "noDataBox"
        );


    if (box) {

        box.style.display =
            "block";
    }
}


function hideNoData() {

    const box =
        document.getElementById(
            "noDataBox"
        );


    if (box) {

        box.style.display =
            "none";
    }
}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    const box =
        document.getElementById(
            "errorBox"
        );


    if (!box) return;


    box.textContent =
        message;

    box.style.display =
        "block";
}


function hideError() {

    const box =
        document.getElementById(
            "errorBox"
        );


    if (box) {

        box.style.display =
            "none";
    }
}


// ============================================================
// SUMMARY
// ============================================================

function updateApprovedBookingCount(
    count
) {

    const element =
        document.getElementById(
            "totalBookings"
        );


    if (element) {

        element.textContent =
            count;
    }
}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    sessionStorage.clear();

    localStorage.removeItem(
        "loggedInUser"
    );

    window.location.href =
        "login.html";
}