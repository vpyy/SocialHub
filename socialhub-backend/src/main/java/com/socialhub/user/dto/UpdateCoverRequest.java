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
public class UpdateCoverRequest {

    @NotBlank(message = "URL Cover là bắt buộc")
    private String coverUrl;
}
