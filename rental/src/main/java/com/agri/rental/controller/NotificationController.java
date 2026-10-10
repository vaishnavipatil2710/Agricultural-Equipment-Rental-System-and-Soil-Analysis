package com.agri.rental.controller;

import com.agri.rental.domain.Notification;
import com.agri.rental.service.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }


    // =========================================================
    // GET ALL NOTIFICATIONS FOR A USER
    // =========================================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserNotifications(
            @PathVariable Long userId) {

        try {

            List<Notification> notifications =
                    notificationService
                            .getUserNotifications(userId);

            return ResponseEntity.ok(notifications);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GET UNREAD NOTIFICATION COUNT
    // =========================================================

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @PathVariable Long userId) {

        try {

            long count =
                    notificationService
                            .getUnreadCount(userId);

            return ResponseEntity.ok(
                    Map.of(
                            "unreadCount",
                            count
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // MARK SINGLE NOTIFICATION AS READ
    // =========================================================

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {

        try {

            Notification notification =
                    notificationService.markAsRead(
                            notificationId,
                            userId
                    );

            return ResponseEntity.ok(notification);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // MARK ALL NOTIFICATIONS AS READ
    // =========================================================

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(
            @PathVariable Long userId) {

        try {

            notificationService.markAllAsRead(userId);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "All notifications marked as read"
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // SEND OVERDUE REMINDER TO FARMER
    // =========================================================
    // Vendor uses this endpoint when a rental is overdue.
    //
    // Example:
    // POST
    // /api/notifications/overdue-reminder
    //
    // ?bookingId=6&vendorUserId=5
    // =========================================================

    @PostMapping("/overdue-reminder")
    public ResponseEntity<?> sendOverdueReminder(
            @RequestParam Long bookingId,
            @RequestParam Long vendorUserId) {

        try {

            Notification notification =
                    notificationService
                            .createOverdueReminder(
                                    bookingId,
                                    vendorUserId
                            );

            return ResponseEntity.ok(notification);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }
}