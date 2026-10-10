package com.agri.rental.repository;

import com.agri.rental.domain.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    // Find a specific type of delivery for a booking
    Optional<Delivery> findByBookingIdAndDeliveryType(
            Long bookingId,
            String deliveryType
    );

    // Check whether a specific delivery type already exists
    boolean existsByBookingIdAndDeliveryType(
            Long bookingId,
            String deliveryType
    );

    // Get all deliveries for a booking
    List<Delivery> findByBookingId(Long bookingId);

    // Get deliveries assigned to a delivery partner
    List<Delivery> findByDeliveryPartnerUserId(Long userId);
}