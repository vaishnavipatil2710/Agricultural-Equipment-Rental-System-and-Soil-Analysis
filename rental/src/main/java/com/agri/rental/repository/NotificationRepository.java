package com.agri.rental.repository;

import com.agri.rental.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications of a particular user
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Count unread notifications
    long countByUserIdAndReadFalse(Long userId);

    // Check whether a particular notification already exists
    boolean existsByBookingIdAndType(Long bookingId, String type);

    List<Notification> findByBookingIdAndType(
            Long bookingId,
            String type
    );
    void deleteByBookingIdAndType(
            Long bookingId,
            String type
    );
}