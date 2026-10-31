package com.socialhub.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetNicknameRequest {
    private String targetUserId;
    private String nickname;  // null or empty to remove
}
