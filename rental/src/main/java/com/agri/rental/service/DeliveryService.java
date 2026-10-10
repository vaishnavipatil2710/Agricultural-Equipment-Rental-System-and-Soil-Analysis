package com.agri.rental.service;

import com.agri.rental.domain.Booking;
import com.agri.rental.domain.Delivery;
import com.agri.rental.domain.DeliveryPartner;
import com.agri.rental.domain.Equipment;
import com.agri.rental.repository.BookingRepository;
import com.agri.rental.repository.DeliveryPartnerRepository;
import com.agri.rental.repository.DeliveryRepository;
import com.agri.rental.repository.EquipmentRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final BookingRepository bookingRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final EquipmentRepository equipmentRepository;
    private final NotificationService notificationService;

    public DeliveryService(
            DeliveryRepository deliveryRepository,
            BookingRepository bookingRepository,
            DeliveryPartnerRepository deliveryPartnerRepository,
            EquipmentRepository equipmentRepository,
            NotificationService notificationService) {

        this.deliveryRepository = deliveryRepository;
        this.bookingRepository = bookingRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.equipmentRepository = equipmentRepository;
        this.notificationService = notificationService;
    }

    // =========================================================
    // CREATE OUTBOUND DELIVERY
    // =========================================================

    @Transactional
    public Delivery createDelivery(Long bookingId) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"));

        if (!"APPROVED".equalsIgnoreCase(booking.getStatus()) &&
                !"PAID".equalsIgnoreCase(booking.getStatus())) {

            throw new RuntimeException(
                    "Delivery can be created only for an APPROVED or PAID booking");
        }

        if (deliveryRepository.existsByBookingIdAndDeliveryType(
                bookingId,
                "OUTBOUND")) {

            throw new RuntimeException(
                    "Outbound delivery already exists for this booking");
        }

        if (booking.getUser() == null) {

            throw new RuntimeException(
                    "Farmer information is missing from booking");
        }

        // =====================================================
        // BOOKING-SPECIFIC FARMER DELIVERY ADDRESS
        // =====================================================

        /*
         * Do NOT use farmer profile address here.
         *
         * Example:
         * Farmer profile address = Sangli
         * Booking delivery address = Pune
         *
         * Equipment should be delivered to Pune.
         */
        if (booking.getDeliveryAddress() == null ||
                booking.getDeliveryAddress().isBlank()) {

            throw new RuntimeException(
                    "Booking delivery address is missing");
        }

        // =====================================================
        // EQUIPMENT
        // =====================================================

        if (booking.getEquipment() == null) {

            throw new RuntimeException(
                    "Equipment information is missing");
        }

        // =====================================================
        // VENDOR
        // =====================================================

        if (booking.getEquipment().getVendor() == null) {

            throw new RuntimeException(
                    "Equipment vendor information is missing");
        }

        // =====================================================
        // VENDOR PICKUP ADDRESS
        // =====================================================

        if (booking.getEquipment().getVendor().getAddress() == null ||
                booking.getEquipment().getVendor().getAddress().isBlank()) {

            throw new RuntimeException(
                    "Vendor pickup address is missing");
        }

        Delivery delivery = new Delivery();

        delivery.setBooking(booking);

        // =====================================================
        // PICKUP LOCATION
        // Vendor address = Equipment pickup location
        // =====================================================

        delivery.setPickupAddress(
                booking.getEquipment()
                        .getVendor()
                        .getAddress()
        );

        // =====================================================
        // DELIVERY LOCATION
        // Booking-specific farmer delivery address
        // =====================================================

        delivery.setDeliveryAddress(
                booking.getDeliveryAddress().trim()
        );

        delivery.setDeliveryType("OUTBOUND");

        delivery.setStatus("PENDING");

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // GET OUTBOUND DELIVERY BY BOOKING ID
    // =========================================================

    public Delivery getByBookingId(Long bookingId) {

        return deliveryRepository
                .findByBookingIdAndDeliveryType(
                        bookingId,
                        "OUTBOUND"
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Outbound delivery not found for this booking"));
    }

    // =========================================================
    // GET ALL DELIVERIES BY BOOKING ID
    // =========================================================

    public List<Delivery> getDeliveriesByBookingId(
            Long bookingId) {

        if (!bookingRepository.existsById(bookingId)) {

            throw new RuntimeException(
                    "Booking not found");
        }

        return deliveryRepository.findByBookingId(bookingId);
    }

    // =========================================================
    // GET DELIVERY BY DELIVERY ID
    // =========================================================

    public Delivery getById(Long deliveryId) {

        return deliveryRepository.findById(deliveryId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Delivery not found"));
    }

    // =========================================================
    // MARK DELIVERY READY
    // =========================================================

    @Transactional
    public Delivery markReady(Long deliveryId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        String deliveryType =
                delivery.getDeliveryType();

        String currentStatus =
                delivery.getStatus();

        if ("OUTBOUND".equalsIgnoreCase(deliveryType)) {

            if (!"PENDING".equalsIgnoreCase(currentStatus)) {

                throw new RuntimeException(
                        "Outbound delivery can be marked ready only from PENDING status");
            }

        } else if ("RETURN".equalsIgnoreCase(deliveryType)) {

            if (!"RETURN_REQUESTED".equalsIgnoreCase(
                    currentStatus)) {

                throw new RuntimeException(
                        "Return delivery can be marked ready only from RETURN_REQUESTED status");
            }

        } else {

            throw new RuntimeException(
                    "Invalid delivery type");
        }

        delivery.setStatus("READY_FOR_DELIVERY");

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // ASSIGN DELIVERY PARTNER
    // =========================================================

    @Transactional
    public Delivery assignPartner(
            Long deliveryId,
            Long partnerId,
            Long vendorUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"READY_FOR_DELIVERY".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Partner can be assigned only when delivery is READY_FOR_DELIVERY");
        }

        if (vendorUserId == null) {

            throw new RuntimeException(
                    "Vendor user ID is required");
        }

        Booking booking =
                delivery.getBooking();

        if (booking == null) {

            throw new RuntimeException(
                    "Booking information is missing");
        }

        Equipment equipment =
                booking.getEquipment();

        if (equipment == null) {

            throw new RuntimeException(
                    "Equipment information is missing");
        }

        if (equipment.getVendor() == null) {

            throw new RuntimeException(
                    "Equipment vendor information is missing");
        }

        Long actualVendorId =
                equipment.getVendor().getId();

        if (actualVendorId == null) {

            throw new RuntimeException(
                    "Invalid vendor information");
        }

        if (!actualVendorId.equals(vendorUserId)) {

            throw new RuntimeException(
                    "You are not authorized to assign this delivery");
        }

        DeliveryPartner partner =
                deliveryPartnerRepository.findById(partnerId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery partner not found"));

        if (!partner.isAvailable()) {

            throw new RuntimeException(
                    "Delivery partner is currently unavailable");
        }

        delivery.setDeliveryPartner(partner);

        delivery.setStatus("ASSIGNED");

        partner.setAvailable(false);

        deliveryPartnerRepository.save(partner);

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // PICKUP EQUIPMENT
    // =========================================================

    @Transactional
    public Delivery pickupEquipment(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"ASSIGNED".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Equipment can be picked up only when delivery is ASSIGNED");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to pick up this delivery");
        }

        delivery.setStatus("PICKED_UP");

        delivery.setPickedUpAt(
                LocalDateTime.now()
        );

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // START DELIVERY
    // PICKED_UP → OUT_FOR_DELIVERY
    //
    // OTP is cleared here.
    // OTP is generated only when partner arrives.
    // =========================================================

    @Transactional
    public Delivery startDelivery(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"PICKED_UP".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Delivery can start only after equipment is picked up");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to start this delivery");
        }

        // Clear old OTP
        delivery.setOtp(null);

        delivery.setOtpVerified(false);

        delivery.setOtpGeneratedAt(null);

        delivery.setStatus("OUT_FOR_DELIVERY");

        delivery.setOutForDeliveryAt(
                LocalDateTime.now()
        );

        return deliveryRepository.save(delivery);
    }



    // =========================================================
    // REPORT UNABLE TO DELIVER
    // OUT_FOR_DELIVERY -> DELIVERY_FAILED
    // Equipment remains with delivery partner.
    // =========================================================

    @Transactional
    public Delivery reportDeliveryFailure(
            Long deliveryId,
            Long partnerUserId,
            String reason) {

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() ->
                        new RuntimeException("Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "This action is only allowed for outbound delivery");
        }

        if (!"OUT_FOR_DELIVERY".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Failure can be reported only when delivery is OUT_FOR_DELIVERY");
        }

        if (partnerUserId == null) {
            throw new RuntimeException(
                    "Partner user ID is required");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException(
                    "Please provide a reason for failed delivery");
        }

        DeliveryPartner partner = delivery.getDeliveryPartner();

        if (partner == null
                || partner.getUser() == null
                || partner.getUser().getId() == null) {

            throw new RuntimeException(
                    "No valid delivery partner is assigned");
        }

        if (!partner.getUser().getId().equals(partnerUserId)) {
            throw new RuntimeException(
                    "You are not authorized to report this delivery failure");
        }

        delivery.setFailureReason(reason.trim());
        delivery.setFailedAt(LocalDateTime.now());
        delivery.setStatus("DELIVERY_FAILED");

        // Clear OTP because delivery was not completed.
        delivery.setOtp(null);
        delivery.setOtpVerified(false);
        delivery.setOtpGeneratedAt(null);

        // IMPORTANT:
        // Do not set partner available = true.
        // Do not mark equipment as available.
        // Partner is still holding the equipment.

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // UPDATE LIVE LOCATION
    // =========================================================

    @Transactional
    public Delivery updateLocation(
            Long deliveryId,
            Long partnerUserId,
            Double latitude,
            Double longitude) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "Live location tracking is available only for outbound delivery");
        }

        if (!"OUT_FOR_DELIVERY".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Location can be updated only when delivery is OUT_FOR_DELIVERY");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        if (latitude == null) {

            throw new RuntimeException(
                    "Latitude is required");
        }

        if (latitude < -90 || latitude > 90) {

            throw new RuntimeException(
                    "Invalid latitude value");
        }

        if (longitude == null) {

            throw new RuntimeException(
                    "Longitude is required");
        }

        if (longitude < -180 || longitude > 180) {

            throw new RuntimeException(
                    "Invalid longitude value");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to update this delivery location");
        }

        delivery.setCurrentLatitude(latitude);

        delivery.setCurrentLongitude(longitude);

        delivery.setLastLocationUpdatedAt(
                LocalDateTime.now()
        );

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // ARRIVE AT FARMER LOCATION
    //
    // OUT_FOR_DELIVERY
    //        ↓
    // ARRIVED_AT_LOCATION
    //        ↓
    // OTP GENERATED
    //        ↓
    // FARMER NOTIFICATION CREATED
    // =========================================================

    @Transactional
    public Delivery arriveAtLocation(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "Arrival confirmation is required only for outbound delivery");
        }

        if (!"OUT_FOR_DELIVERY".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Partner can mark arrival only when delivery is OUT_FOR_DELIVERY");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to mark this delivery as arrived");
        }

        // -----------------------------------------------------
        // Mark arrival
        // -----------------------------------------------------

        delivery.setStatus("ARRIVED_AT_LOCATION");

        delivery.setArrivedAt(
                LocalDateTime.now()
        );

        // -----------------------------------------------------
        // Generate OTP
        // -----------------------------------------------------

        LocalDateTime otpGeneratedAt =
                LocalDateTime.now();

        String otp = String.format(
                "%04d",
                new Random().nextInt(10000)
        );

        delivery.setOtp(otp);

        delivery.setOtpVerified(false);

        delivery.setOtpGeneratedAt(
                otpGeneratedAt
        );

        // -----------------------------------------------------
        // Save delivery
        // -----------------------------------------------------

        Delivery savedDelivery =
                deliveryRepository.save(delivery);

        // -----------------------------------------------------
        // CREATE OTP NOTIFICATION FOR FARMER
        // -----------------------------------------------------

        if (delivery.getBooking() != null &&
                delivery.getBooking().getId() != null) {

            notificationService.createDeliveryOtpNotification(
                    delivery.getBooking().getId(),
                    otp,
                    otpGeneratedAt.plusMinutes(10)
            );
        }

        return savedDelivery;
    }

    // =========================================================
    // GENERATE NEW OTP
    //
    // Old OTP must expire first.
    //
    // ARRIVED_AT_LOCATION
    //        ↓
    // 10 MINUTES
    //        ↓
    // OTP EXPIRED
    //        ↓
    // OLD NOTIFICATION DELETED
    //        ↓
    // NEW OTP
    //        ↓
    // NEW FARMER NOTIFICATION
    // =========================================================

    @Transactional
    public Delivery generateNewOtp(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "OTP regeneration is available only for outbound delivery");
        }

        if (!"ARRIVED_AT_LOCATION".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "New OTP can be generated only after partner reaches farmer location");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to generate a new OTP");
        }

        if (delivery.getOtpGeneratedAt() == null) {

            throw new RuntimeException(
                    "Previous OTP generation time is missing");
        }

        // -----------------------------------------------------
        // Check old OTP expiry
        // -----------------------------------------------------

        LocalDateTime otpExpiresAt =
                delivery.getOtpGeneratedAt()
                        .plusMinutes(10);

        if (LocalDateTime.now()
                .isBefore(otpExpiresAt)) {

            throw new RuntimeException(
                    "Current OTP is still valid. " +
                            "New OTP can be generated only after it expires.");
        }

        // -----------------------------------------------------
        // DELETE OLD OTP NOTIFICATION
        // -----------------------------------------------------

        if (delivery.getBooking() != null &&
                delivery.getBooking().getId() != null) {

            notificationService
                    .deleteDeliveryOtpNotifications(
                            delivery.getBooking().getId()
                    );
        }

        // -----------------------------------------------------
        // Generate new OTP
        // -----------------------------------------------------

        String newOtp = String.format(
                "%04d",
                new Random().nextInt(10000)
        );

        LocalDateTime newOtpGeneratedAt =
                LocalDateTime.now();

        // -----------------------------------------------------
        // Replace old OTP
        // -----------------------------------------------------

        delivery.setOtp(newOtp);

        delivery.setOtpVerified(false);

        delivery.setOtpGeneratedAt(
                newOtpGeneratedAt
        );

        // -----------------------------------------------------
        // Save delivery
        // -----------------------------------------------------

        Delivery savedDelivery =
                deliveryRepository.save(delivery);

        // -----------------------------------------------------
        // Send NEW OTP notification
        // -----------------------------------------------------

        if (delivery.getBooking() != null &&
                delivery.getBooking().getId() != null) {

            notificationService.createDeliveryOtpNotification(
                    delivery.getBooking().getId(),
                    newOtp,
                    newOtpGeneratedAt.plusMinutes(10)
            );
        }

        return savedDelivery;
    }

    // =========================================================
    // AUTOMATIC OTP NOTIFICATION CLEANUP
    // =========================================================
    //
    // Runs every 30 seconds.
    //
    // If OTP has expired:
    // → Delete only OTP notification
    // → Keep OTP data in Delivery
    // → Partner can generate a new OTP
    //
    // =========================================================

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void cleanupExpiredOtpNotifications() {

        LocalDateTime now = LocalDateTime.now();

        List<Delivery> deliveries =
                deliveryRepository.findAll();

        for (Delivery delivery : deliveries) {

            if (delivery == null) {
                continue;
            }

            // Only outbound delivery
            if (!"OUTBOUND".equalsIgnoreCase(
                    delivery.getDeliveryType())) {

                continue;
            }

            // OTP verification waiting state only
            if (!"ARRIVED_AT_LOCATION".equalsIgnoreCase(
                    delivery.getStatus())) {

                continue;
            }

            // OTP must exist
            if (delivery.getOtpGeneratedAt() == null) {
                continue;
            }

            // Already verified
            if (delivery.isOtpVerified()) {
                continue;
            }

            LocalDateTime expiryTime =
                    delivery.getOtpGeneratedAt()
                            .plusMinutes(10);

            // OTP expired
            if (!now.isBefore(expiryTime)) {

                if (delivery.getBooking() != null &&
                        delivery.getBooking().getId() != null) {

                    notificationService
                            .deleteDeliveryOtpNotifications(
                                    delivery.getBooking().getId()
                            );
                }
            }
        }
    }

    // =========================================================
    // VERIFY OTP
    // =========================================================

    @Transactional
    public Delivery verifyOtp(
            Long deliveryId,
            Long partnerUserId,
            String otp) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "OTP verification is required only for outbound delivery");
        }

        if (!"ARRIVED_AT_LOCATION".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "OTP can be verified only after partner reaches farmer location");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to verify this delivery OTP");
        }

        if (otp == null || otp.isBlank()) {

            throw new RuntimeException(
                    "OTP is required");
        }

        if (delivery.getOtp() == null ||
                delivery.getOtp().isBlank()) {

            throw new RuntimeException(
                    "Delivery OTP has not been generated");
        }

        if (delivery.getOtpGeneratedAt() == null) {

            throw new RuntimeException(
                    "OTP generation time is missing");
        }

        // -----------------------------------------------------
        // OTP expires after 10 minutes
        // -----------------------------------------------------

        if (LocalDateTime.now()
                .isAfter(
                        delivery.getOtpGeneratedAt()
                                .plusMinutes(10))) {

            throw new RuntimeException(
                    "OTP has expired. Please generate a new OTP.");
        }

        // -----------------------------------------------------
        // Compare OTP
        // -----------------------------------------------------

        if (!delivery.getOtp().equals(otp)) {

            throw new RuntimeException(
                    "Invalid OTP");
        }

        // -----------------------------------------------------
        // OTP VERIFIED
        // -----------------------------------------------------

        delivery.setOtpVerified(true);

        // -----------------------------------------------------
        // DELETE OTP NOTIFICATION
        // -----------------------------------------------------

        if (delivery.getBooking() != null &&
                delivery.getBooking().getId() != null) {

            notificationService
                    .deleteDeliveryOtpNotifications(
                            delivery.getBooking().getId()
                    );
        }

        return deliveryRepository.save(delivery);
    }

    // =========================================================
    // COMPLETE OUTBOUND DELIVERY
    //
    // ARRIVED_AT_LOCATION
    //        ↓
    // OTP VERIFIED
    //        ↓
    // DELIVERED
    //        ↓
    // BOOKING ACTIVE
    // =========================================================

    @Transactional
    public Delivery completeDelivery(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"OUTBOUND".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "This endpoint is only for outbound delivery");
        }

        if (!"ARRIVED_AT_LOCATION".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Delivery can be completed only after partner reaches farmer location");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this delivery");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to complete this delivery");
        }

        if (!delivery.isOtpVerified()) {

            throw new RuntimeException(
                    "Farmer OTP verification is required before completion");
        }

        delivery.setStatus("DELIVERED");

        delivery.setDeliveredAt(
                LocalDateTime.now()
        );

        // -----------------------------------------------------
        // Activate rental
        // -----------------------------------------------------

        Booking booking =
                delivery.getBooking();

        if (booking != null) {

            booking.setStatus("ACTIVE");

            bookingRepository.save(booking);
        }

        // -----------------------------------------------------
        // Make partner available
        // -----------------------------------------------------

        assignedPartner.setAvailable(true);

        deliveryPartnerRepository.save(
                assignedPartner
        );

        return deliveryRepository.save(
                delivery
        );
    }

    // =========================================================
    // COMPLETE RETURN DELIVERY
    // =========================================================

    @Transactional
    public Delivery completeReturnDelivery(
            Long deliveryId,
            Long partnerUserId) {

        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found"));

        if (!"RETURN".equalsIgnoreCase(
                delivery.getDeliveryType())) {

            throw new RuntimeException(
                    "This endpoint is only for return delivery");
        }

        if (!"OUT_FOR_DELIVERY".equalsIgnoreCase(
                delivery.getStatus())) {

            throw new RuntimeException(
                    "Return can be completed only when it is OUT_FOR_DELIVERY");
        }

        if (partnerUserId == null) {

            throw new RuntimeException(
                    "Partner user ID is required");
        }

        DeliveryPartner assignedPartner =
                delivery.getDeliveryPartner();

        if (assignedPartner == null) {

            throw new RuntimeException(
                    "No delivery partner is assigned to this return");
        }

        if (assignedPartner.getUser() == null ||
                assignedPartner.getUser().getId() == null) {

            throw new RuntimeException(
                    "Assigned delivery partner has no valid user");
        }

        if (!assignedPartner.getUser().getId()
                .equals(partnerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to complete this return");
        }

        Booking booking =
                delivery.getBooking();

        if (booking == null) {

            throw new RuntimeException(
                    "Booking information is missing");
        }

        Equipment equipment =
                booking.getEquipment();

        if (equipment == null) {

            throw new RuntimeException(
                    "Equipment information is missing");
        }

        delivery.setStatus("DELIVERED");

        delivery.setDeliveredAt(
                LocalDateTime.now()
        );

        booking.setStatus("RETURNED");

        booking.setReturnedAt(
                LocalDateTime.now()
        );

        booking.setReturnRequested(false);

        bookingRepository.save(booking);

        equipment.setAvailable(true);

        equipmentRepository.save(equipment);

        assignedPartner.setAvailable(true);

        deliveryPartnerRepository.save(
                assignedPartner
        );

        return deliveryRepository.save(
                delivery
        );
    }

    // =========================================================
    // REQUEST RETURN
    // Booking delivery address → Vendor
    // =========================================================

    @Transactional
    public Delivery requestReturn(
            Long bookingId,
            Long farmerUserId) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"));

        // =====================================================
        // FARMER USER VALIDATION
        // =====================================================

        if (farmerUserId == null) {

            throw new RuntimeException(
                    "Farmer user ID is required");
        }

        if (booking.getUser() == null ||
                booking.getUser().getId() == null) {

            throw new RuntimeException(
                    "Farmer information is missing from booking");
        }

        if (!booking.getUser().getId()
                .equals(farmerUserId)) {

            throw new RuntimeException(
                    "You are not authorized to request return for this booking");
        }

        // =====================================================
        // BOOKING STATUS VALIDATION
        // =====================================================

        if (!"ACTIVE".equalsIgnoreCase(
                booking.getStatus()) &&
                !"OVERDUE".equalsIgnoreCase(
                        booking.getStatus())) {

            throw new RuntimeException(
                    "Return can be requested only for an ACTIVE or OVERDUE rental");
        }

        // =====================================================
        // CHECK EXISTING RETURN
        // =====================================================

        if (deliveryRepository
                .existsByBookingIdAndDeliveryType(
                        bookingId,
                        "RETURN")) {

            throw new RuntimeException(
                    "Return request already exists for this booking");
        }

        // =====================================================
        // EQUIPMENT VALIDATION
        // =====================================================

        if (booking.getEquipment() == null) {

            throw new RuntimeException(
                    "Equipment information is missing");
        }

        // =====================================================
        // VENDOR VALIDATION
        // =====================================================

        if (booking.getEquipment().getVendor() == null) {

            throw new RuntimeException(
                    "Equipment vendor information is missing");
        }

        // =====================================================
        // BOOKING DELIVERY ADDRESS
        // =====================================================

        /*
         * IMPORTANT:
         *
         * Return pickup address must be the same address
         * that was selected for this booking.
         *
         * Example:
         *
         * Farmer profile address = Sangli
         * Booking delivery address = Pune
         *
         * Return:
         *
         * Pune → Vendor
         */

        if (booking.getDeliveryAddress() == null ||
                booking.getDeliveryAddress().isBlank()) {

            throw new RuntimeException(
                    "Booking delivery address is missing for return");
        }

        // =====================================================
        // VENDOR DELIVERY ADDRESS
        // =====================================================

        if (booking.getEquipment()
                .getVendor()
                .getAddress() == null ||
                booking.getEquipment()
                        .getVendor()
                        .getAddress()
                        .isBlank()) {

            throw new RuntimeException(
                    "Vendor return delivery address is missing");
        }

        // =====================================================
        // CREATE RETURN DELIVERY
        // =====================================================

        Delivery returnDelivery =
                new Delivery();

        returnDelivery.setBooking(
                booking
        );

        returnDelivery.setDeliveryType(
                "RETURN"
        );

        // =====================================================
        // RETURN PICKUP LOCATION
        // Booking-specific farmer delivery address
        // =====================================================

        returnDelivery.setPickupAddress(
                booking.getDeliveryAddress().trim()
        );

        // =====================================================
        // RETURN DESTINATION
        // Vendor address
        // =====================================================

        returnDelivery.setDeliveryAddress(
                booking.getEquipment()
                        .getVendor()
                        .getAddress()
        );

        // =====================================================
        // INITIAL RETURN STATUS
        // =====================================================

        returnDelivery.setStatus(
                "RETURN_REQUESTED"
        );

        // =====================================================
        // UPDATE BOOKING
        // =====================================================

        booking.setReturnRequested(
                true
        );

        booking.setReturnRequestedAt(
                LocalDateTime.now()
        );

        bookingRepository.save(
                booking
        );

        // =====================================================
        // SAVE RETURN DELIVERY
        // =====================================================

        return deliveryRepository.save(
                returnDelivery
        );
    }

    // =========================================================
    // GET DELIVERIES BY DELIVERY PARTNER
    // =========================================================

    public List<Delivery> getDeliveriesByPartnerUserId(
            Long partnerUserId) {

        DeliveryPartner partner =
                deliveryPartnerRepository
                        .findByUserId(partnerUserId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery partner not found"));

        if (partner.getUser() == null ||
                !"DELIVERY_PARTNER".equalsIgnoreCase(
                        partner.getUser().getRole())) {

            throw new RuntimeException(
                    "User is not a delivery partner");
        }

        return deliveryRepository
                .findByDeliveryPartnerUserId(
                        partnerUserId
                );
    }
}