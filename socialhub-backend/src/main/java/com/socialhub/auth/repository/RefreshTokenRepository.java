package com.socialhub.auth.repository;

import com.socialhub.auth.model.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    Optional<RefreshToken> findByPreviousTokenHash(String previousTokenHash);

    List<RefreshToken> findByUserId(String userId);

    List<RefreshToken> findByUserIdAndRevokedFalse(String userId);

    Optional<RefreshToken> findByIdAndRevokedFalse(String id);

    void deleteByUserIdAndRevokedTrue(String userId);
}
