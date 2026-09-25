package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** All messages between two users (either direction), oldest first. */
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :a AND m.recipient.id = :b) OR " +
            "(m.sender.id = :b AND m.recipient.id = :a) " +
            "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("a") Long a, @Param("b") Long b);

    /** All messages involving a user (either direction), newest first - used to build the conversation list. */
    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.recipient.id = :userId ORDER BY m.createdAt DESC")
    List<Message> findAllForUser(@Param("userId") Long userId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    /** Mark all messages from `otherId` to `me` as read. */
    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE m.recipient.id = :me AND m.sender.id = :otherId AND m.read = false")
    void markThreadRead(@Param("me") Long me, @Param("otherId") Long otherId);
}
