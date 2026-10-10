package com.agri.rental.service;

import com.agri.rental.domain.DeliveryPartner;
import com.agri.rental.domain.User;
import com.agri.rental.repository.DeliveryPartnerRepository;
import com.agri.rental.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeliveryPartnerService {

    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final UserRepository userRepository;

    public DeliveryPartnerService(
            DeliveryPartnerRepository deliveryPartnerRepository,
            UserRepository userRepository) {

        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.userRepository = userRepository;
    }


    // =====================================================
    // CREATE DELIVERY PARTNER
    // =====================================================

    @Transactional
    public DeliveryPartner createDeliveryPartner(
            Long userId,
            String vehicleNumber,
            String vehicleType) {

        // Find existing user
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));


        // User must have DELIVERY_PARTNER role
        if (!"DELIVERY_PARTNER".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException(
                    "User does not have DELIVERY_PARTNER role");
        }


        // Check whether this user is already a delivery partner
        if (deliveryPartnerRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException(
                    "This user is already registered as a delivery partner");
        }


        // Validate vehicle number
        if (vehicleNumber == null ||
                vehicleNumber.isBlank()) {

            throw new RuntimeException(
                    "Vehicle number is required");
        }


        // Validate vehicle type
        if (vehicleType == null ||
                vehicleType.isBlank()) {

            throw new RuntimeException(
                    "Vehicle type is required");
        }


        // Create delivery partner
        DeliveryPartner partner = new DeliveryPartner();

        partner.setUser(user);
        partner.setVehicleNumber(vehicleNumber);
        partner.setVehicleType(vehicleType);

        // New partner is available
        partner.setAvailable(true);

        return deliveryPartnerRepository.save(partner);
    }


    // =====================================================
    // GET DELIVERY PARTNER BY ID
    // =====================================================

    public DeliveryPartner getById(Long partnerId) {

        return deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Delivery partner not found"));
    }


    // =====================================================
    // GET DELIVERY PARTNER BY USER ID
    // =====================================================

    public DeliveryPartner getByUserId(Long userId) {

        return deliveryPartnerRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Delivery partner not found for this user"));
    }


    // =====================================================
    // GET ALL AVAILABLE DELIVERY PARTNERS
    // =====================================================

    public List<DeliveryPartner> getAvailablePartners() {

        return deliveryPartnerRepository
                .findByAvailableTrue();
    }


    // =====================================================
    // GET ALL DELIVERY PARTNERS
    // =====================================================

    public List<DeliveryPartner> getAllPartners() {

        return deliveryPartnerRepository.findAll();
    }


    // =====================================================
    // CHANGE AVAILABILITY
    // =====================================================

    @Transactional
    public DeliveryPartner updateAvailability(
            Long partnerId,
            boolean available) {

        DeliveryPartner partner = getById(partnerId);

        partner.setAvailable(available);

        return deliveryPartnerRepository.save(partner);
    }
}