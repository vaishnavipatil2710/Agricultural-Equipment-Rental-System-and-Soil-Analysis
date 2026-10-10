# AgriRent Hub — Agricultural Equipment Rental System and Soil Analysis

## Project Overview

AgriRent Hub is a web-based agricultural equipment rental platform that connects farmers with equipment vendors and delivery partners. It helps farmers book agricultural equipment, manage rental payments, access soil-analysis and crop-guidance features, and track deliveries.

The application includes Razorpay Test Mode payment integration, refund handling through the Razorpay Refund API, live delivery tracking, delivery-failure website notifications, and delivery OTP verification.

## Key Features

### 1. Farmer Module

- Register and log in to the application.
- Browse available agricultural equipment.
- Submit equipment rental bookings.
- View booking, payment, and delivery status.
- Access soil analysis and crop guidance.
- Track the delivery partner's location on a map when valid GPS coordinates are available.
- Receive an in-website notification if a delivery cannot be completed.
- Share the delivery OTP directly with the delivery partner when they meet in person.

### 2. Vendor Module

- Add and manage agricultural equipment listings.
- Review incoming booking requests.
- Approve or reject booking requests.
- Manage equipment availability.
- Assign a delivery partner according to the application's delivery workflow.

### 3. Delivery Partner Module

- View assigned deliveries.
- Update delivery progress and status.
- Share current GPS coordinates through the configured location-update workflow.
- Deliver equipment to the farmer's address.
- Receive the delivery OTP from the farmer in person and submit it through the application's verification workflow.

### 4. Online Payment — Razorpay Test Mode

AgriRent Hub integrates Razorpay Checkout in Test Mode for testing the rental-payment workflow.

1. The farmer selects equipment and submits a rental booking.
2. The application calculates or displays the rental amount according to the booking details.
3. Razorpay Checkout opens in Test Mode.
4. The farmer completes a test transaction.
5. The application sends the payment result to the backend.
6. The backend processes the result and updates the booking/payment status according to the implemented workflow.

**Note:** Test Mode is intended for testing. Test transactions do not represent real payments collected from customers.

### 5. Refund Management — Razorpay Refund API

The application includes a refund feature that calls the Razorpay Refund API for eligible payments when a delivery cannot be completed.

1. The farmer completes a payment through Razorpay Test Mode.
2. The delivery partner attempts to deliver the equipment.
3. If the delivery is unsuccessful, the application displays a notification to the farmer on the website.
4. The application calls the Razorpay Refund API according to its configured refund workflow.
5. The backend processes the API response and handles the refund result according to the implemented logic.

Because the integration uses Razorpay Test Mode, this is a test refund workflow and does not credit actual money to the farmer's bank account. An API request alone does not guarantee that a refund has completed; the result depends on Razorpay's response and the application's refund-status handling.

### 6. Live Delivery Tracking

The delivery-tracking page uses Leaflet.js to display the map and OpenStreetMap tiles as the map background.

- The farmer opens Track Delivery for a specific booking.
- The page loads the delivery record associated with that booking.
- The page refreshes delivery information every five seconds.
- When valid latitude and longitude values are returned by the backend, the map marker is created or moved to the latest location.
- The page checks that refreshed delivery data belongs to the selected booking before applying the update.
- The map displays a neutral starting view until valid coordinates are available.

Leaflet.js displays the map; it does not obtain GPS coordinates by itself. Live tracking requires the delivery partner's device/location feature to obtain coordinates and the backend to save and return them. Browser geolocation requires permission and generally a secure context (HTTPS, or localhost during local development).

### 7. Delivery Failure Notification

If the delivery partner cannot complete a delivery, the application displays a notification on the website to inform the farmer.

The documented notification channel is the website interface. SMS, email, and WhatsApp notifications are not claimed as part of this feature.

### 8. Delivery OTP Verification

The delivery OTP helps confirm that the equipment has physically reached the farmer.

1. The delivery partner reaches the farmer's delivery address.
2. The farmer shares the OTP directly with the delivery partner in person.
3. The OTP is submitted to the backend verification workflow for that delivery.
4. The backend validates the OTP.
5. After successful verification, the tracking page reloads the delivery details and displays the updated verification/status information.

The tracking JavaScript currently includes an OTP input and calls this endpoint pattern:

```http
POST /api/deliveries/{deliveryId}/verify-otp?otp={otp}
```

The endpoint and user interface should match the actual deployed workflow. For production, validate OTPs on the server, restrict repeated attempts, expire OTPs when appropriate, and avoid logging OTP values. Prefer sending OTP values in a request body rather than a URL query string.

### 9. Soil Analysis and Crop Guidance

The project includes a soil-analysis and crop-guidance module. The specific inputs, analysis method, and recommendations depend on the current implementation and configuration of the soil-analysis service.

### 10. AI Assistant

The project includes an AI service component for assistant functionality. Its responses depend on the configured service and required API credentials.

