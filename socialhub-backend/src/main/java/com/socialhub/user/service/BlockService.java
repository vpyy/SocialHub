package com.socialhub.user.service;

import com.socialhub.common.exception.ValidationException;
import com.socialhub.user.document.Block;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.BlockRepository;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    /**
     * Block a user
     */
    public Block blockUser(String blockerId, String blockedId) {
        // Cannot block yourself
        if (blockerId.equals(blockedId)) {
            throw new ValidationException("Cannot block yourself");
        }

        // Check if user exists
        if (!userRepository.existsById(blockedId)) {
            throw new ValidationException("User not found");
        }

        // Check if already blocked
        var existing = blockRepository.findByBlockerIdAndBlockedId(blockerId, blockedId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create block
        var block = Block.builder()
                .blockerId(blockerId)
                .blockedId(blockedId)
                .createdAt(Instant.now())
                .build();

        return blockRepository.save(block);
    }

    /**
     * Unblock a user
     */
    public void unblockUser(String blockerId, String blockedId) {
        blockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    /**
     * Check if user A has blocked user B
     */
    public boolean isBlocked(String blockerId, String blockedId) {
        return blockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    /**
     * Check if either user has blocked the other (bidirectional check)
     */
    public boolean isBlockedBidirectional(String userId1, String userId2) {
        return blockRepository.existsByBlockerIdAndBlockedId(userId1, userId2) ||
               blockRepository.existsByBlockerIdAndBlockedId(userId2, userId1);
    }

    /**
     * Get list of users that current user has blocked
     */
    public List<User> getBlockedUsers(String blockerId) {
        var blocks = blockRepository.findByBlockerId(blockerId);
        var blockedIds = blocks.stream()
                .map(Block::getBlockedId)
                .collect(Collectors.toList());
        
        return userRepository.findAllById(blockedIds);
    }

    /**
     * Get list of users who have blocked the current user
     */
    public List<String> getUsersWhoBlockedMe(String blockedId) {
        return blockRepository.findByBlockedId(blockedId)
                .stream()
                .map(Block::getBlockerId)
                .collect(Collectors.toList());
    }
}
