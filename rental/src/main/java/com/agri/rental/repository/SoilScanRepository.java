package com.agri.rental.repository;


import com.agri.rental.domain.SoilScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SoilScanRepository extends JpaRepository<SoilScan, Long> {
    // Inherits CRUD operations for SoilScan domain objects
}
