package com.agri.rental.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "delivery_partners")
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Existing user account
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Vehicle details
    @Column(nullable = false)
    private String vehicleNumber;

    @Column(nullable = false)
    private String vehicleType;

    // true = can receive a delivery
    // false = currently busy
    @Column(nullable = false)
    private boolean available = true;


    // =========================
    // ID
    // =========================

    public Long getId() {
        return id;
    }


    // =========================
    // USER
    // =========================

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }


    // =========================
    // VEHICLE NUMBER
    // =========================

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }


    // =========================
    // VEHICLE TYPE
    // =========================

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }


    // =========================
    // AVAILABILITY
    // =========================

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}