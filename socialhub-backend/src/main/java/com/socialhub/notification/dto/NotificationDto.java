package com.socialhub.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDto {

    private String id;

    private String recipientId;

    // actor info
    private String actorId;
    private String actorUsername;
    private String actorDisplayName;
    private String actorAvatarUrl;

    /** LIKE | COMMENT | FOLLOW | MENTION | MESSAGE */
    private String type;

    private String postId;
    private String postContentPreview;   // first 80 chars of the post

    private String commentId;
    private String commentContentPreview;

    private boolean isRead;
    private Instant createdAt;
}
