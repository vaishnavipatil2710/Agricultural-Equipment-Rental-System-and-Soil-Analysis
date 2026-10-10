/**
 * VENDOR MANAGEMENT DASHBOARD LOGIC
 */

document.addEventListener("DOMContentLoaded", () => {

    // 1. Retrieve the logged-in user from sessionStorage
    const userRaw = sessionStorage.getItem("loggedInUser");
    const user = userRaw ? JSON.parse(userRaw) : null;

    // 2. Security: Redirect if not a Vendor
    if (!user || user.role !== "VENDOR") {
        alert("Unauthorized access. Please login as a Vendor.");
        window.location.href = "login.html";
        return;
    }

    // 3. Update UI with Vendor Name
    const welcomeElement = document.getElementById("welcomeText");

    if (welcomeElement) {
        welcomeElement.innerText = `Welcome, ${user.name}!`;
    }

    // 4. Load equipment
    loadVendorEquipment(user.id);
});


// ==========================================
// FETCH AND DISPLAY VENDOR EQUIPMENT
// ==========================================

function loadVendorEquipment(vendorId) {

    const tbody = document.getElementById("equipmentBody");
    const totalCount = document.getElementById("totalCount");

    if (!tbody) return;


    // Loading state

    tbody.innerHTML =
        "<tr><td colspan='7' style='text-align:center;'>Loading your inventory...</td></tr>";


    // Fetch vendor equipment

    fetch(`http://localhost:8080/api/vendor/equipment/list/${vendorId}`)

        .then(res => {

            if (!res.ok) {
                throw new Error("Could not fetch data from server");
            }

            return res.json();
        })

        .then(list => {

            tbody.innerHTML = "";


            // Total equipment count

            if (totalCount) {
                totalCount.innerText = list.length;
            }


            // No equipment

            if (list.length === 0) {

                tbody.innerHTML =
                    "<tr><td colspan='7' style='text-align:center;'>You haven't added any equipment yet.</td></tr>";

                return;
            }


            // Create rows

            list.forEach(eq => {

                const statusText =
                    eq.available
                        ? "Available"
                        : "Not Available";

                const statusClass =
                    eq.available
                        ? "status-available"
                        : "status-unavailable";


                // Image fallback

                const imagePath =
                    eq.imageUrl &&
                    eq.imageUrl.trim() !== ""

                        ? eq.imageUrl

                        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=200&auto=format&fit=crop";


                const row = document.createElement("tr");


                /*
                 * IMPORTANT:
                 *
                 * HTML table header order:
                 *
                 * Name
                 * Description
                 * Price / Day
                 * Image
                 * Available Qty
                 * Status
                 * Actions
                 *
                 * So the TD order below MUST be the same.
                 */

                row.innerHTML = `

                    <!-- NAME -->
                    <td>
                        <b>${eq.name}</b>
                    </td>


                    <!-- DESCRIPTION -->
                    <td>
                        ${eq.description}
                    </td>


                    <!-- PRICE -->
                    <td>
                        ₹${eq.pricePerDay}
                    </td>


                    <!-- IMAGE -->
                    <td>
                        <img
                            src="${imagePath}"
                            onerror="this.src='https://via.placeholder.com/80x50?text=No+Image'"
                            alt="${eq.name}"
                            style="
                                width:80px;
                                height:50px;
                                border-radius:5px;
                                object-fit:cover;
                                border:1px solid #ddd;
                            "
                        >
                    </td>


                    <!-- AVAILABLE QUANTITY -->
                    <td>
                        ${eq.quantity || 1}
                    </td>


                    <!-- STATUS -->
                    <td class="${statusClass}">
                        ${statusText}
                    </td>


                    <!-- ACTIONS -->
                    <td>

                        <div class="action-btn">

                            <button
                                class="btn blue"
                                onclick="editEquipment(${eq.id})"
                            >
                                Edit
                            </button>

                            <button
                                class="btn red"
                                onclick="deleteEquipment(${eq.id})"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                `;


                tbody.appendChild(row);
            });

        })

        .catch(err => {

            console.error("Fetch Error:", err);

            tbody.innerHTML =
                "<tr><td colspan='7' style='text-align:center; color:red;'>Failed to load equipment list.</td></tr>";

        });
}


// ==========================================
// VENDOR ACTIONS
// ==========================================

function goToAddEquipment() {

    window.location.href = "vendor-add-equipment.html";
}


function editEquipment(id) {

    window.location.href =
        `edit-equipment.html?id=${id}`;
}


function deleteEquipment(id) {

    if (
        !confirm(
            "Are you sure you want to delete this equipment permanently?"
        )
    ) {
        return;
    }


    fetch(
        `http://localhost:8080/api/vendor/equipment/${id}`,
        {
            method: "DELETE"
        }
    )

        .then(res => {

            if (!res.ok) {
                throw new Error("Delete failed");
            }

            alert("Equipment deleted successfully!");


            const user =
                JSON.parse(
                    sessionStorage.getItem("loggedInUser")
                );


            loadVendorEquipment(user.id);

        })

        .catch(err => {

            console.error(err);

            alert("Failed to delete equipment.");

        });
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    sessionStorage.clear();

    window.location.href = "login.html";
}