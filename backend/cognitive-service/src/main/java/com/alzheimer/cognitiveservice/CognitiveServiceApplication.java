package com.alzheimer.cognitiveservice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableEurekaClient
@Slf4j
public class CognitiveServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CognitiveServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner init(RabbitTemplate rabbitTemplate) {
        return args -> {
            log.info("========================================");
            log.info("Cognitive Service is UP and Running!");
            try {
                log.info("Testing RabbitMQ connection...");
                rabbitTemplate.getConnectionFactory().createConnection();
                log.info("RabbitMQ Connection: SUCCESS");
            } catch (Exception e) {
                log.error("RabbitMQ Connection: FAILED - Is RabbitMQ running in Docker?", e);
            }
            log.info("========================================");
        };
    }
}
