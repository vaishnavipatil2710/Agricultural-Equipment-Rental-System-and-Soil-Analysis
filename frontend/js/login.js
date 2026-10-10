// /**
//  * ✅ 1. Input Helpers
//  * Restricts typing to digits only and enforces max length
//  */
// function allowOnlyDigits(event, maxLength, input) {
//     const key = event.key;
//     const controlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    
//     if (controlKeys.includes(key)) return true;
    
//     // Block non-numbers
//     if (!/^\d$/.test(key)) return false;

//     // Block extra digits
//     if (input.value.length >= maxLength) return false;

//     return true;
// }

// function sanitizeInput(input, maxLength) {
//     input.value = input.value.replace(/\D/g, "").slice(0, maxLength);
// }

// /**
//  * ✅ 2. Main Login Logic
//  * Handles Role-Based Authentication, Soil Report Linking, and Redirects
//  */
// function loginUser() {
//     const mobile = document.getElementById("mobile").value.trim();
//     const aadhaar = document.getElementById("aadhaar").value.trim();
//     const role = document.getElementById("role").value; 
//     const msg = document.getElementById("msg");

//     if (!msg) return;

//     msg.style.color = "red";
//     msg.innerText = "";

//     if (!role) {
//         msg.innerText = "Please select your login role (User or Vendor).";
//         return;
//     }

//     if (mobile.length !== 10) {
//         msg.innerText = "Mobile number must be exactly 10 digits.";
//         return;
//     }

//     if (aadhaar.length !== 12) {
//         msg.innerText = "Aadhaar number must be exactly 12 digits.";
//         return;
//     }

//     const loginData = { mobile, aadhaar, role };

//     fetch("http://localhost:8080/api/users/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(loginData) 
//     })
//     .then(async response => {
//         const data = await response.json().catch(() => null);

//         if (response.ok) {
//             msg.style.color = "green";
//             msg.innerText = "Login successful! Redirecting...";

//             // Store user in sessionStorage
//             sessionStorage.setItem("loggedInUser", JSON.stringify(data));

//             // ✅ NEW: Check for Soil Report or Booking intent
//             const pendingReportId = sessionStorage.getItem("pendingReportId");
//             const pendingBookingId = sessionStorage.getItem("pendingBookingId");

//             setTimeout(async () => {
//                 // Priority 1: If user came from Soil Analysis, link the report to their mobile
//                 if (pendingReportId) {
//                     try {
//                         // Optional: Call backend to officially link report to this mobile number
//                         await fetch(`http://localhost:8080/api/soil/link-report?reportId=${pendingReportId}&mobile=${data.mobile}`, {
//                             method: "POST"
//                         });
//                     } catch (e) {
//                         console.error("Link error:", e);
//                     }
                    
//                     sessionStorage.removeItem("pendingReportId");
//                     window.location.href = `report-view.html?id=${pendingReportId}`;
//                 } 
//                 // Priority 2: Existing Booking Redirect
//                 else if (data.role === "USER" && pendingBookingId) {
//                     sessionStorage.removeItem("pendingBookingId");
//                     window.location.href = `booking.html?equipmentId=${pendingBookingId}`;
//                 } 
//                 // Priority 3: Standard Dashboard Redirect
//                 else if (data.role === "VENDOR") {
//                     window.location.href = "vendor-dashboard.html";
//                 } 
//                 // Priority 3: Standard Dashboard Redirect
//                 else if (data.role === "delivery_partners") {
//                     window.location.href = "vendor-dashboard.html";
//                 } 
//                 else {
//                     window.location.href = "user-dashboard.html";
//                 }
//             }, 1200);
//         } else {
//             const errorMsg = (data && data.message) ? data.message : "Invalid credentials for the selected role.";
//             throw new Error(errorMsg);
//         }
//     })
//     .catch(err => {
//         console.error("Login Error:", err);
//         msg.style.color = "red";
//         msg.innerText = err.message;
//     });
// }
/**
 * ============================================================
 * AGRIRENT HUB - LOGIN
 * ============================================================
 *
 * Supported roles:
 * USER
 * VENDOR
 * DELIVERY_PARTNER
 *
 * Login credentials:
 * Mobile + Aadhaar + Role
 * ============================================================
 */


/**
 * ============================================================
 * 1. INPUT HELPERS
 * ============================================================
 */

/**
 * Allows only digits.
 */
function allowOnlyDigits(event, maxLength, input) {

    const key = event.key;

    const controlKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab"
    ];

    // Allow control keys
    if (controlKeys.includes(key)) {
        return true;
    }

    // Block non-numeric characters
    if (!/^\d$/.test(key)) {
        event.preventDefault();
        return false;
    }

    // Block extra digits
    if (input.value.length >= maxLength) {
        event.preventDefault();
        return false;
    }

    return true;
}


/**
 * Removes non-digit characters
 * and limits input length.
 */
function sanitizeInput(input, maxLength) {

    input.value =
        input.value
            .replace(/\D/g, "")
            .slice(0, maxLength);
}


/**
 * ============================================================
 * 2. MAIN LOGIN
 * ============================================================
 */

