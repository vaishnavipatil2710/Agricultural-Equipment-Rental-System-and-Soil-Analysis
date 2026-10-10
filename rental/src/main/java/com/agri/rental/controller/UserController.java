package com.agri.rental.controller;

import com.agri.rental.domain.User;
import com.agri.rental.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://127.0.0.1:5500") // Ensure this matches your frontend URL
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register API
     * The User object now contains the 'role' selected during registration.
     */
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }

    /**
     * Login API
     * Now extracts 'role' to distinguish between different accounts sharing
     * the same mobile and aadhaar.
     */
    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> data) {
        return userService.login(
                data.get("mobile"),
                data.get("aadhaar"),
                data.get("role") // ✅ Pass the role from the frontend dropdown
        );
    }
}