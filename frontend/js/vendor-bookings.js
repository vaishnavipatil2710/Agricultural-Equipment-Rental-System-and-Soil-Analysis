/**
 * VENDOR BOOKING MANAGEMENT LOGIC
 */

document.addEventListener("DOMContentLoaded", () => {

    // 1. Retrieve the logged-in user from sessionStorage
    const userRaw = sessionStorage.getItem("loggedInUser");
    const user = userRaw ? JSON.parse(userRaw) : null;

    // 2. Security: Ensure only vendors can access this page
    if (!user || user.role !== "VENDOR") {
        alert("Unauthorized access. Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    // 3. Load booking requests for the logged-in vendor
    loadVendorBookings(user.id);
});


/**
 * =========================================================
 * LOAD VENDOR BOOKINGS
 * =========================================================
 *
 * Fetches all booking requests for the logged-in vendor's
 * equipment.
 */
function loadVendorBookings(vendorId) {

    const tbody =
        document.getElementById("vendorBookingBody");

    if (!tbody) return;

    // Show loading state
    tbody.innerHTML =
        "<tr><td colspan='8' style='text-align:center;'>Loading booking requests...</td></tr>";


    fetch(
        `http://localhost:8080/api/bookings/vendor/${vendorId}`
    )
        .then(res => {

            if (!res.ok) {
                throw new Error(
                    "Failed to fetch bookings"
                );
            }

            return res.json();
        })
        .then(bookings => {

            tbody.innerHTML = "";


            // =================================================
            // NO BOOKINGS
            // =================================================

            if (!bookings || bookings.length === 0) {

                tbody.innerHTML =
                    "<tr><td colspan='8' style='text-align:center;'>No booking requests found.</td></tr>";

                return;
            }


            // =================================================
            // DISPLAY BOOKINGS
            // =================================================

            bookings.forEach(b => {

                // =================================================
                // STATUS LOGIC
                // =================================================

                const isPending =
                    b.status === "PENDING";

                const isReturnRequested =
                    b.status === "RETURN_REQUESTED";

                const isReturned =
                    b.status === "RETURNED";


                let statusClass =
                    "status-approved";

                if (isPending) {

                    statusClass =
                        "status-pending";

                } else if (isReturnRequested) {

                    statusClass =
                        "status-pending";
                }


                // =================================================
                // SAFE DATA EXTRACTION
                // =================================================

                const bookingId =
                    b.id || "N/A";

                const customerName =
                    b.user?.name ||
                    "Unknown User";

                const equipmentName =
                    b.equipment?.name ||
                    "Unknown Equipment";


                // =================================================
                // IMAGE
                // =================================================

                const imagePath =
                    b.equipment?.imageUrl &&
                    b.equipment.imageUrl.trim() !== ""

                        ? b.equipment.imageUrl

                        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=200&auto=format&fit=crop";


                // =================================================
                // AMOUNT
                // =================================================

                const amount =
                    typeof b.totalAmount === "number"

                        ? b.totalAmount.toFixed(2)

                        : "0.00";


                // =================================================
                // DURATION
                // =================================================

                let durationText = "N/A";

                if (
                    b.startDateTime &&
                    b.endDateTime
                ) {

                    const start =
                        new Date(b.startDateTime);

                    const end =
                        new Date(b.endDateTime);

                    const diffMs =
                        end - start;

                    const diffHours =
                        diffMs /
                        (1000 * 60 * 60);


                    if (diffHours >= 24) {

                        durationText =
                            `${Math.ceil(
                                diffHours / 24
                            )} Day(s)`;

                    } else if (diffHours > 0) {

                        durationText =
                            `${Math.ceil(
                                diffHours
                            )} Hour(s)`;
                    }
                }


                // =================================================
                // ACTION BUTTON
                // =================================================

                let actionButton = "";


                // -------------------------------------------------
                // PENDING
                // -------------------------------------------------

                if (isPending) {

                    actionButton = `
                        <button
                            class="btn-confirm"
                            onclick="approveBooking(${b.id})">

                            Confirm & Approve

                        </button>
                    `;
                }


                // -------------------------------------------------
                // RETURN REQUESTED
                // -------------------------------------------------

                else if (isReturnRequested) {

                    actionButton = `
                        <button
                            class="btn-confirm"
                            onclick="completeReturn(${b.id})"
                            style="
                                background-color: #16a34a;
                                color: white;
                                border: none;
                                cursor: pointer;
                            ">

                            Complete Return

                        </button>
                    `;
                }


                // -------------------------------------------------
                // RETURNED
                // -------------------------------------------------

                else if (isReturned) {

                    actionButton = `
                        <button
                            class="btn-confirm"
                            disabled
                            style="
                                background-color: #999;
                                color: white;
                                cursor: not-allowed;
                            ">

                            Return Completed

                        </button>
                    `;
                }


                // -------------------------------------------------
                // OTHER STATUS
                // -------------------------------------------------

                else {

                    actionButton = `
                        <button
                            class="btn-confirm"
                            onclick="approveBooking(${b.id})"
                            ${!isPending
                                ? "disabled"
                                : ""
                            }
                            style="
                                ${!isPending
                                    ? "background-color:#999; cursor:not-allowed;"
                                    : ""
                                }
                            ">

                            ${
                                isPending
                                    ? "Confirm & Approve"
                                    : "Confirmed"
                            }

                        </button>
                    `;
                }


                // =================================================
                // CREATE TABLE ROW
                // =================================================

                const row =
                    document.createElement("tr");

                row.innerHTML = `

                    <td>
                        #${bookingId}
                    </td>


                    <td>

                        <img
                            src="${imagePath}"
                            onerror="this.src='https://via.placeholder.com/80x50?text=No+Img'"
                            alt="${equipmentName}"
                            style="
                                width: 60px;
                                height: 40px;
                                border-radius: 4px;
                                object-fit: cover;
                                border: 1px solid #ddd;
                            "
                        >

                    </td>


                    <td>
                        <b>
                            ${customerName}
                        </b>
                    </td>


                    <td>
                        ${equipmentName}
                    </td>


                    <td>
                        ${durationText}
                    </td>


                    <td>
                        ₹${amount}
                    </td>


                    <td>

                        <span
                            class="status-badge ${statusClass}">

                            ${b.status}

                        </span>

                    </td>


                    <td>

                        ${actionButton}

                    </td>

                `;

                tbody.appendChild(row);
            });
        })
        .catch(err => {

            console.error(
                "Error loading bookings:",
                err
            );

            tbody.innerHTML =
                "<tr><td colspan='8' style='text-align:center; color:red;'>Error loading details. Ensure Backend is running.</td></tr>";
        });
}


/**
 * =========================================================
 * APPROVE BOOKING
 * =========================================================
 *
 * Triggers the backend to change status to APPROVED.
 */
function approveBooking(bookingId) {

    if (
        !confirm(
            "Are you sure you want to approve this booking and confirm equipment availability?"
        )
    ) {
        return;
    }


    fetch(
        `http://localhost:8080/api/bookings/confirm/${bookingId}`,
        {
            method: "PUT"
        }
    )
        .then(res => {

            if (res.ok) {

                alert(
                    "✅ Booking Approved! The customer will be notified."
                );

                location.reload();

            } else {

                alert(
                    "Error: " +
                    res.status +
                    ". Could not approve booking."
                );
            }
        })
        .catch(err => {

            console.error(
                "Error:",
                err
            );

            alert(
                "Server error. Please try again later."
            );
        });
}


/**
 * =========================================================
 * COMPLETE RETURN
 * =========================================================
 *
 * Vendor confirms that the equipment has been received.
 *
 * Backend:
 *
 * PUT
 * /api/bookings/{bookingId}/return-complete
 *
 * ?vendorUserId={vendorId}
 */
function completeReturn(bookingId) {

    // =======================================================
    // GET LOGGED-IN VENDOR
    // =======================================================

    const userRaw =
        sessionStorage.getItem("loggedInUser");

    const user =
        userRaw
            ? JSON.parse(userRaw)
            : null;


    // =======================================================
    // CHECK LOGIN
    // =======================================================

    if (!user || !user.id) {

        alert(
            "Vendor session not found. Please login again."
        );

        window.location.href =
            "login.html";

        return;
    }


    // =======================================================
    // CONFIRM RETURN
    // =======================================================

    const confirmed =
        confirm(
            "Have you received the equipment from the farmer?\n\nClick OK to complete the return."
        );


    if (!confirmed) {
        return;
    }


    // =======================================================
    // CALL BACKEND
    // =======================================================

    fetch(
        `http://localhost:8080/api/bookings/${bookingId}/return-complete?vendorUserId=${user.id}`,
        {
            method: "PUT"
        }
    )
        .then(res => {

            if (res.ok) {

                alert(
                    "✅ Return completed successfully! Equipment is now available."
                );

                location.reload();

            } else {

                return res.text()
                    .then(message => {

                        throw new Error(
                            message ||
                            "Failed to complete return."
                        );
                    });
            }
        })
        .catch(err => {

            console.error(
                "Complete return error:",
                err
            );

            alert(
                err.message ||
                "Server error. Please try again."
            );
        });
}


/**
 * =========================================================
 * LOGOUT
 * =========================================================
 */
function logout() {

    sessionStorage.clear();

    window.location.href =
        "login.html";
}