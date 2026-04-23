package com.alzheimer.gestionlivreur;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class GestionLivreurApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionLivreurApplication.class, args);
    }
}
