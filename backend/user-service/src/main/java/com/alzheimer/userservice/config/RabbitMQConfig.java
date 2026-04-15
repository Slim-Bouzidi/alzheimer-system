package com.alzheimer.userservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;
import javax.annotation.PostConstruct;

@Configuration
@Slf4j
public class RabbitMQConfig {
    
    @PostConstruct
    public void init() {
        log.info("RabbitMQ Configuration initialized for User Service");
    }

    public static final String EXCHANGE = "user.exchange";
    public static final String QUEUE_PATIENT = "user.patient.queue";
    public static final String ROUTING_KEY_PATIENT = "user.created.patient";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue patientQueue() {
        return new Queue(QUEUE_PATIENT);
    }

    @Bean
    public Binding patientBinding(Queue patientQueue, TopicExchange exchange) {
        return BindingBuilder.bind(patientQueue).to(exchange).with(ROUTING_KEY_PATIENT);
    }

    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }
}
