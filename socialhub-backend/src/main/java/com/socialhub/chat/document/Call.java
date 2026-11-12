package com.socialhub.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * calls collection - Lưu thông tin các cuộc gọi
 *
 * Status: INITIATED, RINGING, ACCEPTED, DECLINED, MISSED, ENDED
 */
@Document(collection = "calls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Call {

    @Id
    private String id;

    private String conversationId;  // → conversations._id
    private String callerId;        // → users._id (người bắt đầu gọi)
    private String calleeId;        // → users._id (người được gọi) - chỉ 1-1 call

    /** INITIATED, RINGING, ACCEPTED, DECLINED, MISSED, ENDED */
    private String status;

    /** Thời gian bắt đầu gọi */
    private Instant startedAt;

    /** Thời gian trả lời (null nếu từ chối/miss) */
    private Instant answeredAt;

    /** Thời gian kết thúc */
    private Instant endedAt;

    /** Duration (ms) - null nếu chưa kết thúc */
    private Long duration;

    /** Call type: VOICE, VIDEO */
    @Builder.Default
    private String callType = "VOICE";

    private Instant createdAt;
}
