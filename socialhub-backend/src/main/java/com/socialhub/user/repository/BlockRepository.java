package com.socialhub.user.repository;

import com.socialhub.user.document.Block;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends MongoRepository<Block, String> {
    
    Optional<Block> findByBlockerIdAndBlockedId(String blockerId, String blockedId);
    
    List<Block> findByBlockerId(String blockerId);
    
    List<Block> findByBlockedId(String blockedId);
    
    boolean existsByBlockerIdAndBlockedId(String blockerId, String blockedId);
    
    void deleteByBlockerIdAndBlockedId(String blockerId, String blockedId);
}
