package com.agri.rental.repository;


import com.agri.rental.domain.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    // Only show available equipment to users
    List<Equipment> findByAvailableTrue();
    // For VENDOR dashboard
    List<Equipment> findByVendorId(Long vendorId);

}


