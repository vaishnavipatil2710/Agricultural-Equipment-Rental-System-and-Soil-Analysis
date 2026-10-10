package com.agri.rental.repository;

import com.agri.rental.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByEquipmentVendorId(Long vendorId);

    boolean existsByUserIdAndEquipmentIdAndStatus(
            Long userId,
            Long equipmentId,
            String status
    );

    // Finds ACTIVE bookings whose rental time has ended
    List<Booking> findByStatusAndEndDateTimeLessThanEqual(
            String status,
            LocalDateTime currentTime
    );

    // Finds all bookings having a particular status
    List<Booking> findByStatus(String status);
}