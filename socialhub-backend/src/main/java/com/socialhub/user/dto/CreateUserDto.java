package com.socialhub.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user registration and creation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for creating a new user")
public class CreateUserDto {
    
    @NotBlank(message = "Display name cannot be blank")
    @Size(min = 1, max = 100, message = "Display name must be between 1 and 100 characters")
    @Schema(description = "User's display name", example = "Nguyễn Quang Minh", requiredMode = Schema.RequiredMode.REQUIRED)
    private String displayName;
    
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    @Schema(description = "User email address (unique)", example = "minh@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;
    
    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Schema(description = "User password (min 8 chars)", example = "SecurePassword123!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
    
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    @Schema(description = "User biography (optional)", example = "Full-stack developer")
    private String bio;
}
