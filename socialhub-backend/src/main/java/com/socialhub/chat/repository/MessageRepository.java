package com.socialhub.chat.repository;

import com.socialhub.chat.document.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for messages collection.
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Lịch sử tin nhắn của 1 conversation (cũ nhất trước — để render chat)
    Page<Message> findByConversationIdOrderByCreatedAtAsc(
            String conversationId, Pageable pageable);

    // Lịch sử tin nhắn kèm filter clearedBefore (xóa hội thoại một phía)
    Page<Message> findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(
            String conversationId, Instant clearedBefore, Pageable pageable);

    // Đồng bộ tin nhắn bị lỡ — tìm tất cả tin nhắn SAU một messageId nhất định
    // Dùng cho reconnect: client gửi lastMessageId, server trả về những gì đến sau đó
    @Query("{ 'conversationId': ?0, '_id': { $gt: ?1 } }")
    List<Message> findByConversationIdAndIdAfter(String conversationId, String lastMessageId);

    // Phiên bản có filter clearedBefore kết hợp sync tin lỡ
    @Query("{ 'conversationId': ?0, '_id': { $gt: ?1 }, 'createdAt': { $gt: ?2 } }")
    List<Message> findByConversationIdAndIdAfterAndCreatedAtAfter(
            String conversationId, String lastMessageId, Instant clearedBefore);

    // Lấy tất cả tin nhắn chưa đọc trong conversation (không phải của sender)
    // Dùng khi markMessagesRead — batch update thay vì N+1
    @Query("{ 'conversationId': ?0, 'senderId': { $ne: ?1 }, 'isRead': false }")
    List<Message> findUnreadMessagesInConversation(String conversationId, String userId);

    // Find all messages by conversation ID (for deletion)
    List<Message> findByConversationId(String conversationId);

    // Đếm tin nhắn chưa đọc trong conversation với người nhận cụ thể
    long countByConversationIdAndSenderIdNotAndIsReadFalse(
            String conversationId, String senderId);

    // Tìm kiếm tin nhắn theo nội dung
    Page<Message> findByConversationIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
            String conversationId, String query, Pageable pageable);
}
