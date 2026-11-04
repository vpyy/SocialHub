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
public class UpdateGroupRequest {
    private String groupName;
    private String groupAvatarUrl;
    
    /** Danh sách userId cần thêm vào nhóm */
    private List<String> addMemberIds;
    
    /** Danh sách userId cần xóa khỏi nhóm */
    private List<String> removeMemberIds;
}
