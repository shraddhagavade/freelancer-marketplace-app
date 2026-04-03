package com.example.freelancer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FreelancerApplication {
    public static void main(String[] args) {
        SpringApplication.run(FreelancerApplication.class, args);
    }
}
