package com.agri.rental.controller;

import com.agri.rental.domain.Booking;
import com.agri.rental.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;


    // =========================================================
    // CREATE BOOKING REQUEST
    // =========================================================

    // POST
    // http://localhost:8080/api/bookings/request
    // ?userId=1&equipmentId=2

    @PostMapping("/request")
    public ResponseEntity<?> request(
            @RequestParam Long userId,
            @RequestParam Long equipmentId,
            @RequestBody Booking b) {

        try {

            return ResponseEntity.ok(
                    bookingService.createBookingRequest(
                            userId,
                            equipmentId,
                            b
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // APPROVE BOOKING
    // =========================================================

    // PUT
    // http://localhost:8080/api/bookings/confirm/123

    @PutMapping("/confirm/{id}")
    public ResponseEntity<?> approve(
            @PathVariable("id") Long id) {

        try {

            bookingService.approveBooking(id);

            return ResponseEntity
                    .ok()
                    .build();

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // PROCESS PAYMENT
    // =========================================================

    // PUT
    // http://localhost:8080/api/bookings/pay/123

    @PutMapping("/pay/{id}")
    public ResponseEntity<?> pay(
            @PathVariable("id") Long id) {

        try {

            bookingService.processPayment(id);

            return ResponseEntity
                    .ok()
                    .build();

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // REQUEST REFUND
    // =========================================================
    // Farmer requests refund when delivery was not completed.
    //
    // POST
    // http://localhost:8080/api/bookings/123/refund
    // ?userId=1
    // =========================================================

    @PostMapping("/{id}/refund")
    public ResponseEntity<?> requestRefund(
            @PathVariable("id") Long id,
            @RequestParam Long userId) {

        try {

            Booking booking =
                    bookingService.requestRefund(
                            id,
                            userId
                    );

            return ResponseEntity.ok(
                    booking
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // APPROVE REFUND
    // =========================================================
    // Vendor approves farmer's refund request.
    //
    // PUT
    // http://localhost:8080/api/bookings/123/refund/approve
    // ?vendorUserId=5
    //
    // Flow:
    //
    // REFUND_REQUESTED
    //        ↓
    // Vendor approves
    //        ↓
    // Razorpay refund
    //        ↓
    // REFUNDED
    // =========================================================

    @PutMapping("/{id}/refund/approve")
    public ResponseEntity<?> approveRefund(
            @PathVariable("id") Long id,
            @RequestParam Long vendorUserId) {

        try {

            Booking booking =
                    bookingService.approveRefund(
                            id,
                            vendorUserId
                    );

            return ResponseEntity.ok(
                    booking
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // GET USER BOOKINGS
    // =========================================================

    @GetMapping("/user/{userId}")
    public List<Booking> getUserBookings(
            @PathVariable Long userId) {

        return bookingService.getUserBookings(
                userId
        );
    }


    // =========================================================
    // GET VENDOR BOOKINGS
    // =========================================================

    @GetMapping("/vendor/{vendorId}")
    public List<Booking> getVendorBookings(
            @PathVariable Long vendorId) {

        return bookingService.getVendorBookings(
                vendorId
        );
    }
}