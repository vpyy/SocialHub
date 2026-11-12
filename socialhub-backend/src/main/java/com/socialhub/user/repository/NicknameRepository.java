package com.socialhub.user.repository;

import com.socialhub.user.document.Nickname;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NicknameRepository extends MongoRepository<Nickname, String> {

    Optional<Nickname> findByUserIdAndTargetUserId(String userId, String targetUserId);

    void deleteByUserIdAndTargetUserId(String userId, String targetUserId);
}
