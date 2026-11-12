package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateGroupChatRequest {
    private String groupName;
    private String groupAvatarUrl;
    private List<String> memberIds;  // excluding current user
}
