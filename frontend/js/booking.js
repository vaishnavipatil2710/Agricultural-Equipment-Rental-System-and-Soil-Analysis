const params = new URLSearchParams(window.location.search);



const equipmentId = params.get("equipmentId");



let dailyRate = 0;

let hourlyRate = 0;





/* =========================================================

   PAGE LOAD

   ========================================================= */



document.addEventListener("DOMContentLoaded", () => {



    // -----------------------------------------------------

    // Check equipment ID

    // -----------------------------------------------------



    if (!equipmentId) {



        alert("No equipment selected!");



        window.location.href = "user-dashboard.html";



        return;

    }





    // -----------------------------------------------------

    // Load equipment

    // -----------------------------------------------------



    loadEquipmentDetails();





    // -----------------------------------------------------

    // Inputs used for price calculation

    // -----------------------------------------------------



    const inputs = [

        "startDate",

        "startTime",

        "endDate",

        "endTime",

        "bookingType"

    ];





    inputs.forEach(id => {



        const element = document.getElementById(id);



        if (element) {



            element.addEventListener(

                "change",

                calculateTotal

            );

        }

    });





    // -----------------------------------------------------

    // Date input formatting: YYYY-MM-DD

    // -----------------------------------------------------



    ["startDate", "endDate"].forEach(id => {



        const dateInput = document.getElementById(id);



        if (!dateInput) {

            return;

        }



        dateInput.addEventListener("input", () => {



            let value = dateInput.value.replace(/\D/g, "");



            if (value.length > 8) {

                value = value.substring(0, 8);

            }



            if (value.length > 4) {

                value =

                    value.substring(0, 4) +

                    "-" +

                    value.substring(4);

            }



            if (value.length > 7) {

                value =

                    value.substring(0, 7) +

                    "-" +

                    value.substring(7);

            }



            dateInput.value = value;



            calculateTotal();

            updateBookingTimingNotice();

        });



    });





    // -----------------------------------------------------

    // Start date/time change

    // Show delivery timing recommendation

    // -----------------------------------------------------



    const startDate =

        document.getElementById("startDate");



    const startTime =

        document.getElementById("startTime");





    if (startDate) {



        startDate.addEventListener(

            "change",

            updateBookingTimingNotice

        );

    }





    if (startTime) {



        startTime.addEventListener(

            "change",

            updateBookingTimingNotice

        );

    }





    // -----------------------------------------------------

    // Change rental rule when booking type changes

    // -----------------------------------------------------



    const bookingType =

        document.getElementById("bookingType");



    const rentalRule =

        document.getElementById("rentalRule");





    if (bookingType && rentalRule) {



        bookingType.addEventListener("change", () => {



            updateRentalRule();



            calculateTotal();



        });

    }





    // -----------------------------------------------------

    // Set initial rule

    // -----------------------------------------------------



    updateRentalRule();



});





/* =========================================================

   UPDATE RENTAL RULE MESSAGE

   ========================================================= */



function updateRentalRule() {



    const bookingType =

        document.getElementById("bookingType");



    const rentalRule =

        document.getElementById("rentalRule");





    if (!bookingType || !rentalRule) {

        return;

    }





    if (bookingType.value === "HOURLY") {



        rentalRule.innerHTML =

            "ℹ️ Minimum hourly rental duration: " +

            "<strong>30 minutes</strong>";



    } else {



        rentalRule.innerHTML =

            "ℹ️ Minimum daily rental duration: " +

            "<strong>1 day</strong>";

    }

}





/* =========================================================

   BOOKING TIMING RECOMMENDATION

   ========================================================= */



