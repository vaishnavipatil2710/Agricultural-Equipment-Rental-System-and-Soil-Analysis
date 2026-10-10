package com.agri.rental.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Equipment equipment;

    private String bookingType; // HOURLY or DAILY

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    private Double totalAmount;

    /*
     * Booking-specific delivery address.
     *
     * This is the actual address where the farmer
     * wants the equipment to be delivered for this booking.
     *
     * Example:
     * User profile address = Sangli
     * Booking delivery address = Pune
     */
    private String deliveryAddress;

    /*
     * Booking lifecycle:
     *
     * PENDING          → Waiting for vendor approval
     * APPROVED         → Vendor approved
     * PAID             → Farmer completed payment
     * ACTIVE           → Equipment delivered and rental is active
     * OVERDUE          → Rental period expired and equipment not returned
     * RETURNED         → Equipment returned to vendor
     * CANCELLED        → Booking cancelled
     * REFUND_REQUESTED → Farmer requested refund
     * REFUNDED         → Refund successfully processed
     */
    private String status;


    // =========================================================
    // RAZORPAY PAYMENT INFORMATION
    // =========================================================

    /*
     * Razorpay payment ID generated after successful payment.
     *
     * This ID is required when processing an actual refund
     * through Razorpay.
     */
    private String razorpayPaymentId;


    // =========================================================
    // RETURN INFORMATION
    // =========================================================

    // Has farmer requested equipment return?
    private boolean returnRequested = false;

    // When farmer requested return
    private LocalDateTime returnRequestedAt;

    // When equipment was finally returned
    private LocalDateTime returnedAt;


    // =========================================================
    // OVERDUE INFORMATION
    // =========================================================

    // When booking became overdue
    private LocalDateTime overdueSince;

    // Extra charges caused by late return
    private Double extraCharges = 0.0;


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }


    public Equipment getEquipment() {
        return equipment;
    }

    public void setEquipment(Equipment equipment) {
        this.equipment = equipment;
    }


    public String getBookingType() {
        return bookingType;
    }

    public void setBookingType(String bookingType) {
        this.bookingType = bookingType;
    }


    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }


    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }


    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }


    // =========================================================
    // BOOKING DELIVERY ADDRESS
    // =========================================================

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }


    // =========================================================
    // STATUS
    // =========================================================

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


    // =========================================================
    // RAZORPAY PAYMENT ID
    // =========================================================

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }


    // =========================================================
    // RETURN REQUESTED
    // =========================================================

    public boolean isReturnRequested() {
        return returnRequested;
    }

    public void setReturnRequested(boolean returnRequested) {
        this.returnRequested = returnRequested;
    }


    // =========================================================
    // RETURN REQUESTED AT
    // =========================================================

    public LocalDateTime getReturnRequestedAt() {
        return returnRequestedAt;
    }

    public void setReturnRequestedAt(LocalDateTime returnRequestedAt) {
        this.returnRequestedAt = returnRequestedAt;
    }


    // =========================================================
    // RETURNED AT
    // =========================================================

    public LocalDateTime getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(LocalDateTime returnedAt) {
        this.returnedAt = returnedAt;
    }


    // =========================================================
    // OVERDUE SINCE
    // =========================================================

    public LocalDateTime getOverdueSince() {
        return overdueSince;
    }

    public void setOverdueSince(LocalDateTime overdueSince) {
        this.overdueSince = overdueSince;
    }


    // =========================================================
    // EXTRA CHARGES
    // =========================================================

    public Double getExtraCharges() {
        return extraCharges;
    }

    public void setExtraCharges(Double extraCharges) {
        this.extraCharges = extraCharges;
    }
}