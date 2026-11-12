package com.socialhub.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileDto {

    @Size(max = 500, message = "Bio không được vượt quá 500 ký tự")
    private String bio;

    private String avatarUrl;
    private String avatar;

    private String coverUrl;
    private String cover;

    @Size(max = 100, message = "Tên hiển thị không được vượt quá 100 ký tự")
    private String displayName;

    public String getResolvedAvatarUrl() {
        return avatarUrl != null && !avatarUrl.isBlank() ? avatarUrl : avatar;
    }

    public String getResolvedCoverUrl() {
        return coverUrl != null && !coverUrl.isBlank() ? coverUrl : cover;
    }
}
