package com.agri.rental.repository;

import com.agri.rental.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ Find specific account by Mobile, Aadhaar, and Role
    Optional<User> findByMobileAndAadhaarAndRole(String mobile, String aadhaar, String role);

    // ✅ Check if a specific role already exists for this Mobile
    boolean existsByMobileAndRole(String mobile, String role);

    // ✅ Check if a specific role already exists for this Aadhaar
    boolean existsByAadhaarAndRole(String aadhaar, String role);

    // Keep this if you need it for general searches
    Optional<User> findByMobile(String mobile);
}


