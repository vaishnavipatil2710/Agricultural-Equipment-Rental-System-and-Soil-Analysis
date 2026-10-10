/**
 * ✅ ADD EQUIPMENT - LOCAL UPLOAD ONLY
 * Supports both hourly and daily rental pricing.
 */
async function addEquipment() {

    const userRaw = sessionStorage.getItem("loggedInUser");
    const user = userRaw ? JSON.parse(userRaw) : null;

    const msg = document.getElementById("msg");

    // =====================================================
    // AUTHORIZATION CHECK
    // =====================================================

    if (!user || user.role !== "VENDOR") {

        alert("Unauthorized access. Please login as a Vendor.");

        window.location.href = "login.html";

        return;
    }


    // =====================================================
    // CAPTURE FORM DATA
    // =====================================================

    const name =
        document.getElementById("name").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const pricePerDay =
        document.getElementById("pricePerDay").value;

    const pricePerHour =
        document.getElementById("pricePerHour").value;

    const fileInput =
        document.getElementById("imageFile");

    const quantity = 1;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
        !name ||
        !description ||
        !pricePerDay ||
        !pricePerHour
    ) {

        msg.innerText =
            "Please fill in all required fields.";

        msg.style.color = "red";

        return;
    }


    // Make sure prices are valid numbers

    if (
        Number(pricePerDay) <= 0 ||
        Number(pricePerHour) <= 0
    ) {

        msg.innerText =
            "Price must be greater than ₹0.";

        msg.style.color = "red";

        return;
    }


    // =====================================================
    // IMAGE VALIDATION
    // =====================================================

    if (fileInput.files.length === 0) {

        msg.innerText =
            "A real photo of the equipment is required.";

        msg.style.color = "red";

        return;
    }


    // =====================================================
    // CONSTRUCT MULTIPART FORMDATA
    // =====================================================

    const formData = new FormData();

    formData.append(
        "file",
        fileInput.files[0]
    );

    formData.append(
        "name",
        name
    );

    formData.append(
        "description",
        description
    );

    formData.append(
        "pricePerHour",
        pricePerHour
    );

    formData.append(
        "pricePerDay",
        pricePerDay
    );

    formData.append(
        "quantity",
        quantity
    );


    // =====================================================
    // SUBMIT TO SERVER
    // =====================================================

    sendMultipartRequest(
        formData,
        user.id
    );
}


/**
 * ✅ SUBMIT MULTIPART DATA
 */
async function sendMultipartRequest(
    formData,
    vendorId
) {

    const msg =
        document.getElementById("msg");

    try {

        const res = await fetch(
            `http://localhost:8080/api/vendor/equipment/upload/${vendorId}`,
            {
                method: "POST",

                // Do NOT set Content-Type manually.
                // Browser automatically creates the
                // multipart boundary.

                body: formData
            }
        );

        await handleResponse(res);

    } catch (error) {

        console.error(
            "Submission Error:",
            error
        );

        msg.innerText =
            "System Error: Could not connect to the server.";

        msg.style.color = "red";
    }
}


/**
 * ✅ HANDLE SERVER RESPONSE
 */
async function handleResponse(res) {

    const msg =
        document.getElementById("msg");

    if (res.ok) {

        msg.style.color = "green";

        msg.innerText =
            "Equipment listed successfully with hourly and daily pricing!";

        setTimeout(() => {

            window.location.href =
                "vendor-dashboard.html";

        }, 1500);

    } else {

        const errorText =
            await res.text();

        msg.style.color = "red";

        msg.innerText =
            "Upload Failed: " + errorText;
    }
}


/**
 * ✅ LOGOUT UTILITY
 */
function logout() {

    sessionStorage.clear();

    window.location.href =
        "login.html";
}