package com.agri.rental.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "users", uniqueConstraints = {
        // This allows the same mobile for different roles
        @UniqueConstraint(name = "UK_mobile_role", columnNames = {"mobile", "role"}),
        // This allows the same aadhaar for different roles
        @UniqueConstraint(name = "UK_aadhaar_role", columnNames = {"aadhaar", "role"})
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    // ✅ unique=true is removed to allow composite constraint to work
    @Column(nullable = false)
    private String mobile;

    // ✅ unique=true is removed to allow composite constraint to work
    @Column(nullable = false, length = 12)
    private String aadhaar;

    @Column(nullable = false)
    private String role; // USER or VENDOR

    // 🔹 No-arg constructor (Required by JPA)
    public User() {
    }

    // 🔹 Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // Helpful for debugging logs
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}