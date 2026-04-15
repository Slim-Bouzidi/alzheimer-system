package com.alzheimer.patientservice.config;

import org.springframework.context.annotation.Configuration;
<<<<<<< HEAD
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
=======
import org.springframework.http.HttpMethod;
>>>>>>> cb099be (user ui update)
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

<<<<<<< HEAD

=======
>>>>>>> cb099be (user ui update)
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .authorizeRequests()
                .antMatchers("/public/**").permitAll()
<<<<<<< HEAD
=======
                .antMatchers(HttpMethod.POST, "/api/patients").permitAll() // Allow User Service to create patients
>>>>>>> cb099be (user ui update)
                .anyRequest().authenticated()
                .and()
                .oauth2ResourceServer()
                .jwt();
    }
}