## End-to-End Project Workflow

1. The farmer registers or logs in.
2. The farmer browses available agricultural equipment and submits a booking.
3. The vendor reviews the booking and approves or rejects it.
4. The farmer completes the required payment steps through Razorpay Test Mode.
5. The backend processes the payment result and updates the booking/payment status according to the implemented workflow.
6. A delivery record is created or updated for the booking.
7. The vendor assigns a delivery partner.
8. The delivery partner picks up the equipment and updates the delivery status.
9. The farmer opens Track Delivery to view the status, delivery address, partner details, and map.
10. The tracking page refreshes the selected delivery every five seconds and updates the marker when valid GPS coordinates are returned.
11. If the delivery cannot be completed, the application displays an in-website notification and calls the Razorpay Refund API according to the configured refund workflow for eligible payments.
12. The backend processes the refund response. Because Test Mode is used, no actual money is credited to the farmer's bank account.
13. If delivery proceeds, the farmer shares the delivery OTP with the delivery partner when they meet in person.
14. The OTP is submitted for backend verification.
15. After successful verification, the application refreshes the delivery details and displays the updated status according to the backend workflow.

## Delivery Statuses

The tracking interface recognises these delivery statuses:

- `PENDING`
- `APPROVED`
- `PAID`
- `READY_FOR_DELIVERY`
- `ASSIGNED`
- `PICKED_UP`
- `OUT_FOR_DELIVERY`
- `ARRIVED_AT_LOCATION`
- `DELIVERED`

The backend controls the actual status transitions.

## Technology Stack

- **Backend:** Java 21, Spring Boot, Spring Data JPA
- **Build Tool:** Maven
- **Database:** The database configured in the backend environment
- **Frontend:** HTML, CSS, JavaScript
- **Maps:** Leaflet.js and OpenStreetMap
- **Location Tracking:** GPS/browser geolocation and backend coordinate updates
- **Payment:** Razorpay Checkout in Test Mode
- **Refunds:** Razorpay Refund API in Test Mode
- **AI Service:** Node.js and Express, where configured
- **Soil Analysis Service:** Python-based service, depending on the current implementation
- **Version Control:** Git and GitHub

## Project Structure

```text
Agricultural-Equipment-Rental-System-and-Soil-Analysis/
├── ai-service/     # AI assistant service
├── frontend/       # Web interface
├── mlservice/      # Soil-analysis / ML service
├── rental/         # Spring Boot backend
├── .gitignore
└── README.md
```

The exact files and scripts inside each folder may change as the project evolves.

## Getting Started

### Prerequisites

Install the tools needed for the components you intend to run:

- Java 21
- Maven
- MySQL, if configured for the backend
- Node.js and npm for Node.js services
- Python for the soil-analysis service, if required
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/vaishnavipatil2710/Agricultural-Equipment-Rental-System-and-Soil-Analysis.git
cd Agricultural-Equipment-Rental-System-and-Soil-Analysis
```

### 2. Configure and Run the Backend

1. Open the `rental/` folder.
2. Configure the local database connection and any required service settings.
3. Keep passwords and API credentials in environment variables or local configuration excluded from Git.
4. Run the backend from the `rental/` folder if the Maven configuration supports this command:

```bash
mvn spring-boot:run
```

Use the database name, port, and credentials configured for your environment.

### 3. Run the Frontend

1. Open the `frontend/` folder.
2. Follow the scripts in its `package.json`, if present, or serve the HTML files using a local web server.
3. Ensure the frontend API base URL points to the running backend.

The current delivery-tracking JavaScript uses `http://localhost:8080/api` for local development. Change this URL when deploying the application because `localhost` refers to the device running the browser.

### 4. Run Additional Services

Run the AI assistant and soil-analysis services when required by the features being tested. Follow the dependency and startup instructions in their respective folders.

Configure any required API keys locally. Do not commit credentials to GitHub.

## Security Notes

- Never commit `.env` files, passwords, API keys, database credentials, certificates, or service-account files.
- `.gitignore` prevents matching untracked files from being added; it does not remove secrets already committed.
- If a real credential has been exposed on GitHub, revoke or rotate it.
- Keep Razorpay secret credentials on the backend.
- Validate booking ownership, delivery ownership, payment results, and OTPs on the backend.
- Restrict repeated OTP attempts and avoid logging OTP values.
- Use HTTPS and configure CORS appropriately for production.

## Future Enhancements

- Add automated tests for booking, payment, refund, GPS tracking, and OTP verification.
- Improve error handling when GPS permission is denied or coordinates are unavailable.
- Add delivery-distance and estimated-arrival features if supported by a routing service.
- Improve production deployment, monitoring, and notifications.
- Expand soil-analysis and crop-guidance capabilities.

## Author

**Vaishnavi Patil**

GitHub: [vaishnavipatil2710](https://github.com/vaishnavipatil2710)
