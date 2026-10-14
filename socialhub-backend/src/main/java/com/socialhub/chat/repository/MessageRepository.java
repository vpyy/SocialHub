package com.socialhub.chat.repository;

import com.socialhub.chat.document.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for messages collection.
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Lịch sử tin nhắn của 1 conversation (cũ nhất trước — để render chat)
    Page<Message> findByConversationIdOrderByCreatedAtAsc(
            String conversationId, Pageable pageable);

    // Đếm tin nhắn chưa đọc trong conversation với người nhận cụ thể
    long countByConversationIdAndSenderIdNotAndIsReadFalse(
            String conversationId, String senderId);
}
