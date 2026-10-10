const API = "http://localhost:8080/api";

const refundList = document.getElementById("refundList");
const message = document.getElementById("message");
const pendingCount = document.getElementById("pendingCount");
const totalAmount = document.getElementById("totalAmount");
const refreshBtn = document.getElementById("refreshBtn");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getLoggedInUser() {
    try {
        return JSON.parse(
            sessionStorage.getItem("loggedInUser") || "null"
        );
    } catch {
        return null;
    }
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

async function getDeliveryInfo(bookingId) {
    const response = await fetch(
        `${API}/deliveries/booking/${bookingId}/all`
    );

    if (!response.ok) {
        throw new Error(
            `Could not load delivery details for booking ${bookingId}`
        );
    }

    const deliveries = await response.json();

    const outbound = deliveries.find(delivery =>
        String(delivery.deliveryType || "").toUpperCase() === "OUTBOUND"
    );

    return { outbound };
}

async function loadRefundRequests() {
    const user = getLoggedInUser();

    if (!user || !user.id) {
        message.textContent = "Please login as a vendor first.";
        refundList.innerHTML = "";
        return;
    }

    if (String(user.role || "").toUpperCase() !== "VENDOR") {
        message.textContent = "This page is only available to vendors.";
        refundList.innerHTML = "";
        return;
    }

    message.textContent = "Loading refund requests...";
    refundList.innerHTML = "";

    try {
        const response = await fetch(
            `${API}/bookings/vendor/${encodeURIComponent(user.id)}`
        );

        if (!response.ok) {
            throw new Error("Could not load vendor bookings.");
        }

        const bookings = await response.json();

        const requests = bookings.filter(booking =>
            String(booking.status || "").toUpperCase() ===
            "REFUND_REQUESTED"
        );

        const results = await Promise.all(
            requests.map(async booking => {
                try {
                    const { outbound } =
                        await getDeliveryInfo(booking.id);

                    return { booking, outbound, error: null };
                } catch (error) {
                    return { booking, outbound: null, error };
                }
            })
        );

        pendingCount.textContent = requests.length;

        const requestedTotal = requests.reduce(
            (sum, booking) =>
                sum + (Number(booking.totalAmount) || 0),
            0
        );

        totalAmount.textContent = money(requestedTotal);

        if (results.length === 0) {
            message.textContent = "No pending refund requests.";
            refundList.innerHTML = `
                <div class="empty-state">
                    <h3>All caught up!</h3>
                    <p>There are no refund requests to review.</p>
                </div>
            `;
            return;
        }

        message.textContent =
            `${results.length} refund request(s) found.`;

        refundList.innerHTML = results.map(
            ({ booking, outbound, error }) => {
                const partner = outbound?.deliveryPartner;
                const partnerUser = partner?.user;

                const partnerName =
                    partnerUser?.name || "Partner details unavailable";

                const phone = String(
                    partnerUser?.mobile || ""
                ).trim();

                const validPhone = /^[+\d][\d\s()-]{5,19}$/.test(phone);

                const equipmentName =
                    booking.equipment?.name ||
                    booking.equipment?.equipmentName ||
                    "Equipment";

                const farmerName =
                    booking.user?.name || "Farmer";

                const failureReason =
                    outbound?.failureReason ||
                    "No failure reason recorded.";

                const deliveryFailed =
                    String(outbound?.status || "").toUpperCase() ===
                    "DELIVERY_FAILED";

                const canApprove =
                    !error && deliveryFailed;

                return `
                    <article class="refund-card"
                             data-booking-id="${escapeHTML(booking.id)}">

                        <div class="page-heading">
                            <div>
                                <h2>Booking #${escapeHTML(booking.id)}</h2>
                                <p>${escapeHTML(equipmentName)}</p>
                            </div>
                            <span class="status">REFUND REQUESTED</span>
                        </div>

                        <div class="details">
                            <div class="detail">
                                <span>Farmer</span>
                                <strong>${escapeHTML(farmerName)}</strong>
                            </div>

                            <div class="detail">
                                <span>Requested Refund Amount</span>
                                <strong>${money(booking.totalAmount)}</strong>
                            </div>

                            <div class="detail">
                                <span>Delivery Status</span>
                                <strong>
                                    ${escapeHTML(outbound?.status || "Unavailable")}
                                </strong>
                            </div>

                            <div class="detail">
                                <span>Delivery Partner</span>
                                <strong>${escapeHTML(partnerName)}</strong>
                            </div>

                            <div class="detail">
                                <span>Vehicle Type</span>
                                <strong>${escapeHTML(partner?.vehicleType || "Unavailable")}</strong>
                            </div>

                            <div class="detail">
                                <span>Vehicle Number</span>
                                <strong>${escapeHTML(partner?.vehicleNumber || "Unavailable")}</strong>
                            </div>
                        </div>

                        <div class="failure-reason">
                            <strong>Delivery Failure Reason</strong>
                            ${escapeHTML(failureReason)}
                        </div>

                        ${error ? `
                            <p class="error-message">
                                Could not load delivery details.
                                Please refresh and try again.
                            </p>
                        ` : ""}

                        <div class="partner-section">
                            <h3>Contact Delivery Partner</h3>
                            <p>${escapeHTML(phone || "Mobile number unavailable")}</p>

                            <div class="partner-actions">
                                ${
                                    validPhone
                                        ? `<a class="call-btn"
                                              href="tel:${escapeHTML(phone)}">
                                              ☎ Call Partner
                                           </a>`
                                        : `<button class="call-btn" disabled>
                                              Mobile Unavailable
                                           </button>`
                                }
                            </div>
                        </div>

                        <div class="refund-actions">
                            <button class="approve-btn"
                                data-action="approve"
                                data-booking-id="${escapeHTML(booking.id)}"
                                ${canApprove ? "" : "disabled"}>
                                Approve Refund
                            </button>
                        </div>

                        ${
                            !deliveryFailed && !error
                                ? `<p class="error-message">
                                     Approval disabled: outbound delivery
                                     is not marked DELIVERY_FAILED.
                                   </p>`
                                : ""
                        }
                    </article>
                `;
            }
        ).join("");

    } catch (error) {
        console.error("Refund requests error:", error);
        message.textContent =
            error.message || "Failed to load refund requests.";
    }
}

refundList.addEventListener("click", async event => {
    const button = event.target.closest(
        'button[data-action="approve"]'
    );

    if (!button || button.disabled) return;

    const user = getLoggedInUser();
    const bookingId = button.dataset.bookingId;

    if (!user?.id) {
        alert("Please login again.");
        return;
    }

    const confirmed = confirm(
        `Approve the refund for booking #${bookingId}?\n\n` +
        "This will call the existing backend refund approval API."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Processing...";

    try {
        const response = await fetch(
            `${API}/bookings/${encodeURIComponent(bookingId)}` +
            `/refund/approve?vendorUserId=${encodeURIComponent(user.id)}`,
            { method: "PUT" }
        );

        const body = await response.text();

        if (!response.ok) {
            throw new Error(
                body || `Refund approval failed (${response.status})`
            );
        }

        alert(
            "Refund approval request completed. " +
            "Verify the Razorpay refund status before confirming it to the farmer."
        );

        await loadRefundRequests();

    } catch (error) {
        console.error("Approve refund error:", error);
        alert(error.message || "Unable to approve refund.");
        button.disabled = false;
        button.textContent = "Approve Refund";
    }
});

refreshBtn.addEventListener("click", loadRefundRequests);

loadRefundRequests();