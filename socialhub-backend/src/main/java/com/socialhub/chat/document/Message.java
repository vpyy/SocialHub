package com.socialhub.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * messages collection
 *
 * Fields: _id, conversationId, senderId, content,
 *         messageType, sharedPostId, mediaUrl,
 *         isRead, createdAt
 *
 * messageType values:
 *   TEXT  — tin nhắn văn bản thông thường
 *   IMAGE — tin nhắn có ảnh
 *   VIDEO — tin nhắn có video
 *   POST  — share bài viết (dùng sharedPostId)
 *
 * Indexes:
 *   conversationId + createdAt  ← quan trọng để load lịch sử chat
 */
@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(name = "conversation_created_idx",
            def = "{'conversationId': 1, 'createdAt': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;

    private String conversationId;  // → conversations._id
    private String senderId;        // → users._id

    private String content;         // nội dung text (nullable với IMAGE/VIDEO)

    /** TEXT | IMAGE | VIDEO | POST */
    private String messageType;

    /** Chỉ dùng khi messageType = POST → posts._id */
    private String sharedPostId;

    /** Chỉ dùng khi messageType = IMAGE hoặc VIDEO */
    private String mediaUrl;

    @Builder.Default
    private boolean isRead = false;

    private Instant createdAt;
}
