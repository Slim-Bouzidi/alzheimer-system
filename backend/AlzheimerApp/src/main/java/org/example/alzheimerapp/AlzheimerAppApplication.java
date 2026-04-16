package org.example.alzheimerapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class AlzheimerAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlzheimerAppApplication.class, args);
    }

}
