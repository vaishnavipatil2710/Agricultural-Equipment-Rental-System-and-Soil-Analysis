package com.agri.rental.service;

import com.agri.rental.domain.SoilScan;
import com.agri.rental.repository.SoilScanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Service
public class SoilAnalysisService {

    @Autowired
    private SoilScanRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    private final String ML_API_URL = "http://localhost:5000/predict";
    private final String UPLOAD_DIR = "C:/Users/Lenovo/OneDrive/Desktop/rental/uploads/soil/";

    /**
     * ✅ Main Analysis Method
     * Now includes strict error checking for non-soil images.
     */
    public SoilScan processAndAnalyze(MultipartFile file, String username) throws Exception {
        // 1. Save the file locally
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) directory.mkdirs();

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        // 2. Prepare request for Python API
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // 3. Call Python API and capture response as a Map
        ResponseEntity<Map> response = restTemplate.postForEntity(ML_API_URL, requestEntity, Map.class);
        Map<String, Object> mlResult = response.getBody();

        if (mlResult == null) {
            throw new RuntimeException("ML API failed to return results");
        }

        // 🛑 NEW: Check for Error Status from Python (Crops/Sky Detection)
        // If Python returns "status": "error", we throw an exception to stop saving to DB.
        if ("error".equals(mlResult.get("status"))) {
            throw new RuntimeException((String) mlResult.get("message"));
        }

        // 4. Build and Save the SoilScan object only if analysis succeeded
        SoilScan scan = new SoilScan();
        scan.setUsername(username);
        scan.setImagePath(filePath.toString());
        scan.setPh(Double.valueOf(mlResult.get("ph").toString()));
        scan.setMoisture(Integer.valueOf(mlResult.get("moisture").toString()));
        scan.setNitrogen(Integer.valueOf(mlResult.get("nitrogen").toString()));
        scan.setPhosphorus(Integer.valueOf(mlResult.get("phosphorus").toString()));
        scan.setPotassium(Integer.valueOf(mlResult.get("potassium").toString()));
        scan.setScanDate(LocalDateTime.now());

        return repository.save(scan);
    }

    /**
     * ✅ Link Guest Report to User
     */
    public void linkReportToUser(Long reportId, String mobile) {
        SoilScan scan = repository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Soil report not found with ID: " + reportId));

        scan.setUsername(mobile);
        repository.save(scan);
    }

    public SoilScan getScanById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with ID: " + id));
    }
}