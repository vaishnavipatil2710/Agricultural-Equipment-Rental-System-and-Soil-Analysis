// USER DASHBOARD + USER BOOKINGS – FULL LOGIC

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("equipmentBody")) {
        loadEquipment();
    }

    if (document.getElementById("bookingsGrid")) {
        loadMyBookings();
    }
});

// ==========================================
// LOAD AVAILABLE EQUIPMENT
// ==========================================

function loadEquipment() {
    const tbody = document.getElementById("equipmentBody");
    const noDataMsg = document.getElementById("noDataMsg");

    const userRaw = sessionStorage.getItem("loggedInUser");
    const currentUser = userRaw ? JSON.parse(userRaw) : null;

    if (!tbody) return;

    tbody.innerHTML = "";

    fetch("http://localhost:8080/api/equipment/available")
        .then(res => {
            if (!res.ok) {
                throw new Error("Server returned " + res.status);
            }
            return res.json();
        })
        .then(equipmentList => {
            if (!equipmentList || equipmentList.length === 0) {
                if (noDataMsg) {
                    noDataMsg.style.display = "block";
                }
                return;
            }

            if (noDataMsg) {
                noDataMsg.style.display = "none";
            }

            equipmentList.forEach(eq => {
                const isOwner =
                    currentUser &&
                    eq.vendor &&
                    currentUser.id === eq.vendor.id;

                const imagePath =
                    eq.imageUrl && eq.imageUrl.trim() !== ""
                        ? eq.imageUrl
                        : "https://via.placeholder.com/100x80?text=No+Image";

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>
                        <img
                            src="${imagePath}"
                            style="width:80px;height:60px;object-fit:cover;"
                            alt="${escapeHtml(eq.name)}"
                        >
                    </td>

                    <td>
                        <b>${escapeHtml(eq.name)}</b>
                    </td>

                    <td>
                        ${escapeHtml(eq.description || "")}
                    </td>

                    <td>
                        ₹${Number(eq.pricePerDay || 0).toFixed(2)}
                    </td>

                    <td>${eq.quantity}</td>

                    <td>
                        ${eq.vendor ? escapeHtml(eq.vendor.name) : "N/A"}

                        ${
                            isOwner
                                ? `<br><span style="color:green">(Your Product)</span>`
                                : ""
                        }
                    </td>

                    <td>
                        ${
                            isOwner
                                ? `<button disabled>Your Item</button>`
                                : `
                                    <button
                                        onclick="bookEquipment(
                                            ${eq.id},
                                            ${eq.vendor ? eq.vendor.id : 0}
                                        )"
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
            console.error("Error loading equipment:", err);

            if (noDataMsg) {
                noDataMsg.innerText =
                    "Error loading data. Please check if the server is running.";
                noDataMsg.style.display = "block";
            }
        });
}

// ==========================================
// BOOK EQUIPMENT
// ==========================================

function bookEquipment(equipmentId, vendorId) {
    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userRaw);

    if (user.role === "VENDOR") {
        alert("Login as Farmer (User) to book equipment");
        return;
    }

    if (user.id === vendorId) {
        alert("You cannot rent your own equipment");
        return;
    }

    window.location.href = `booking.html?equipmentId=${equipmentId}`;
}

// ==========================================
// LOAD USER BOOKINGS
// ==========================================

async function loadMyBookings() {
    const grid = document.getElementById("bookingsGrid");

    if (!grid) return;

    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userRaw);
    grid.innerHTML = "";

    try {
        const response = await fetch(
            `http://localhost:8080/api/bookings/user/${user.id}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch bookings");
        }

        const bookings = await response.json();

        if (!Array.isArray(bookings) || bookings.length === 0) {
            grid.innerHTML = `
                <p class="no-bookings">
                    No booking requests found.
                </p>
            `;
            return;
        }

        // ==========================================
        // FETCH DELIVERY DETAILS FOR EACH BOOKING
        // ==========================================

        const deliveryStatusByBookingId = {};

        await Promise.all(
            bookings.map(async booking => {
                try {
                    const deliveryResponse = await fetch(
                        `http://localhost:8080/api/deliveries/booking/${booking.id}/all`
                    );

                    if (!deliveryResponse.ok) return;

                    const deliveries = await deliveryResponse.json();

                    if (!Array.isArray(deliveries)) return;

                    const outboundDelivery = deliveries.find(delivery =>
                        (delivery?.deliveryType || "").toUpperCase() === "OUTBOUND"
                    );

                    if (outboundDelivery) {
                        deliveryStatusByBookingId[booking.id] = {
                            status: (
                                outboundDelivery.status || ""
                            ).toUpperCase(),

                            failureReason:
                                outboundDelivery.failureReason || ""
                        };
                    }
                } catch (error) {
                    console.warn(
                        "Could not load delivery details:",
                        booking.id,
                        error
                    );
                }
            })
        );

        // ==========================================
        // CREATE BOOKING CARDS
        // ==========================================

        bookings.forEach(b => {
            const card = document.createElement("div");

            if (b.status === "PENDING") {
                card.className = "booking-card card-pending";
            } else if (
                b.status === "APPROVED" ||
                b.status === "PAID"
            ) {
                card.className = "booking-card card-approved";
            } else if (b.status === "ACTIVE") {
                card.className = "booking-card card-active";
            } else if (b.status === "OVERDUE") {
                card.className = "booking-card card-overdue";
            } else if (b.status === "RETURNED") {
                card.className = "booking-card card-returned";
            } else {
                card.className = "booking-card";
            }

            let actionHtml = "";

            // Read delivery status and failure reason.
            const deliveryInfo =
                deliveryStatusByBookingId[b.id] || {};

            const deliveryStatus =
                typeof deliveryInfo === "string"
                    ? deliveryInfo.toUpperCase()
                    : (deliveryInfo.status || "").toUpperCase();

            const failureReason =
                typeof deliveryInfo === "object"
                    ? (deliveryInfo.failureReason || "")
                    : "";

            const isDeliveryComplete =
                deliveryStatus === "DELIVERED";

            const isDeliveryFailed =
                deliveryStatus === "DELIVERY_FAILED";

            // ==========================================
            // PENDING
            // ==========================================

            if (b.status === "PENDING") {
                actionHtml = `
                    <div class="wait-msg">
                        Pending Vendor Approval
                    </div>
                `;
            }

            // ==========================================
            // APPROVED
            // ==========================================

            else if (b.status === "APPROVED") {
                actionHtml = `
                    <span class="status-label label-approved">
                        Approved
                    </span>

                    <button
                        class="btn-pay"
                        onclick="payNow(${b.id})"
                    >
                        Pay ₹${Number(b.totalAmount || 0).toFixed(2)}
                    </button>
                `;
            }

            // ==========================================
            // PAID
            // ==========================================

            else if (b.status === "PAID") {
                if (isDeliveryFailed) {
                    actionHtml = `
                        <div class="delivery-failed-notice">
                            <h4>⚠️ Delivery Failed</h4>

                            <p>
                                <strong>Reason:</strong>
                                ${escapeHtml(
                                    failureReason ||
                                    "Unable to deliver equipment"
                                )}
                            </p>

                            <button
                                type="button"
                                class="refund-btn"
                                onclick="requestBookingRefund(${b.id})"
                            >
                                Request Refund
                            </button>
                        </div>
                    `;
                } else if (isDeliveryComplete) {
                    actionHtml = `
                        <span class="status-success">
                            ✅ Delivery Complete
                        </span>
                    `;
                } else {
                    actionHtml = `
                        <span class="status-label label-approved">
                            Paid ✅
                        </span>

                        <button
                            class="btn-track"
                            onclick="trackDelivery(${b.id})"
                        >
                            🚚 Track Delivery
                        </button>
                    `;
                }
            }

            // ==========================================
            // REFUND REQUESTED
            // ==========================================

            else if (b.status === "REFUND_REQUESTED") {
                actionHtml = `
                    <div class="delivery-failed-notice">
                        <h4>⚠️ Delivery Failed</h4>

                        <p>
                            <strong>Reason:</strong>
                            ${escapeHtml(
                                failureReason ||
                                "Unable to deliver equipment"
                            )}
                        </p>

                        <span class="status-label label-pending">
                            Refund Request Submitted
                        </span>
                    </div>
                `;
            }

            // ==========================================
            // REFUNDED
            // ==========================================

            else if (b.status === "REFUNDED") {
                actionHtml = `
                    <div class="delivery-failed-notice">
                        <h4>Refund Completed</h4>

                        <p>
                            Your refund has been processed successfully.
                        </p>
                    </div>
                `;
            }

            // ==========================================
            // ACTIVE
            // ==========================================

            else if (b.status === "ACTIVE") {
                actionHtml = `
                    <span class="status-label label-active">
                        🟢 Rental Active
                    </span>

                    ${
                        isDeliveryComplete
                            ? `
                                <button class="btn-track" disabled>
                                    ✅ Delivery Complete
                                </button>
                            `
                            : `
                                <button
                                    class="btn-track"
                                    onclick="trackDelivery(${b.id})"
                                >
                                    🚚 Track Delivery
                                </button>
                            `
                    }

                    ${
                        b.returnRequested
                            ? `
                                <div class="wait-msg">
                                    📦 Return Pickup Requested
                                </div>
                            `
                            : `
                                <button
                                    class="btn-return"
                                    onclick="requestReturn(${b.id})"
                                >
                                    📦 Request Equipment Pickup
                                </button>
                            `
                    }
                `;
            }

            // ==========================================
            // OVERDUE
            // ==========================================

            else if (b.status === "OVERDUE") {
                const rentalAmount = Number(b.totalAmount) || 0;
                const overdueCharges = Number(b.extraCharges) || 0;
                const totalDue = rentalAmount + overdueCharges;

                actionHtml = `
                    <div class="overdue-warning">
                        <span class="status-label label-overdue">
                            ⚠️ Rental Overdue
                        </span>

                        <p class="overdue-message">
                            Your rental period has ended.
                            Please return the equipment as soon as possible.
                        </p>
                    </div>

                    <div class="overdue-amount-box">
                        <div class="amount-row">
                            <span>Rental Amount</span>
                            <strong>₹${rentalAmount.toFixed(2)}</strong>
                        </div>

                        <div class="amount-row">
                            <span>Overdue Charges</span>
                            <strong class="overdue-charge">
                                ₹${overdueCharges.toFixed(2)}
                            </strong>
                        </div>

                        <div class="amount-row total-due-row">
                            <span>Total Due</span>
                            <strong>₹${totalDue.toFixed(2)}</strong>
                        </div>
                    </div>

                    ${
                        isDeliveryComplete
                            ? `
                                <button class="btn-track" disabled>
                                    ✅ Delivery Complete
                                </button>
                            `
                            : `
                                <button
                                    class="btn-track"
                                    onclick="trackDelivery(${b.id})"
                                >
                                    🚚 Track Delivery
                                </button>
                            `
                    }

                    ${
                        b.returnRequested
                            ? `
                                <div class="wait-msg">
                                    📦 Return Pickup Requested
                                </div>
                            `
                            : `
                                <button
                                    class="btn-return"
                                    onclick="requestReturn(${b.id})"
                                >
                                    📦 Request Equipment Pickup
                                </button>
                            `
                    }
                `;
            }

            // ==========================================
            // RETURNED
            // ==========================================

            else if (b.status === "RETURNED") {
                actionHtml = `
                    <span class="status-label label-approved">
                        ✅ Equipment Returned
                    </span>
                `;
            }

            // ==========================================
            // BOOKING CARD CONTENT
            // ==========================================

            card.innerHTML = `
                <div class="booking-card-content">
                    <h3>
                        ${escapeHtml(
                            b.equipment?.name ||
                            b.equipmentName ||
                            "Equipment"
                        )}
                    </h3>

                    <p>
                        <b>Booking ID:</b> ${b.id}
                    </p>

                    <p>
                        <b>Booking Type:</b>
                        ${escapeHtml(b.bookingType || "-")}
                    </p>

                    <p>
                        <b>Start:</b>
                        ${formatBookingDateTime(b.startDateTime)}
                    </p>

                    <p>
                        <b>End:</b>
                        ${formatBookingDateTime(b.endDateTime)}
                    </p>

                    <p>
                        <b>Booking Status:</b>
                        ${escapeHtml(b.status || "-")}
                    </p>

                    <p>
                        <b>Rental Amount:</b>
                        ₹${Number(b.totalAmount || 0).toFixed(2)}
                    </p>

                    ${
                        b.status === "OVERDUE"
                            ? `
                                <p>
                                    <b>Overdue Charges:</b>
                                    <span class="overdue-charge">
                                        ₹${Number(b.extraCharges || 0).toFixed(2)}
                                    </span>
                                </p>

                                <p>
                                    <b>Total Due:</b>
                                    <strong class="total-due">
                                        ₹${
                                            (
                                                Number(b.totalAmount || 0) +
                                                Number(b.extraCharges || 0)
                                            ).toFixed(2)
                                        }
                                    </strong>
                                </p>
                            `
                            : ""
                    }

                    <div class="action-area">
                        ${actionHtml}
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Booking load error:", err);

        grid.innerHTML = `
            <p class="no-bookings">
                Error loading bookings. Please try again.
            </p>
        `;
    }
}
// ==========================================
// FORMAT BOOKING DATE & TIME
// ==========================================

function formatBookingDateTime(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

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

// ==========================================
// REQUEST EQUIPMENT RETURN
// ==========================================

async function requestReturn(bookingId) {
    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userRaw);

    const confirmed = confirm(
        "Do you want to request pickup of the rented equipment?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:8080/api/deliveries/return/${bookingId}?farmerUserId=${user.id}`,
            {
                method: "POST"
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            let errorMessage = "Failed to request equipment return.";

            try {
                const errorData = JSON.parse(responseText);

                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                if (responseText) {
                    errorMessage = responseText;
                }
            }

            throw new Error(errorMessage);
        }

        const returnDelivery = JSON.parse(responseText);

        console.log("Return pickup requested:", returnDelivery);

        alert(
            "📦 Return pickup requested successfully!\n\n" +
            "The vendor will assign a delivery partner to collect the equipment."
        );

        await loadMyBookings();

    } catch (error) {
        console.error("Return request error:", error);

        alert(
            "Unable to request return.\n\n" +
            error.message
        );
    }
}

// ==========================================
// RAZORPAY PAYMENT
// ==========================================

async function payNow(bookingId) {
    if (typeof Razorpay === "undefined") {
        alert(
            "Razorpay SDK is still loading or failed to load. Please refresh the page."
        );
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:8080/api/bookings/pay/create/${bookingId}/`,
            {
                method: "POST"
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(
                responseText || "Failed to create payment order."
            );
        }

        const orderData = JSON.parse(responseText);

        const userRaw = sessionStorage.getItem("loggedInUser");
        const user = userRaw ? JSON.parse(userRaw) : null;

        const options = {
            key: orderData.razorpay_key,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            name: "AgriRent Hub",
            description: "Agricultural Equipment Rental Payment",
            order_id: orderData.order_id,

            prefill: {
                name: user?.name || "Farmer",
                contact: user?.mobile || "9999999999"
            },

            theme: {
                color: "#2e7d32"
            },

            handler: async function (paymentResponse) {
                await verifyPayment(bookingId, paymentResponse);
            }
        };

        const razorpay = new Razorpay(options);

        razorpay.on("payment.failed", function (response) {
            console.error("Payment failed:", response);

            const description =
                response?.error?.description || "Payment failed.";

            alert("Payment Failed.\n\n" + description);
        });

        razorpay.open();

    } catch (error) {
        console.error("Payment order creation error:", error);

        alert(
            "Unable to start payment.\n\n" +
            error.message
        );
    }
}

// ==========================================
// VERIFY PAYMENT
// ==========================================

async function verifyPayment(bookingId, paymentResponse) {
    try {
        const response = await fetch(
            `http://localhost:8080/api/bookings/pay/verify/${bookingId}/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    razorpay_payment_id:
                        paymentResponse.razorpay_payment_id,

                    razorpay_order_id:
                        paymentResponse.razorpay_order_id,

                    razorpay_signature:
                        paymentResponse.razorpay_signature
                })
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(
                responseText || "Payment verification failed."
            );
        }

        alert(
            "Payment Successful! 🎉\n\n" +
            "Your payment has been verified.\n" +
            "Your booking is now PAID."
        );

        await loadMyBookings();

    } catch (error) {
        console.error("Payment verification error:", error);

        alert(
            "Payment was completed, but verification failed.\n\n" +
            error.message
        );
    }
}

// ==========================================
// TRACK DELIVERY
// ==========================================

function trackDelivery(bookingId) {
    console.log(
        "Opening delivery tracking for booking:",
        bookingId
    );

    window.location.href =
        `delivery-tracking.html?bookingId=${bookingId}`;
}

// ==========================================
// BASIC HTML ESCAPING
// ==========================================

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

// ==========================================
// REQUEST BOOKING REFUND
// ==========================================

async function requestBookingRefund(bookingId) {
    const userRaw = sessionStorage.getItem("loggedInUser");

    if (!userRaw) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(userRaw);
    } catch (error) {
        alert("Session data is invalid. Please login again.");
        return;
    }

    if (!confirm(
        "Do you want to request a refund for this failed delivery?"
    )) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:8080/api/bookings/${bookingId}/refund?userId=${encodeURIComponent(user.id)}`,
            {
                method: "POST"
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            let message =
                responseText || "Failed to submit refund request.";

            try {
                const errorData = JSON.parse(responseText);

                message =
                    errorData.message ||
                    errorData.error ||
                    message;
            } catch (error) {
                // Response was not JSON; use the original message.
            }

            throw new Error(message);
        }

        alert("Refund request submitted successfully!");

        await loadMyBookings();

    } catch (error) {
        console.error("Refund request error:", error);

        alert(
            "Unable to request refund.\n\n" +
            error.message
        );
    }
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}