package com.socialhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAvatarRequest {

    @NotBlank(message = "URL Avatar là bắt buộc")
    private String avatarUrl;
}
