package com.alzheimer.supportnetwork.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Dedicated {@link RestTemplate} for Brevo HTTP calls (timeouts, tests can replace bean if needed).
 */
@Configuration
public class BrevoHttpClientConfig {

    @Bean(name = "brevoRestTemplate")
    public RestTemplate brevoRestTemplate(
            @Value("${brevo.http.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${brevo.http.read-timeout-ms:10000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Math.max(connectTimeoutMs, 1000));
        factory.setReadTimeout(Math.max(readTimeoutMs, 1000));
        return new RestTemplate(factory);
    }
}
