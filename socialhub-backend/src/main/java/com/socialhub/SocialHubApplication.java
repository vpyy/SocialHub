package com.socialhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * SocialHub Backend Application - Main entry point
 * 
 * Technologies:
 * - Spring Boot 3.5.x
 * - Java 17
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
		loadEnv();
		SpringApplication.run(SocialHubApplication.class, args);
	}

	private static void loadEnv() {
		Path[] paths = {
			Paths.get(".env"),
			Paths.get("socialhub-backend/.env"),
			Paths.get("../.env")
		};
		for (Path path : paths) {
			if (Files.isRegularFile(path)) {
				try {
					List<String> lines = Files.readAllLines(path);
					for (String line : lines) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						String key = line.substring(0, eqIdx).trim();
						String value = line.substring(eqIdx + 1).trim();
						if ((value.startsWith("\"") && value.endsWith("\"")) ||
							(value.startsWith("'") && value.endsWith("'"))) {
							value = value.substring(1, value.length() - 1);
						}
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
					break;
				} catch (IOException ignored) {
				}
			}
		}
	}

}