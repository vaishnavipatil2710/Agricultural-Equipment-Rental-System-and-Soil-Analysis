package com.agri.rental.domain;



import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a Soil Health Analysis record in the database.
 */
@Entity
@Table(name = "soil_scans")
public class SoilScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // To track which farmer performed the scan
    @Column(nullable = false)
    private String username;

    // Automatically store the date and time of the analysis
    @Column(nullable = false)
    private LocalDateTime scanDate;

    // Stores the filename or path of the uploaded soil image
    private String imagePath;

    // --- ML Analysis Result Fields ---

    private Double ph;

    private Integer moisture;

    private Integer nitrogen; // N

    private Integer phosphorus; // P

    private Integer potassium; // K

    // Constructor
    public SoilScan() {
        this.scanDate = LocalDateTime.now();
    }

    // Standard Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public LocalDateTime getScanDate() { return scanDate; }
    public void setScanDate(LocalDateTime scanDate) { this.scanDate = scanDate; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public Double getPh() { return ph; }
    public void setPh(Double ph) { this.ph = ph; }

    public Integer getMoisture() { return moisture; }
    public void setMoisture(Integer moisture) { this.moisture = moisture; }

    public Integer getNitrogen() { return nitrogen; }
    public void setNitrogen(Integer nitrogen) { this.nitrogen = nitrogen; }

    public Integer getPhosphorus() { return phosphorus; }
    public void setPhosphorus(Integer phosphorus) { this.phosphorus = phosphorus; }

    public Integer getPotassium() { return potassium; }
    public void setPotassium(Integer potassium) { this.potassium = potassium; }
}

