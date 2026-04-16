package com.alzheimer.patientservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

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
    public MessageConverter messageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTrustedPackages("*"); // Trust events from other services
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public org.springframework.amqp.rabbit.core.RabbitAdmin rabbitAdmin(org.springframework.amqp.rabbit.connection.ConnectionFactory connectionFactory) {
        org.springframework.amqp.rabbit.core.RabbitAdmin admin = new org.springframework.amqp.rabbit.core.RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }
}
