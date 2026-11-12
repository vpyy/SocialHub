package com.socialhub.notification.repository;

import com.socialhub.notification.document.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for notifications collection.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    // Tất cả thông báo của 1 user, mới nhất trước
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(
            String recipientId, Pageable pageable);

    // Chỉ thông báo chưa đọc
    Page<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(
            String recipientId, Pageable pageable);

    long countByRecipientIdAndIsReadFalse(String recipientId);
}
