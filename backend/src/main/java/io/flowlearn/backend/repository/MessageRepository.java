package io.flowlearn.backend.repository;

import io.flowlearn.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findTop10ByOrderByTimestampDesc();
    List<Message> findByTypeOrderByTimestampDesc(String type);
}