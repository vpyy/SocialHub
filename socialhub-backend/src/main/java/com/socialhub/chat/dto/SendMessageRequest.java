package com.socialhub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    /** TEXT | IMAGE | VIDEO | POST  (default TEXT) */
    private String messageType = "TEXT";

    /** Required for TEXT / IMAGE / VIDEO */
    private String content;

    /** Required when messageType = IMAGE or VIDEO */
    private String mediaUrl;

    /** Required when messageType = POST */
    private String sharedPostId;
}
