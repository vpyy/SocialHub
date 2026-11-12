package com.socialhub.user.repository;

import com.socialhub.user.document.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for users collection.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    /** Search by displayName or username (for user search feature) */
    @Query("{ $or: [ { 'displayName': { $regex: ?0, $options: 'i' } }, { 'username': { $regex: ?0, $options: 'i' } } ] }")
    List<User> searchByKeyword(String keyword);
}