function loginUser() {

    const mobileElement =
        document.getElementById("mobile");

    const aadhaarElement =
        document.getElementById("aadhaar");

    const roleElement =
        document.getElementById("role");

    const msg =
        document.getElementById("msg");


    if (
        !mobileElement ||
        !aadhaarElement ||
        !roleElement ||
        !msg
    ) {

        console.error(
            "Login form elements are missing."
        );

        return;
    }


    const mobile =
        mobileElement.value.trim();

    const aadhaar =
        aadhaarElement.value.trim();

    const role =
        roleElement.value;


    // Clear previous message

    msg.innerText = "";

    msg.style.color = "red";


    /**
     * ========================================================
     * ROLE VALIDATION
     * ========================================================
     */

    if (!role) {

        msg.innerText =
            "Please select your login role.";

        return;
    }


    /**
     * ========================================================
     * MOBILE VALIDATION
     * ========================================================
     */

    if (!/^\d{10}$/.test(mobile)) {

        msg.innerText =
            "Mobile number must be exactly 10 digits.";

        return;
    }


    /**
     * ========================================================
     * AADHAAR VALIDATION
     * ========================================================
     */

    if (!/^\d{12}$/.test(aadhaar)) {

        msg.innerText =
            "Aadhaar number must be exactly 12 digits.";

        return;
    }


    /**
     * ========================================================
     * LOGIN REQUEST
     * ========================================================
     */

    const loginData = {

        mobile: mobile,

        aadhaar: aadhaar,

        role: role

    };


    console.log(
        "Login request:",
        {
            mobile: mobile,
            role: role
        }
    );


    fetch(
        "http://localhost:8080/api/users/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)
        }
    )

    .then(async response => {

        const data =
            await response.json()
                .catch(() => null);


        console.log(
            "Login response:",
            data
        );


        if (!response.ok) {

            /*
             * Your current backend throws:
             *
             * RuntimeException(
             * "Invalid credentials for the selected role"
             * )
             *
             * Therefore Spring may return the error
             * differently depending on configuration.
             */

            const errorMessage =
                data?.message ||
                data?.error ||
                "Invalid credentials for the selected role.";

            throw new Error(
                errorMessage
            );
        }


        return data;

    })

    .then(data => {

        /**
         * ====================================================
         * LOGIN SUCCESS
         * ====================================================
         */

        msg.style.color = "green";

        msg.innerText =
            "Login successful! Redirecting...";


        /**
         * ====================================================
         * STORE USER
         * ====================================================
         *
         * Current project uses:
         *
         * sessionStorage.loggedInUser
         */

        sessionStorage.setItem(
            "loggedInUser",
            JSON.stringify(data)
        );


        /**
         * ====================================================
         * PENDING SOIL REPORT
         * ====================================================
         */

        const pendingReportId =
            sessionStorage.getItem(
                "pendingReportId"
            );


        /**
         * ====================================================
         * PENDING BOOKING
         * ====================================================
         */

        const pendingBookingId =
            sessionStorage.getItem(
                "pendingBookingId"
            );


        /**
         * ====================================================
         * REDIRECTION
         * ====================================================
         */

        setTimeout(async () => {


            // ------------------------------------------------
            // PRIORITY 1
            // Soil report
            // ------------------------------------------------

            if (pendingReportId) {

                try {

                    await fetch(
                        `http://localhost:8080/api/soil/link-report` +
                        `?reportId=${pendingReportId}` +
                        `&mobile=${data.mobile}`,
                        {
                            method: "POST"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Soil report linking error:",
                        error
                    );
                }


                sessionStorage.removeItem(
                    "pendingReportId"
                );


                window.location.href =
                    `report-view.html?id=${pendingReportId}`;

                return;
            }


            // ------------------------------------------------
            // PRIORITY 2
            // Existing USER booking
            // ------------------------------------------------

            if (
                data.role === "USER" &&
                pendingBookingId
            ) {

                sessionStorage.removeItem(
                    "pendingBookingId"
                );


                window.location.href =
                    `booking.html?equipmentId=${pendingBookingId}`;

                return;
            }


            // ------------------------------------------------
            // PRIORITY 3
            // VENDOR
            // ------------------------------------------------

            if (
                data.role === "VENDOR"
            ) {

                window.location.href =
                    "vendor-dashboard.html";

                return;
            }


            // ------------------------------------------------
            // PRIORITY 4
            // DELIVERY PARTNER
            // ------------------------------------------------

            if (
                data.role === "DELIVERY_PARTNER"
            ) {

                window.location.href =
                    "delivery-partner.html";

                return;
            }


            // ------------------------------------------------
            // PRIORITY 5
            // USER
            // ------------------------------------------------

            if (
                data.role === "USER"
            ) {

                window.location.href =
                    "user-dashboard.html";

                return;
            }


            // ------------------------------------------------
            // UNKNOWN ROLE
            // ------------------------------------------------

            alert(
                "Unknown user role. Please contact support."
            );


        }, 1000);

    })

    .catch(error => {

        console.error(
            "Login Error:",
            error
        );


        msg.style.color = "red";

        msg.innerText =
            error.message ||
            "Login failed. Please try again.";

    });
}


/**
 * ============================================================
 * 3. LOGOUT
 * ============================================================
 */

function logout() {

    sessionStorage.clear();

    localStorage.removeItem(
        "loggedInUser"
    );

    window.location.href =
        "login.html";
}