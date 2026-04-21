package com.alzheimer.cognitiveservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "cognitive-exchange";
    public static final String QUEUE = "cognitive-queue";
    public static final String ROUTING_KEY = "activity.completed";

    // ── Decline Alert routing ──
    public static final String ALERT_QUEUE = "cognitive-alert-queue";
    public static final String ALERT_ROUTING_KEY = "alert.decline.*";

    @Bean
    public Queue queue() {
        return new Queue(QUEUE);
    }

    @Bean
    public Queue alertQueue() {
        return new Queue(ALERT_QUEUE);
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Binding binding(Queue queue, TopicExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
    }

    @Bean
    public Binding alertBinding() {
        return BindingBuilder.bind(alertQueue()).to(exchange()).with(ALERT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }
}
