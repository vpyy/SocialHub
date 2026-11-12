package com.socialhub.chat.repository;

import com.socialhub.chat.document.UserConversationSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserConversationSettingsRepository extends MongoRepository<UserConversationSettings, String> {
    
    Optional<UserConversationSettings> findByUserIdAndConversationId(String userId, String conversationId);
    
    List<UserConversationSettings> findByUserId(String userId);
    
    List<UserConversationSettings> findByConversationId(String conversationId);
    
    List<UserConversationSettings> findByUserIdAndIsArchived(String userId, boolean isArchived);
    
    void deleteByConversationId(String conversationId);
}
