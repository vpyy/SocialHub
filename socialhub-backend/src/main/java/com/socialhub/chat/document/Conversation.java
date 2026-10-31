package com.socialhub.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * conversations collection
 *
 * Fields: _id, participantIds[], lastMessage,
 *         lastMessageAt, createdAt
 *
 * participantIds là embedded array — không cần collection riêng.
 * Hiện tại: chat 1-1 (2 participants).
 * Mở rộng sau: group chat (> 2 participants).
 *
 * Indexes:
 *   participantIds (multikey)
 */
@Document(collection = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    private String id;

    /** Danh sách userId tham gia conversation */
    @Indexed
    @Builder.Default
    private List<String> participantIds = new ArrayList<>();

    /** Group chat info */
    private boolean isGroup;  // true for group, false for 1-1 chat
    private String groupName;
    private String groupAvatarUrl;

    /** Nội dung preview tin nhắn cuối */
    private String lastMessage;

    private Instant lastMessageAt;
    private Instant createdAt;
}
