package com.agri.rental.controller;

import com.agri.rental.domain.SoilScan;
import com.agri.rental.service.SoilAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/soil")
@CrossOrigin(origins = "*")
public class SoilAnalysisController {

    @Autowired
    private SoilAnalysisService analysisService;

    @PostMapping("/analyze")
    public ResponseEntity<SoilScan> analyzeSoil(
            @RequestParam("soilImage") MultipartFile file,
            @RequestParam("username") String username) throws Exception {

        SoilScan result = analysisService.processAndAnalyze(file, username);
        return ResponseEntity.ok(result);
    }

    // --- NEW ENDPOINT: Fetch specific report ---
    @GetMapping("/report/{id}")
    public ResponseEntity<SoilScan> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getScanById(id));
    }

    /**
     * ✅ NEW ENDPOINT: Link Guest Report to Logged-in User
     * This is called by login.js after a successful login.
     */
    @PostMapping("/link-report")
    public ResponseEntity<String> linkReport(@RequestParam Long reportId, @RequestParam String mobile) {
        analysisService.linkReportToUser(reportId, mobile);
        return ResponseEntity.ok("Report linked successfully to mobile: " + mobile);
    }
}