function updateBookingTimingNotice() {



    const startDate =

        document.getElementById("startDate")?.value;



    const startTime =

        document.getElementById("startTime")?.value;



    const warning =

        document.getElementById("bookingTimingWarning");





    if (!warning) {

        return;

    }





    // Nothing selected yet



    if (!startDate || !startTime) {



        warning.style.display = "none";



        return;

    }





    const startDateTime =

        new Date(`${startDate}T${startTime}`);



    const now = new Date();





    // Invalid date



    if (isNaN(startDateTime.getTime())) {



        warning.style.display = "none";



        return;

    }





    const differenceMilliseconds =

        startDateTime - now;



    const differenceHours =

        differenceMilliseconds /

        (1000 * 60 * 60);





    /*

     * IMPORTANT:

     *

     * This is NOT a restriction.

     *

     * Booking is still allowed.

     *

     * We only show a recommendation when

     * the start time is less than 2 hours away.

     */



    if (

        differenceHours >= 0 &&

        differenceHours < 2

    ) {



        warning.style.display = "block";



    } else {



        warning.style.display = "none";

    }

}





/* =========================================================

   LOAD EQUIPMENT DETAILS

   ========================================================= */



function loadEquipmentDetails() {



    fetch(

        `http://localhost:8080/api/equipment/${equipmentId}`

    )



        .then(response => {



            if (!response.ok) {



                throw new Error(

                    "Equipment not found"

                );

            }



            return response.json();

        })



        .then(eq => {



            // -------------------------------------------------

            // Equipment information

            // -------------------------------------------------



            document.getElementById("eqName").innerText =

                eq.name;





            document.getElementById("eqDesc").innerText =

                eq.description;





            // -------------------------------------------------

            // Price information

            // -------------------------------------------------



            dailyRate =

                Number(eq.pricePerDay) || 0;





            hourlyRate =

                Number(eq.pricePerHour) || 0;





            document.getElementById("priceDay").innerText =

                dailyRate.toFixed(2);





            document.getElementById("priceHour").innerText =

                hourlyRate.toFixed(2);





            // -------------------------------------------------

            // Quantity

            // -------------------------------------------------



            document.getElementById("quantity").innerText =

                eq.quantity;





            // -------------------------------------------------

            // Equipment image

            // -------------------------------------------------



            const imagePath =

                eq.imageUrl &&

                eq.imageUrl.trim() !== ""



                    ? eq.imageUrl



                    : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400&auto=format&fit=crop";





            const equipmentImage =

                document.getElementById(

                    "equipmentImage"

                );





            if (equipmentImage) {



                equipmentImage.src =

                    imagePath;





                equipmentImage.onerror = () => {



                    equipmentImage.src =

                        "https://via.placeholder.com/400x300?text=No+Image+Available";

                };

            }





            // Recalculate if dates were already selected



            calculateTotal();



            updateBookingTimingNotice();



        })



        .catch(error => {



            console.error(

                "Error loading equipment:",

                error

            );





            alert(

                "Unable to load equipment details."

            );

        });

}





/* =========================================================

   CALCULATE TOTAL AMOUNT

   ========================================================= */



function calculateTotal() {



    const bookingType =

        document.getElementById("bookingType").value;





    const startDate =

        document.getElementById("startDate").value;





    const startTime =

        document.getElementById("startTime").value;





    const endDate =

        document.getElementById("endDate").value;





    const endTime =

        document.getElementById("endTime").value;





    const totalAmount =

        document.getElementById("totalAmount");





    // -----------------------------------------------------

    // Dates/time not selected yet

    // -----------------------------------------------------



    if (

        !startDate ||

        !startTime ||

        !endDate ||

        !endTime

    ) {



        totalAmount.value = "";



        return;

    }





    // -----------------------------------------------------

    // Create date objects

    // -----------------------------------------------------



    const start =

        new Date(

            `${startDate}T${startTime}`

        );





    const end =

        new Date(

            `${endDate}T${endTime}`

        );





    // -----------------------------------------------------

    // Invalid dates

    // -----------------------------------------------------



    if (end <= start) {



        totalAmount.value =

            "Invalid Dates";



        return;

    }





    // -----------------------------------------------------

    // Calculate duration

    // -----------------------------------------------------



    const diffMs =

        end - start;





    const diffMinutes =

        diffMs / (1000 * 60);





    const diffHours =

        diffMinutes / 60;





    // =====================================================

    // HOURLY BOOKING

    // =====================================================



    if (bookingType === "HOURLY") {



        // -------------------------------------------------

        // Minimum 30 minutes

        // -------------------------------------------------



        if (diffMinutes < 30) {



            totalAmount.value =

                "Minimum 30 minutes";



            return;

        }





        // -------------------------------------------------

        // Calculate hourly amount

        // -------------------------------------------------



        const total =

            diffHours * hourlyRate;





        totalAmount.value =

            total.toFixed(2);



        return;

    }
        // =====================================================

    // DAILY BOOKING

    // =====================================================



    if (bookingType === "DAILY") {



        // -------------------------------------------------

        // Minimum 24 hours

        // -------------------------------------------------



        if (diffHours < 24) {



            totalAmount.value =

                "Minimum 1 day";



            return;

        }





        // -------------------------------------------------

        // Calculate number of days

        // -------------------------------------------------



        const diffDays =

            Math.ceil(diffHours / 24);





        const total =

            diffDays * dailyRate;





        totalAmount.value =

            total.toFixed(2);



        return;

    }

}





