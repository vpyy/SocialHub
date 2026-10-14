package com.socialhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * SocialHub Backend Application - Main entry point
 * 
 * Technologies:
 * - Spring Boot 3.5.x
 * - Java 21
 * - MongoDB
 * - Spring Security
 * 
 * API Base URL: http://localhost:8080/api
 * Swagger UI: http://localhost:8080/swagger-ui.html
 */
@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.socialhub.*.repository")
public class SocialHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(SocialHubApplication.class, args);
	}

}