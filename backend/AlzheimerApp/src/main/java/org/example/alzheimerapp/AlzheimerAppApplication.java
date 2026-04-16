package org.example.alzheimerapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"org.example.alzheimerapp", "com.alzheimer.supportnetwork"})
@EntityScan(basePackages = {"org.example.alzheimerapp.entities", "com.alzheimer.supportnetwork.entity"})
@EnableJpaRepositories(basePackages = {"org.example.alzheimerapp.repositories", "com.alzheimer.supportnetwork.repository"})
@EnableDiscoveryClient
@EnableScheduling
public class AlzheimerAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlzheimerAppApplication.class, args);
    }

}
