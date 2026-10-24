package com.socialhub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartConversationRequest {

    @NotBlank(message = "targetUserId is required")
    private String targetUserId;
}
