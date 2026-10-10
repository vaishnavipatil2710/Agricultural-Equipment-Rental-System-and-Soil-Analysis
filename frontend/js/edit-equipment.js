const params = new URLSearchParams(window.location.search);
const equipmentId = params.get("id");


// =========================================================
// LOAD EQUIPMENT DATA
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    if (!equipmentId) {
        alert("Invalid equipment selection.");
        window.location.href = "vendor-dashboard.html";
        return;
    }


    // -----------------------------------------------------
    // FETCH EXISTING EQUIPMENT
    // -----------------------------------------------------

    fetch(
        `http://localhost:8080/api/vendor/equipment/${equipmentId}`
    )
        .then(res => {

            if (!res.ok) {
                throw new Error("Could not find equipment");
            }

            return res.json();
        })

        .then(eq => {

            document.getElementById("name").value =
                eq.name || "";

            document.getElementById("description").value =
                eq.description || "";

            // IMPORTANT:
            // Load existing hourly price
            document.getElementById("pricePerHour").value =
                eq.pricePerHour || 0;

            document.getElementById("pricePerDay").value =
                eq.pricePerDay || 0;

            document.getElementById("quantity").value =
                eq.quantity || 0;


            // Show current image
            updateImagePreview(eq.imageUrl);
        })

        .catch(err => {

            console.error(err);

            alert(
                "Failed to load equipment data."
            );
        });


    // =====================================================
    // PREVIEW NEW IMAGE
    // =====================================================

    const fileInput =
        document.getElementById("imageFile");

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files[0]
                ) {

                    const reader =
                        new FileReader();

                    reader.onload = (e) => {

                        document.getElementById(
                            "imagePreview"
                        ).src = e.target.result;
                    };

                    reader.readAsDataURL(
                        this.files[0]
                    );
                }
            }
        );
    }
});


// =========================================================
// UPDATE EQUIPMENT
// =========================================================

async function updateEquipment() {

    const name =
        document.getElementById("name")
            .value
            .trim();

    const description =
        document.getElementById("description")
            .value
            .trim();

    const pricePerHour =
        document.getElementById("pricePerHour")
            .value;

    const pricePerDay =
        document.getElementById("pricePerDay")
            .value;

    const quantity =
        document.getElementById("quantity")
            .value;

    const fileInput =
        document.getElementById("imageFile");


    // =====================================================
    // SESSION CHECK
    // =====================================================

    const userRaw =
        sessionStorage.getItem(
            "loggedInUser"
        );

    const currentUser =
        userRaw
            ? JSON.parse(userRaw)
            : null;


    if (!currentUser) {

        alert(
            "Session expired. Please login again."
        );

        window.location.href =
            "login.html";

        return;
    }


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
        !name ||
        !description ||
        !pricePerHour ||
        !pricePerDay ||
        !quantity
    ) {

        alert(
            "Please fill in all required fields."
        );

        return;
    }


    if (
        Number(pricePerHour) <= 0 ||
        Number(pricePerDay) <= 0
    ) {

        alert(
            "Price must be greater than ₹0."
        );

        return;
    }


    // =====================================================
    // CREATE FORM DATA
    // =====================================================

    const formData =
        new FormData();

    formData.append(
        "name",
        name
    );

    formData.append(
        "description",
        description
    );

    // IMPORTANT:
    // Send hourly price
    formData.append(
        "pricePerHour",
        pricePerHour
    );

    // Send daily price
    formData.append(
        "pricePerDay",
        pricePerDay
    );

    formData.append(
        "quantity",
        quantity
    );


    // =====================================================
    // OPTIONAL NEW IMAGE
    // =====================================================

    if (
        fileInput.files.length > 0
    ) {

        formData.append(
            "file",
            fileInput.files[0]
        );
    }


    // =====================================================
    // SEND UPDATE REQUEST
    // =====================================================

    try {

        const res =
            await fetch(
                `http://localhost:8080/api/vendor/equipment/upload/${equipmentId}`,
                {
                    method: "PUT",
                    body: formData
                }
            );


        // =================================================
        // SUCCESS
        // =================================================

        if (res.ok) {

            alert(
                "Equipment updated successfully!"
            );

            window.location.href =
                "vendor-dashboard.html";

            return;
        }


        // =================================================
        // ERROR
        // =================================================

        const errText =
            await res.text();

        alert(
            "Update failed: " +
            errText
        );

    } catch (err) {

        console.error(
            "Update Error:",
            err
        );

        alert(
            "System error. Check console for details."
        );
    }
}


// =========================================================
// IMAGE PREVIEW
// =========================================================

function updateImagePreview(url) {

    const previewImg =
        document.getElementById(
            "imagePreview"
        );

    if (!previewImg) {
        return;
    }


    if (url && url.trim() !== "") {

        previewImg.src = url;

    } else {

        previewImg.src =
            "../assets/img/no-image.png";
    }
}