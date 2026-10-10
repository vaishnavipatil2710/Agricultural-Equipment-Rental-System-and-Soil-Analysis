package com.agri.rental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;


@EnableScheduling
@SpringBootApplication
public class RentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalApplication.class, args);
    }

    /**
     * REST TEMPLATE BEAN
     *
     * This allows the SoilAnalysisService to communicate
     * with the Python ML API on port 5000.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}