/* =========================================================

   CONFIRM BOOKING

   ========================================================= */



async function confirmBooking() {



    // =====================================================

    // GET LOGGED-IN USER

    // =====================================================



    const userData =

        sessionStorage.getItem(

            "loggedInUser"

        );





    if (!userData) {



        alert(

            "Please login to book equipment."

        );





        window.location.href =

            "login.html";





        return;

    }





    let user;





    try {



        user =

            JSON.parse(userData);



    } catch (error) {



        console.error(

            "Invalid login data:",

            error

        );





        alert(

            "Login session is invalid. Please login again."

        );





        sessionStorage.removeItem(

            "loggedInUser"

        );





        window.location.href =

            "login.html";





        return;

    }





    // =====================================================

    // GET FORM VALUES

    // =====================================================



    const bookingType =

        document.getElementById(

            "bookingType"

        ).value;





    const startDate =

        document.getElementById(

            "startDate"

        ).value;





    const startTime =

        document.getElementById(

            "startTime"

        ).value;





    const endDate =

        document.getElementById(

            "endDate"

        ).value;





    const endTime =

        document.getElementById(

            "endTime"

        ).value;





    // =====================================================

    // DELIVERY ADDRESS

    // =====================================================



    const deliveryAddress =

        document.getElementById(

            "deliveryAddress"

        ).value.trim();





    // =====================================================

    // REQUIRED FIELD VALIDATION

    // =====================================================



    if (

        !deliveryAddress ||

        !startDate ||

        !startTime ||

        !endDate ||

        !endTime

    ) {



        alert(

            "Please enter delivery address and select start/end date and time."

        );





        return;

    }





    // =====================================================

    // DATE FORMAT & VALIDATION

    // =====================================================



    const datePattern = /^\d{4}-\d{2}-\d{2}$/;



    if (

        !datePattern.test(startDate) ||

        !datePattern.test(endDate)

    ) {



        alert(

            "Please enter dates in YYYY-MM-DD format.\n\nExample: 2026-10-08"

        );



        return;

    }





    function isValidDateValue(value) {



        const parts =

            value.split("-");



        const year =

            Number(parts[0]);



        const month =

            Number(parts[1]);



        const day =

            Number(parts[2]);





        const date =

            new Date(

                year,

                month - 1,

                day

            );





        return (

            date.getFullYear() === year &&

            date.getMonth() === month - 1 &&

            date.getDate() === day

        );

    }





    if (

        !isValidDateValue(startDate) ||

        !isValidDateValue(endDate)

    ) {



        alert(

            "Please enter valid dates in YYYY-MM-DD format."

        );



        return;

    }





    // =====================================================

    // CREATE DATE OBJECTS

    // =====================================================



    const start =

        new Date(

            `${startDate}T${startTime}`

        );





    const end =

        new Date(

            `${endDate}T${endTime}`

        );





    // =====================================================

    // END MUST BE AFTER START

    // =====================================================



    if (end <= start) {



        alert(

            "End time must be after start time."

        );





        return;

    }





    // =====================================================

    // CALCULATE DURATION

    // =====================================================



    const durationMinutes =

        (end - start) /

        (1000 * 60);





    const durationHours =

        durationMinutes / 60;





    // =====================================================

    // HOURLY VALIDATION

    // =====================================================



    if (bookingType === "HOURLY") {



        if (durationMinutes < 30) {



            alert(

                "❌ Minimum rental duration is 30 minutes."

            );





            return;

        }

    }





    // =====================================================

    // DAILY VALIDATION

    // =====================================================



    if (bookingType === "DAILY") {



        if (durationHours < 24) {



            alert(

                "❌ Daily rental must be at least 1 day."

            );





            return;

        }

    }





    // =====================================================

    // 2-HOUR RECOMMENDATION

    // =====================================================



    const now = new Date();





    const differenceMilliseconds =

        start - now;





    const differenceHours =

        differenceMilliseconds /

        (1000 * 60 * 60);





    /*

     * IMPORTANT:

     *

     * This is ONLY a recommendation.

     *

     * We DO NOT block the booking.

     */



    if (

        differenceHours >= 0 &&

        differenceHours < 2

    ) {



        // Informational recommendation only.

        // Booking is still allowed.

        console.log(

            "Start time is less than 2 hours away. " +

            "Equipment availability and delivery depend on vendor approval."

        );

    }





    // =====================================================

    // CALCULATE FINAL AMOUNT AGAIN

    // =====================================================



    let totalAmountValue;





    if (bookingType === "HOURLY") {



        totalAmountValue =

            durationHours * hourlyRate;



    } else if (bookingType === "DAILY") {



        const days =

            Math.ceil(

                durationHours / 24

            );





        totalAmountValue =

            days * dailyRate;



    } else {



        alert(

            "Invalid booking type."

        );



        return;

    }





    // =====================================================

    // ROUND AMOUNT

    // =====================================================



    totalAmountValue =

        Math.round(

            totalAmountValue * 100

        ) / 100;





    // =====================================================

    // CHECK AMOUNT

    // =====================================================



    if (

        !Number.isFinite(totalAmountValue) ||

        totalAmountValue <= 0

    ) {



        alert(

            "Unable to calculate rental amount."

        );



        return;

    }





    // =====================================================

    // SHOW FINAL CALCULATED AMOUNT

    // =====================================================



    document.getElementById(

        "totalAmount"

    ).value =

        totalAmountValue.toFixed(2);





    // =====================================================

    // CREATE BOOKING REQUEST

    // =====================================================



    const bookingData = {



        bookingType:

            bookingType,



        startDateTime:

            `${startDate}T${startTime}`,



        endDateTime:

            `${endDate}T${endTime}`,



        totalAmount:

            totalAmountValue,



        deliveryAddress:

            deliveryAddress,



        status:

            "PENDING"

    };





    // =====================================================

    // SEND REQUEST TO BACKEND

    // =====================================================



    try {



        const response =

            await fetch(

                `http://localhost:8080/api/bookings/request?userId=${user.id}&equipmentId=${equipmentId}`,

                {

                    method: "POST",



                    headers: {

                        "Content-Type":

                            "application/json"

                    },



                    body:

                        JSON.stringify(

                            bookingData

                        )

                }

            );





        // =================================================

        // SUCCESS

        // =================================================



        if (response.ok) {



            alert(

                "✅ Booking Request Sent! The vendor will review your request."

            );





            window.location.href =

                "user-bookings.html";





            return;

        }





        // =================================================

        // BACKEND ERROR

        // =================================================



        const errorMsg =

            await response.text();





        alert(

            "❌ Booking failed: " +

            errorMsg

        );



    }





    catch (error) {



        console.error(

            "Booking Error:",

            error

        );





        alert(

            "Server error. Please check if the backend is running."

        );

    }

}





/* =========================================================

   GO BACK

   ========================================================= */



function goBack() {



    window.location.href =

        "user-dashboard.html";

}