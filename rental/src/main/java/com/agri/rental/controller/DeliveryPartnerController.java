package com.agri.rental.controller;

import com.agri.rental.domain.DeliveryPartner;
import com.agri.rental.service.DeliveryPartnerService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/delivery-partners")
@CrossOrigin(origins = "*")
public class DeliveryPartnerController {

    private final DeliveryPartnerService deliveryPartnerService;

    public DeliveryPartnerController(
            DeliveryPartnerService deliveryPartnerService) {

        this.deliveryPartnerService = deliveryPartnerService;
    }


    // =====================================================
    // CREATE DELIVERY PARTNER
    // =====================================================

    @PostMapping
    public ResponseEntity<?> createDeliveryPartner(
            @RequestParam Long userId,
            @RequestParam String vehicleNumber,
            @RequestParam String vehicleType) {

        try {

            DeliveryPartner partner =
                    deliveryPartnerService.createDeliveryPartner(
                            userId,
                            vehicleNumber,
                            vehicleType
                    );

            return ResponseEntity.ok(partner);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    // =====================================================
    // GET PARTNER BY ID
    // =====================================================

    @GetMapping("/{partnerId}")
    public ResponseEntity<?> getById(
            @PathVariable Long partnerId) {

        try {

            DeliveryPartner partner =
                    deliveryPartnerService.getById(partnerId);

            return ResponseEntity.ok(partner);

        } catch (Exception e) {

            return ResponseEntity
                    .status(404)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    // =====================================================
    // GET PARTNER BY USER ID
    // =====================================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(
            @PathVariable Long userId) {

        try {

            DeliveryPartner partner =
                    deliveryPartnerService.getByUserId(userId);

            return ResponseEntity.ok(partner);

        } catch (Exception e) {

            return ResponseEntity
                    .status(404)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    // =====================================================
    // GET AVAILABLE PARTNERS
    // =====================================================

    @GetMapping("/available")
    public ResponseEntity<?> getAvailablePartners() {

        try {

            return ResponseEntity.ok(
                    deliveryPartnerService.getAvailablePartners()
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    // =====================================================
    // GET ALL PARTNERS
    // =====================================================

    @GetMapping
    public ResponseEntity<?> getAllPartners() {

        try {

            return ResponseEntity.ok(
                    deliveryPartnerService.getAllPartners()
            );

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    // =====================================================
    // UPDATE AVAILABILITY
    // =====================================================

    @PutMapping("/{partnerId}/availability")
    public ResponseEntity<?> updateAvailability(
            @PathVariable Long partnerId,
            @RequestParam boolean available) {

        try {

            DeliveryPartner partner =
                    deliveryPartnerService.updateAvailability(
                            partnerId,
                            available
                    );

            return ResponseEntity.ok(partner);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}