package com.agri.rental.controller;

import com.agri.rental.domain.Delivery;
import com.agri.rental.service.DeliveryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
@CrossOrigin(origins = "*")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }


    // =========================================================
    // CREATE OUTBOUND DELIVERY
    // Vendor → Farmer
    // =========================================================

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<?> createDelivery(
            @PathVariable Long bookingId) {

        try {

            Delivery delivery =
                    deliveryService.createDelivery(bookingId);

            return ResponseEntity.ok(delivery);

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GET OUTBOUND DELIVERY BY BOOKING ID
    // =========================================================

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getByBookingId(
            @PathVariable Long bookingId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.getByBookingId(bookingId)
            );

        } catch (Exception e) {

            return ResponseEntity.status(404)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GET ALL DELIVERIES BY BOOKING ID
    // Includes OUTBOUND and RETURN
    // =========================================================

    @GetMapping("/booking/{bookingId}/all")
    public ResponseEntity<?> getAllByBookingId(
            @PathVariable Long bookingId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.getDeliveriesByBookingId(
                            bookingId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.status(404)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GET DELIVERY BY DELIVERY ID
    // =========================================================

    @GetMapping("/{deliveryId}")
    public ResponseEntity<?> getById(
            @PathVariable Long deliveryId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.getById(deliveryId)
            );

        } catch (Exception e) {

            return ResponseEntity.status(404)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // MARK DELIVERY READY
    // Vendor operation
    // =========================================================

    @PutMapping("/{deliveryId}/ready")
    public ResponseEntity<?> markReady(
            @PathVariable Long deliveryId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.markReady(deliveryId)
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // ASSIGN DELIVERY PARTNER
    // Vendor operation
    // =========================================================

    @PutMapping("/{deliveryId}/assign/{partnerId}")
    public ResponseEntity<?> assignPartner(
            @PathVariable Long deliveryId,
            @PathVariable Long partnerId,
            @RequestParam Long vendorUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.assignPartner(
                            deliveryId,
                            partnerId,
                            vendorUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // PICKUP EQUIPMENT
    // Delivery partner operation
    // =========================================================

    @PutMapping("/{deliveryId}/pickup")
    public ResponseEntity<?> pickupEquipment(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.pickupEquipment(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // START DELIVERY
    // Delivery partner operation
    //
    // PICKED_UP
    //      ↓
    // OUT_FOR_DELIVERY
    //
    // OTP is NOT generated here.
    // OTP is generated when partner ARRIVES.
    // =========================================================

    @PutMapping("/{deliveryId}/start")
    public ResponseEntity<?> startDelivery(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.startDelivery(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }





    // =========================================================
    // REPORT UNABLE TO DELIVER
    // Delivery partner operation
    // =========================================================

    @PutMapping("/{deliveryId}/unable-to-deliver")
    public ResponseEntity<?> reportDeliveryFailure(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId,
            @RequestParam String reason) {

        try {

            return ResponseEntity.ok(
                    deliveryService.reportDeliveryFailure(
                            deliveryId,
                            partnerUserId,
                            reason
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================================================
    // UPDATE LIVE LOCATION
    // Delivery partner operation
    //
    // Example:
    // PUT /api/deliveries/15/location
    // ?partnerUserId=10
    // &latitude=16.7050
    // &longitude=74.2433
    // =========================================================

    @PutMapping("/{deliveryId}/location")
    public ResponseEntity<?> updateLocation(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {

        try {

            return ResponseEntity.ok(
                    deliveryService.updateLocation(
                            deliveryId,
                            partnerUserId,
                            latitude,
                            longitude
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // ARRIVE AT FARMER LOCATION
    // Delivery partner operation
    //
    // OUT_FOR_DELIVERY
    //        ↓
    // ARRIVED_AT_LOCATION
    //        ↓
    // OTP GENERATED
    //        ↓
    // FARMER GETS NOTIFICATION
    // =========================================================

    @PutMapping("/{deliveryId}/arrived")
    public ResponseEntity<?> arriveAtLocation(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.arriveAtLocation(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GENERATE NEW OTP
    // Delivery partner operation
    //
    // Previous OTP:
    // 10 minutes → EXPIRED
    //
    // Then:
    // Generate new OTP
    //        ↓
    // Farmer gets new notification
    // =========================================================

    @PostMapping("/{deliveryId}/generate-new-otp")
    public ResponseEntity<?> generateNewOtp(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.generateNewOtp(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // VERIFY OTP
    // Delivery partner operation
    //
    // Only OUTBOUND delivery uses OTP.
    //
    // OTP can be verified only after
    // partner reaches farmer location.
    // =========================================================

    @PostMapping("/{deliveryId}/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId,
            @RequestParam String otp) {

        try {

            return ResponseEntity.ok(
                    deliveryService.verifyOtp(
                            deliveryId,
                            partnerUserId,
                            otp
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // COMPLETE OUTBOUND DELIVERY
    // Delivery partner operation
    //
    // Farmer OTP must be verified first.
    //
    // ARRIVED_AT_LOCATION
    //        ↓
    // OTP VERIFIED
    //        ↓
    // DELIVERED
    //        ↓
    // BOOKING ACTIVE
    // =========================================================

    @PutMapping("/{deliveryId}/delivered")
    public ResponseEntity<?> completeDelivery(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.completeDelivery(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // COMPLETE RETURN DELIVERY
    // Delivery partner operation
    //
    // RETURN:
    // OUT_FOR_DELIVERY
    //       ↓
    // DELIVERED
    //
    // Booking → RETURNED
    // Equipment → AVAILABLE
    // Partner → AVAILABLE
    //
    // Example:
    // PUT /api/deliveries/15/return-complete?partnerUserId=10
    // =========================================================

    @PutMapping("/{deliveryId}/return-complete")
    public ResponseEntity<?> completeReturnDelivery(
            @PathVariable Long deliveryId,
            @RequestParam Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.completeReturnDelivery(
                            deliveryId,
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // GET DELIVERIES FOR DELIVERY PARTNER
    // =========================================================

    @GetMapping("/partner/{partnerUserId}")
    public ResponseEntity<?> getPartnerDeliveries(
            @PathVariable Long partnerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.getDeliveriesByPartnerUserId(
                            partnerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // =========================================================
    // REQUEST RETURN PICKUP
    // Farmer operation
    //
    // Farmer requests vendor to collect
    // rented equipment.
    //
    // Example:
    // POST /api/deliveries/return/5?farmerUserId=10
    // =========================================================

    @PostMapping("/return/{bookingId}")
    public ResponseEntity<?> requestReturn(
            @PathVariable Long bookingId,
            @RequestParam Long farmerUserId) {

        try {

            return ResponseEntity.ok(
                    deliveryService.requestReturn(
                            bookingId,
                            farmerUserId
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }
}