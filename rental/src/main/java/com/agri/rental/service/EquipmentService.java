package com.agri.rental.service;

import com.agri.rental.domain.Equipment;
import com.agri.rental.domain.User;
import com.agri.rental.repository.EquipmentRepository;
import com.agri.rental.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public EquipmentService(EquipmentRepository equipmentRepository, UserRepository userRepository) {
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
    }

    // ✅ READ: Fetch single item
    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found with ID: " + id));
    }

    // ✅ READ: For Farmer Dashboard (Available only)
    public List<Equipment> getAvailableEquipment() {
        return equipmentRepository.findByAvailableTrue();
    }

    // ✅ READ: For Vendor Dashboard
    public List<Equipment> getEquipmentByVendor(Long vendorId) {
        return equipmentRepository.findByVendorId(vendorId);
    }

    // ✅ CREATE: Linked to Vendor and ensures Image is present
    public Equipment saveEquipment(Equipment equipment, Long vendorId) {
        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found with ID: " + vendorId));

        equipment.setVendor(vendor);
        equipment.setAvailable(true); // Default to available on add

        if (equipment.getImageUrl() == null || equipment.getImageUrl().isBlank()) {
            throw new RuntimeException("Real-time image path is required for listing.");
        }

        return equipmentRepository.save(equipment);
    }

    // ✅ UPDATE: Handles field updates without losing image path
    public Equipment updateEquipment(Long id, Equipment updatedDetails) {
        Equipment existingEquipment = getEquipmentById(id);

        existingEquipment.setName(updatedDetails.getName());
        existingEquipment.setDescription(updatedDetails.getDescription());
        existingEquipment.setPricePerDay(updatedDetails.getPricePerDay());

        // Update quantity if you added that field to the domain
        existingEquipment.setQuantity(updatedDetails.getQuantity());

        // Only update image path if a new local upload path is provided
        if (updatedDetails.getImageUrl() != null && !updatedDetails.getImageUrl().isBlank()) {
            existingEquipment.setImageUrl(updatedDetails.getImageUrl());
        }

        return equipmentRepository.save(existingEquipment);
    }

    // ✅ DELETE: Database record + Physical File Cleanup
    public void deleteEquipment(Long id) {
        Equipment equipment = getEquipmentById(id);
        String imageUrl = equipment.getImageUrl();

        // Check if image is local (contains /uploads/) and delete physical file
        if (imageUrl != null && imageUrl.contains("/uploads/")) {
            try {
                // Extract filename from the URL (e.g., 170487..._tractor.jpg)
                String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                Path filePath = Paths.get("uploads/" + fileName);
                File file = filePath.toFile();

                if (file.exists()) {
                    boolean deleted = file.delete();
                    if (deleted) {
                        System.out.println("Physical file deleted: " + fileName);
                    }
                }
            } catch (Exception e) {
                // We log the error but still delete the DB record to avoid stuck data
                System.err.println("Cleanup Error (File might be in use): " + e.getMessage());
            }
        }
        equipmentRepository.deleteById(id);
    }
}