package com.agri.rental.service;

import com.agri.rental.domain.DeliveryPartner;
import com.agri.rental.domain.User;
import com.agri.rental.repository.DeliveryPartnerRepository;
import com.agri.rental.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;

    // Constructor Injection
    public UserService(
            UserRepository userRepository,
            DeliveryPartnerRepository deliveryPartnerRepository) {

        this.userRepository = userRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
    }

    /*
     * =========================================================
     * REGISTRATION
     * =========================================================
     *
     * USER              -> Create User
     * VENDOR            -> Create User
     * DELIVERY_PARTNER  -> Create User + DeliveryPartner
     *
     * Same Aadhaar/Mobile can be used for different roles.
     */
    @Transactional
    public User register(User user) {

        // =====================================================
        // Aadhaar + Role validation
        // =====================================================

        if (userRepository.existsByAadhaarAndRole(
                user.getAadhaar(),
                user.getRole())) {

            throw new RuntimeException(
                    "This Aadhaar is already registered as a "
                            + user.getRole());
        }

        // =====================================================
        // Mobile + Role validation
        // =====================================================

        if (userRepository.existsByMobileAndRole(
                user.getMobile(),
                user.getRole())) {

            throw new RuntimeException(
                    "This Mobile number is already registered as a "
                            + user.getRole());
        }

        // =====================================================
        // Save User first
        // =====================================================

        User savedUser = userRepository.save(user);

        // =====================================================
        // If role is DELIVERY_PARTNER
        // create DeliveryPartner record
        // =====================================================

        if ("DELIVERY_PARTNER".equalsIgnoreCase(user.getRole())) {

            DeliveryPartner deliveryPartner = new DeliveryPartner();

            // Link DeliveryPartner with registered User
            deliveryPartner.setUser(savedUser);

            // Temporary vehicle details
            // These can be updated later from Delivery Partner profile
            deliveryPartner.setVehicleNumber("Not Provided");
            deliveryPartner.setVehicleType("Not Assigned");

            // Newly registered partner is available
            deliveryPartner.setAvailable(true);

            deliveryPartnerRepository.save(deliveryPartner);
        }

        return savedUser;
    }

    /*
     * =========================================================
     * LOGIN
     * =========================================================
     *
     * Finds account using:
     * Mobile + Aadhaar + Role
     */
    public User login(
            String mobile,
            String aadhaar,
            String role) {

        return userRepository
                .findByMobileAndAadhaarAndRole(
                        mobile,
                        aadhaar,
                        role)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid credentials for the selected role"));
    }
}