package com.agri.rental.service;

import com.agri.rental.domain.*;
import com.agri.rental.repository.*;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKey;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    // =====================================================
    // CREATE BOOKING REQUEST
    // =====================================================

    @Transactional
    public Booking createBookingRequest(
            Long userId,
            Long equipmentId,
            Booking request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Equipment not found"));

        if (equipment.getVendor() != null
                && equipment.getVendor().getId().equals(userId)) {
            throw new RuntimeException(
                    "You cannot book equipment that you own.");
        }

        if (!equipment.isAvailable()) {
            throw new RuntimeException(
                    "Equipment is currently unavailable.");
        }

        if (request.getDeliveryAddress() == null
                || request.getDeliveryAddress().isBlank()) {
            throw new RuntimeException(
                    "Delivery address is required.");
        }

        if (request.getStartDateTime() == null
                || request.getEndDateTime() == null) {
            throw new RuntimeException(
                    "Start date and end date are required.");
        }

        if (!request.getEndDateTime()
                .isAfter(request.getStartDateTime())) {
            throw new RuntimeException(
                    "End time must be after start time.");
        }

        String bookingType = request.getBookingType();
        double totalAmount;

        if ("HOURLY".equalsIgnoreCase(bookingType)) {

            long minutes = java.time.Duration.between(
                    request.getStartDateTime(),
                    request.getEndDateTime()
            ).toMinutes();

            if (minutes < 30) {
                throw new RuntimeException(
                        "Minimum rental duration is 30 minutes.");
            }

            totalAmount = equipment.getPricePerHour()
                    * minutes / 60.0;

        } else if ("DAILY".equalsIgnoreCase(bookingType)) {

            long minutes = java.time.Duration.between(
                    request.getStartDateTime(),
                    request.getEndDateTime()
            ).toMinutes();

            if (minutes < 24 * 60) {
                throw new RuntimeException(
                        "Daily rental must be at least 1 day.");
            }

            long days = (minutes + 1439) / 1440;

            totalAmount = equipment.getPricePerDay() * days;

        } else {
            throw new RuntimeException(
                    "Invalid booking type. Use HOURLY or DAILY.");
        }

        request.setUser(user);
        request.setEquipment(equipment);
        request.setDeliveryAddress(
                request.getDeliveryAddress().trim());
        request.setTotalAmount(
                Math.round(totalAmount * 100.0) / 100.0);
        request.setStatus("PENDING");

        return bookingRepository.save(request);
    }

    // =====================================================
    // APPROVE BOOKING
    // =====================================================

    @Transactional
    public void approveBooking(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        Equipment equipment = booking.getEquipment();

        if (!equipment.isAvailable()) {
            throw new RuntimeException(
                    "Equipment is no longer available.");
        }

        booking.setStatus("APPROVED");
        equipment.setAvailable(false);

        equipmentRepository.save(equipment);
        bookingRepository.save(booking);
    }

    // =====================================================
    // PROCESS PAYMENT
    // =====================================================

    @Transactional
    public void processPayment(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        if ("PAID".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Booking payment has already been completed.");
        }

        if (!"APPROVED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Only approved bookings can be paid.");
        }

        booking.setStatus("PAID");
        bookingRepository.save(booking);
    }

    // =====================================================
    // REQUEST REFUND
    // =====================================================

    @Transactional
    public Booking requestRefund(
            Long bookingId,
            Long farmerUserId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        if (booking.getUser() == null
                || booking.getUser().getId() == null
                || !booking.getUser().getId().equals(farmerUserId)) {
            throw new RuntimeException(
                    "You are not authorized to request this refund.");
        }

        if (!"PAID".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Refund can be requested only for a paid booking.");
        }

        String paymentId = booking.getRazorpayPaymentId();

        if (paymentId == null || paymentId.isBlank()
                || !paymentId.trim().matches("^pay_[A-Za-z0-9]+$")) {
            throw new RuntimeException(
                    "Valid Razorpay payment ID is not available.");
        }

        List<Delivery> deliveries =
                deliveryRepository.findByBookingId(bookingId);

        boolean outboundFound = false;
        boolean deliveryFailed = false;

        for (Delivery delivery : deliveries) {
            if (delivery == null
                    || !"OUTBOUND".equalsIgnoreCase(
                    delivery.getDeliveryType())) {
                continue;
            }

            outboundFound = true;

            if ("DELIVERED".equalsIgnoreCase(
                    delivery.getStatus())) {
                throw new RuntimeException(
                        "Delivery is already completed. Refund cannot be requested.");
            }

            if ("DELIVERY_FAILED".equalsIgnoreCase(
                    delivery.getStatus())) {
                deliveryFailed = true;
            }
        }

        if (!outboundFound || !deliveryFailed) {
            throw new RuntimeException(
                    "Refund can be requested only when outbound delivery has failed.");
        }

        if ("REFUND_REQUESTED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Refund has already been requested.");
        }

        booking.setStatus("REFUND_REQUESTED");
        return bookingRepository.save(booking);
    }

    // =====================================================
    // APPROVE REFUND
    // =====================================================







    @Transactional
    public Booking approveRefund(Long bookingId, Long vendorUserId) {

        try {

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() ->
                            new RuntimeException("Booking not found"));

            if (booking.getEquipment() == null
                    || booking.getEquipment().getVendor() == null
                    || !booking.getEquipment()
                    .getVendor()
                    .getId()
                    .equals(vendorUserId)) {

                throw new RuntimeException("Unauthorized vendor");
            }

            if (!"REFUND_REQUESTED"
                    .equalsIgnoreCase(booking.getStatus())) {

                throw new RuntimeException(
                        "Booking is not in REFUND_REQUESTED status");
            }

            List<Delivery> deliveries =
                    deliveryRepository.findByBookingId(bookingId);

            boolean deliveryFailed = deliveries.stream()
                    .anyMatch(delivery ->
                            "DELIVERY_FAILED"
                                    .equalsIgnoreCase(delivery.getStatus()));

            if (!deliveryFailed) {
                throw new RuntimeException(
                        "Refund allowed only for failed delivery");
            }

            String paymentId = booking.getRazorpayPaymentId();

            if (paymentId == null
                    || paymentId.isBlank()
                    || !paymentId.startsWith("pay_")) {

                throw new RuntimeException(
                        "Valid Razorpay payment ID is missing");
            }

            Double totalAmount = booking.getTotalAmount();

            if (totalAmount == null || totalAmount <= 0) {
                throw new RuntimeException(
                        "Invalid booking amount");
            }

            long refundAmount =
                    Math.round(totalAmount * 100);

            System.out.println("===== REFUND START =====");
            System.out.println("Booking ID : " + bookingId);
            System.out.println("Payment ID : " + paymentId);
            System.out.println("Refund Amount : " + refundAmount);

            RazorpayClient client =
                    new RazorpayClient(
                            razorpayKey.trim(),
                            razorpaySecret.trim());

            com.razorpay.Payment payment =
                    client.payments.fetch(paymentId);

            String paymentStatus =
                    payment.get("status") == null
                            ? ""
                            : payment.get("status").toString();

            long paidAmount = Long.parseLong(
                    payment.get("amount").toString());

            long refundedAmount =
                    payment.get("amount_refunded") == null
                            ? 0L
                            : Long.parseLong(
                            payment.get("amount_refunded")
                                    .toString());

            System.out.println(
                    "Payment Status : " + paymentStatus);
            System.out.println(
                    "Paid Amount : " + paidAmount);
            System.out.println(
                    "Already Refunded : "
                            + refundedAmount);

            if (!"captured"
                    .equalsIgnoreCase(paymentStatus)) {

                throw new RuntimeException(
                        "Payment is not captured");
            }

            if (refundAmount >
                    (paidAmount - refundedAmount)) {

                throw new RuntimeException(
                        "Refund exceeds refundable balance");
            }

            System.out.println("Payment Response = "
                    + payment.toString());

            JSONObject refundRequest = new JSONObject();

            refundRequest.put(
                    "amount",
                    (int) refundAmount);

            refundRequest.put(
                    "speed",
                    "normal");

            System.out.println("Refund Request JSON = "
                    + refundRequest.toString());

            com.razorpay.Refund refund =
                    client.payments.refund(
                            paymentId,
                            refundRequest);

            String refundId =
                    refund.get("id") == null
                            ? ""
                            : refund.get("id").toString();

            String refundStatus =
                    refund.get("status") == null
                            ? ""
                            : refund.get("status").toString();

            System.out.println(
                    "Refund ID : " + refundId);

            System.out.println(
                    "Refund Status : " + refundStatus);

            if ("processed"
                    .equalsIgnoreCase(refundStatus)) {

                booking.setStatus("REFUNDED");

                Equipment equipment =
                        booking.getEquipment();

                if (equipment != null) {
                    equipment.setAvailable(true);
                    equipmentRepository.save(equipment);
                }

            } else if ("pending"
                    .equalsIgnoreCase(refundStatus)) {

                booking.setStatus(
                        "REFUND_PROCESSING");

            } else {

                throw new RuntimeException(
                        "Refund not confirmed. Status : "
                                + refundStatus);
            }

            return bookingRepository.save(booking);

        }  catch (com.razorpay.RazorpayException e) {

        System.err.println(
                "===== RAZORPAY REFUND ERROR =====");

        System.err.println(
                "Message : " + e.getMessage());

        e.printStackTrace();

        throw new RuntimeException(
                "Razorpay refund failed : "
                        + e.getMessage(),
                e);


        } catch (Exception e) {

            System.err.println(
                    "===== REFUND ERROR =====");

            e.printStackTrace();

            throw new RuntimeException(
                    "Refund processing failed : "
                            + e.getMessage(),
                    e);
        }
    }




    // =====================================================
    // GET USER BOOKINGS
    // =====================================================

    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    // =====================================================
    // GET VENDOR BOOKINGS
    // =====================================================

    public List<Booking> getVendorBookings(Long vendorId) {
        return bookingRepository.findByEquipmentVendorId(vendorId);
    }
}