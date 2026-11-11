package com.socialhub.chat.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    /** TEXT | IMAGE | VIDEO | POST | FILE (default TEXT) */
    private String messageType = "TEXT";

    /** Required for TEXT / IMAGE / VIDEO */
    private String content;

    /** Required when messageType = IMAGE or VIDEO */
    private String mediaUrl;

    /** Required when messageType = POST */
    private String sharedPostId;

    /** Multiple file attachments — max 10, validated by whitelist */
    @Size(max = 10, message = "Tối đa 10 file đính kèm")
    private List<AttachmentDto> attachments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentDto {
        /** ID returned from /media/upload */
        private String id;

        /** MIME type or simplified type: IMAGE, VIDEO, PDF, DOCX, ZIP */
        private String type;

        private String url;
        private String fileName;
        private Long fileSize;
        private String thumbnailUrl;
    }
}
