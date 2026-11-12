package com.socialhub.chat.repository;

import com.socialhub.chat.document.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for conversations collection.
 */
@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    // Tất cả conversation của 1 user
    Page<Conversation> findByParticipantIdsContainingOrderByLastMessageAtDesc(
            String userId, Pageable pageable);

    // Tìm conversation 1-1 giữa 2 user cụ thể
    @Query("{ 'participantIds': { $all: [?0, ?1], $size: 2 } }")
    Optional<Conversation> findDirectConversation(String userIdA, String userIdB);

    // Lấy tất cả conversation IDs mà user tham gia
    // Dùng cho PresenceService để tìm ai cần nhận broadcast presence
    @Query(value = "{ 'participantIds': ?0 }", fields = "{ '_id': 1 }")
    List<Conversation> findConversationsByParticipantId(String userId);

    // Lấy danh sách conversation IDs (dạng String) của user — dùng trong PresenceService
    @Query("{ 'participantIds': ?0 }")
    List<Conversation> findAllByParticipantIdsContaining(String userId);
}
