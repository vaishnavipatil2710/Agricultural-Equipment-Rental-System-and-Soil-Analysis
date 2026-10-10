
package com.agri.rental.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // BOOKING
    // ==========================================

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // ==========================================
    // DELIVERY PARTNER
    // ==========================================

    @ManyToOne
    @JoinColumn(name = "delivery_partner_id")
    private DeliveryPartner deliveryPartner;

    // ==========================================
    // PICKUP ADDRESS
    // ==========================================

    private String pickupAddress;

    // ==========================================
    // DELIVERY ADDRESS
    // ==========================================

    @Column(nullable = false)
    private String deliveryAddress;

    // ==========================================
    // DELIVERY TYPE
    // OUTBOUND or RETURN
    // ==========================================

    private String deliveryType;

    // ==========================================
    // DELIVERY STATUS
    // ==========================================

    /*
     * OUTBOUND:
     * PENDING
     * READY_FOR_DELIVERY
     * ASSIGNED
     * PICKED_UP
     * OUT_FOR_DELIVERY
     * ARRIVED_AT_LOCATION
     * DELIVERED
     * DELIVERY_FAILED
     *
     * RETURN:
     * RETURN_REQUESTED
     * READY_FOR_DELIVERY
     * ASSIGNED
     * PICKED_UP
     * OUT_FOR_DELIVERY
     * ARRIVED_AT_LOCATION
     * DELIVERED
     */

    @Column(nullable = false)
    private String status;

    // ==========================================
    // DELIVERY FAILURE DETAILS
    // ==========================================

    // Reason why delivery could not be completed
    @Column(length = 500)
    private String failureReason;

    // Date and time when delivery failed
    private LocalDateTime failedAt;

    // ==========================================
    // OTP
    // ==========================================

    private String otp;

    private boolean otpVerified = false;

    private LocalDateTime otpGeneratedAt;

    // ==========================================
    // LIVE LOCATION
    // ==========================================

    private Double currentLatitude;

    private Double currentLongitude;

    private LocalDateTime lastLocationUpdatedAt;

    // ==========================================
    // DELIVERY TIMESTAMPS
    // ==========================================

    private LocalDateTime createdAt;

    private LocalDateTime pickedUpAt;

    private LocalDateTime outForDeliveryAt;

    private LocalDateTime arrivedAt;

    private LocalDateTime deliveredAt;

    // ==========================================
    // AUTOMATIC CREATION TIME
    // ==========================================

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // ==========================================
    // ID
    // ==========================================

    public Long getId() {
        return id;
    }

    // ==========================================
    // BOOKING
    // ==========================================

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    // ==========================================
    // DELIVERY PARTNER
    // ==========================================

    public DeliveryPartner getDeliveryPartner() {
        return deliveryPartner;
    }

    public void setDeliveryPartner(DeliveryPartner deliveryPartner) {
        this.deliveryPartner = deliveryPartner;
    }

    // ==========================================
    // PICKUP ADDRESS
    // ==========================================

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    // ==========================================
    // DELIVERY ADDRESS
    // ==========================================

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    // ==========================================
    // DELIVERY TYPE
    // ==========================================

    public String getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(String deliveryType) {
        this.deliveryType = deliveryType;
    }

    // ==========================================
    // STATUS
    // ==========================================

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // ==========================================
    // FAILURE REASON
    // ==========================================

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    // ==========================================
    // FAILED AT
    // ==========================================

    public LocalDateTime getFailedAt() {
        return failedAt;
    }

    public void setFailedAt(LocalDateTime failedAt) {
        this.failedAt = failedAt;
    }

    // ==========================================
    // OTP
    // ==========================================

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    // ==========================================
    // OTP VERIFIED
    // ==========================================

    public boolean isOtpVerified() {
        return otpVerified;
    }

    public void setOtpVerified(boolean otpVerified) {
        this.otpVerified = otpVerified;
    }

    // ==========================================
    // OTP GENERATED AT
    // ==========================================

    public LocalDateTime getOtpGeneratedAt() {
        return otpGeneratedAt;
    }

    public void setOtpGeneratedAt(LocalDateTime otpGeneratedAt) {
        this.otpGeneratedAt = otpGeneratedAt;
    }

    // ==========================================
    // CURRENT LATITUDE
    // ==========================================

    public Double getCurrentLatitude() {
        return currentLatitude;
    }

    public void setCurrentLatitude(Double currentLatitude) {
        this.currentLatitude = currentLatitude;
    }

    // ==========================================
    // CURRENT LONGITUDE
    // ==========================================

    public Double getCurrentLongitude() {
        return currentLongitude;
    }

    public void setCurrentLongitude(Double currentLongitude) {
        this.currentLongitude = currentLongitude;
    }

    // ==========================================
    // LAST LOCATION UPDATED AT
    // ==========================================

    public LocalDateTime getLastLocationUpdatedAt() {
        return lastLocationUpdatedAt;
    }

    public void setLastLocationUpdatedAt(
            LocalDateTime lastLocationUpdatedAt) {
        this.lastLocationUpdatedAt = lastLocationUpdatedAt;
    }

    // ==========================================
    // CREATED AT
    // ==========================================

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // ==========================================
    // PICKED UP AT
    // ==========================================

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    // ==========================================
    // OUT FOR DELIVERY AT
    // ==========================================

    public LocalDateTime getOutForDeliveryAt() {
        return outForDeliveryAt;
    }

    public void setOutForDeliveryAt(
            LocalDateTime outForDeliveryAt) {
        this.outForDeliveryAt = outForDeliveryAt;
    }

    // ==========================================
    // ARRIVED AT
    // ==========================================

    public LocalDateTime getArrivedAt() {
        return arrivedAt;
    }

    public void setArrivedAt(LocalDateTime arrivedAt) {
        this.arrivedAt = arrivedAt;
    }

    // ==========================================
    // DELIVERED AT
    // ==========================================

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}
