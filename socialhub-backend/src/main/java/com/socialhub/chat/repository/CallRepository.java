package com.socialhub.chat.repository;

import com.socialhub.chat.document.Call;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface CallRepository extends MongoRepository<Call, String> {
    
    /** Tìm các cuộc gọi của conversation */
    Page<Call> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);
    
    /** Tìm cuộc gọi hiện tại (chưa kết thúc) */
    Optional<Call> findByConversationIdAndStatusIn(String conversationId, java.util.List<String> statuses);
    
    /** Tìm cuộc gọi bị miss (trong vòng 1 phút gần đây) */
    @Query("{ 'calleeId': ?0, 'status': 'MISSED', 'createdAt': { $gte: ?1 } }")
    java.util.List<Call> findRecentMissedCalls(String calleeId, Instant since);
}
