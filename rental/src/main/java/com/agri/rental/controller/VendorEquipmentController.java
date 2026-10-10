package com.agri.rental.controller;

import com.agri.rental.domain.Equipment;
import com.agri.rental.service.EquipmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendor/equipment")
@CrossOrigin(origins = "*")
public class VendorEquipmentController {

    private final EquipmentService equipmentService;


    public VendorEquipmentController(
            EquipmentService equipmentService) {

        this.equipmentService = equipmentService;
    }


    // =========================================================
    // CREATE NEW EQUIPMENT
    // =========================================================
    //
    // POST:
    // /api/vendor/equipment/upload/{vendorId}
    //
    // =========================================================

    @PostMapping("/upload/{vendorId}")
    public ResponseEntity<?> uploadEquipment(

            @RequestParam("file")
            MultipartFile file,

            @RequestParam("name")
            String name,

            @RequestParam("description")
            String description,

            @RequestParam("pricePerHour")
            Double pricePerHour,

            @RequestParam("pricePerDay")
            Double pricePerDay,

            @RequestParam("quantity")
            Integer quantity,

            @PathVariable Long vendorId) {

        try {

            // -------------------------------------------------
            // VALIDATE PRICES
            // -------------------------------------------------

            if (pricePerHour == null || pricePerHour <= 0) {

                return ResponseEntity.badRequest()
                        .body("Price per hour must be greater than 0.");
            }

            if (pricePerDay == null || pricePerDay <= 0) {

                return ResponseEntity.badRequest()
                        .body("Price per day must be greater than 0.");
            }


            // -------------------------------------------------
            // SAVE IMAGE
            // -------------------------------------------------

            String imageUrl = saveFile(file);


            // -------------------------------------------------
            // CREATE EQUIPMENT
            // -------------------------------------------------

            Equipment equipment = new Equipment();

            equipment.setName(name);

            equipment.setDescription(description);

            // IMPORTANT
            // Save BOTH hourly and daily prices.
            equipment.setPricePerHour(pricePerHour);

            equipment.setPricePerDay(pricePerDay);

            equipment.setQuantity(quantity);

            equipment.setImageUrl(imageUrl);


            // -------------------------------------------------
            // SAVE THROUGH SERVICE
            // -------------------------------------------------

            Equipment saved =
                    equipmentService.saveEquipment(
                            equipment,
                            vendorId
                    );


            return ResponseEntity.ok(saved);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Upload failed: "
                                    + e.getMessage()
                    );
        }
    }


    // =========================================================
    // UPDATE EXISTING EQUIPMENT
    // =========================================================
    //
    // PUT:
    // /api/vendor/equipment/upload/{id}
    //
    // =========================================================

    @PutMapping("/upload/{id}")
    public ResponseEntity<?> updateEquipment(

            @PathVariable Long id,

            @RequestParam(
                    value = "file",
                    required = false
            )
            MultipartFile file,

            @RequestParam("name")
            String name,

            @RequestParam("description")
            String description,

            @RequestParam("pricePerHour")
            Double pricePerHour,

            @RequestParam("pricePerDay")
            Double pricePerDay,

            @RequestParam("quantity")
            Integer quantity) {

        try {

            // -------------------------------------------------
            // VALIDATE PRICES
            // -------------------------------------------------

            if (pricePerHour == null || pricePerHour <= 0) {

                return ResponseEntity.badRequest()
                        .body("Price per hour must be greater than 0.");
            }

            if (pricePerDay == null || pricePerDay <= 0) {

                return ResponseEntity.badRequest()
                        .body("Price per day must be greater than 0.");
            }


            // -------------------------------------------------
            // GET EXISTING EQUIPMENT
            // -------------------------------------------------

            Equipment existing =
                    equipmentService.getEquipmentById(id);


            // -------------------------------------------------
            // UPDATE DETAILS
            // -------------------------------------------------

            existing.setName(name);

            existing.setDescription(description);

            existing.setPricePerHour(pricePerHour);

            existing.setPricePerDay(pricePerDay);

            existing.setQuantity(quantity);


            // -------------------------------------------------
            // UPDATE IMAGE ONLY IF NEW IMAGE PROVIDED
            // -------------------------------------------------

            if (file != null && !file.isEmpty()) {

                String newImageUrl =
                        saveFile(file);

                existing.setImageUrl(
                        newImageUrl
                );
            }


            // -------------------------------------------------
            // SAVE UPDATED EQUIPMENT
            // -------------------------------------------------

            Equipment updated =
                    equipmentService.updateEquipment(
                            id,
                            existing
                    );


            return ResponseEntity.ok(updated);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Update failed: "
                                    + e.getMessage()
                    );
        }
    }


    // =========================================================
    // SAVE IMAGE FILE
    // =========================================================

    private String saveFile(
            MultipartFile file) throws Exception {

        if (file == null || file.isEmpty()) {

            throw new RuntimeException(
                    "Equipment image is required."
            );
        }


        String uploadDir = "uploads/";

        File dir = new File(uploadDir);

        if (!dir.exists()) {
            dir.mkdirs();
        }


        String fileName =
                System.currentTimeMillis()
                        + "_"
                        + file.getOriginalFilename();


        Path path =
                Paths.get(
                        uploadDir + fileName
                );


        Files.copy(
                file.getInputStream(),
                path,
                StandardCopyOption.REPLACE_EXISTING
        );


        return
                "http://localhost:8080/uploads/"
                        + fileName;
    }


    // =========================================================
    // GET ALL EQUIPMENT OF VENDOR
    // =========================================================

    @GetMapping("/list/{vendorId}")
    public ResponseEntity<List<Equipment>>
    getEquipmentByVendor(
            @PathVariable Long vendorId) {

        return ResponseEntity.ok(
                equipmentService
                        .getEquipmentByVendor(vendorId)
        );
    }


    // =========================================================
    // GET EQUIPMENT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Equipment>
    getEquipmentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                equipmentService
                        .getEquipmentById(id)
        );
    }


    // =========================================================
    // DELETE EQUIPMENT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteEquipment(
            @PathVariable Long id) {

        equipmentService.deleteEquipment(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}