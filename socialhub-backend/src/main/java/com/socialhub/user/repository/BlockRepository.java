package com.socialhub.user.repository;

import com.socialhub.user.document.Block;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends MongoRepository<Block, String> {

    Optional<Block> findByUserIdAndBlockedUserId(String userId, String blockedUserId);

    boolean existsByUserIdAndBlockedUserId(String userId, String blockedUserId);

    List<Block> findByUserId(String userId);

    List<Block> findByBlockedUserId(String blockedUserId);

    void deleteByUserIdAndBlockedUserId(String userId, String blockedUserId);
}
