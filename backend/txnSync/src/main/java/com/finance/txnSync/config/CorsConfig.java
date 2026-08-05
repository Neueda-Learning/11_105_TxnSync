package com.finance.txnSync.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.origins:*,}")
    private String appCorsOrigins;

    @Value("${ACTUATOR_ALLOWED_ORIGINS:http://127.0.0.1:5501,http://localhost:5501}")
    private String actuatorOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
    String[] apiOrigins = Arrays.stream(appCorsOrigins.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toArray(String[]::new);

    registry.addMapping("/api/**")
        .allowedOriginPatterns(apiOrigins)
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("*")
        .maxAge(3600);

    String[] actOrigins = Arrays.stream(actuatorOrigins.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toArray(String[]::new);

    registry.addMapping("/actuator/**")
        .allowedOriginPatterns(actOrigins)
        .allowedMethods("GET", "OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("*")
        .maxAge(3600);
    }
}

