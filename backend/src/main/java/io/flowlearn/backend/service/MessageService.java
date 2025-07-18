// MessageService.java
package io.flowlearn.backend.service;

import io.flowlearn.backend.model.Message;
import io.flowlearn.backend.repository.MessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nats.client.Connection;
import io.nats.client.Dispatcher;
import io.nats.client.MessageHandler;
import io.nats.client.Nats;
import io.nats.client.Options;
import io.nats.client.Subscription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Value("${nats.url}")
    private String natsUrl;
    
    private Connection natsConnection;
    
    // Different message types for learning
    private static final String CHAT_SUBJECT = "chat.messages";
    private static final String NOTIFICATION_SUBJECT = "notifications";
    private static final String TASK_SUBJECT = "tasks.process";
    
    @PostConstruct
    public void initialize() {
        try {
            Options options = new Options.Builder()
                    .server(natsUrl)
                    .build();
            
            natsConnection = Nats.connect(options);
            
            // Subscribe to different message types
            subscribeToChatMessages();
            subscribeToNotifications();
            subscribeToTasks();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to NATS", e);
        }
    }
    
    @PreDestroy
    public void cleanup() {
        try {
            if (natsConnection != null) {
                natsConnection.close();
            }
        } catch (Exception e) {
            // Log error
        }
    }
    
    // Publish a chat message
    public void publishChatMessage(String username, String content) {
        try {
            Message message = new Message();
            message.setId(UUID.randomUUID().toString());
            message.setUsername(username);
            message.setContent(content);
            message.setType("CHAT");
            message.setTimestamp(LocalDateTime.now());
            
            String messageJson = objectMapper.writeValueAsString(message);
            natsConnection.publish(CHAT_SUBJECT, messageJson.getBytes());
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to publish chat message", e);
        }
    }
    
    // Publish a notification
    public void publishNotification(String title, String message) {
        try {
            Message notification = new Message();
            notification.setId(UUID.randomUUID().toString());
            notification.setUsername("SYSTEM");
            notification.setContent(message);
            notification.setType("NOTIFICATION");
            notification.setTimestamp(LocalDateTime.now());
            
            String messageJson = objectMapper.writeValueAsString(notification);
            natsConnection.publish(NOTIFICATION_SUBJECT, messageJson.getBytes());
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to publish notification", e);
        }
    }
    
    // Publish a task for processing
    public void publishTask(String taskData) {
        try {
            Message task = new Message();
            task.setId(UUID.randomUUID().toString());
            task.setUsername("SYSTEM");
            task.setContent(taskData);
            task.setType("TASK");
            task.setTimestamp(LocalDateTime.now());
            
            String messageJson = objectMapper.writeValueAsString(task);
            natsConnection.publish(TASK_SUBJECT, messageJson.getBytes());
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to publish task", e);
        }
    }
    
    // Subscribe to chat messages
    private void subscribeToChatMessages() {
        try {
            Dispatcher dispatcher = natsConnection.createDispatcher((msg) -> {
                try {
                    String messageData = new String(msg.getData());
                    Message message = objectMapper.readValue(messageData, Message.class);
                    
                    // Save to database
                    messageRepository.save(message);
                    
                    // Send to WebSocket clients
                    messagingTemplate.convertAndSend("/topic/chat", message);
                    
                } catch (Exception e) {
                    // Log error
                }
            });
            dispatcher.subscribe(CHAT_SUBJECT);
        } catch (Exception e) {
            throw new RuntimeException("Failed to subscribe to chat messages", e);
        }
    }
    
    // Subscribe to notifications
    private void subscribeToNotifications() {
        try {
            Dispatcher dispatcher = natsConnection.createDispatcher((msg) -> {
                try {
                    String messageData = new String(msg.getData());
                    Message notification = objectMapper.readValue(messageData, Message.class);
                    
                    // Save to database
                    messageRepository.save(notification);
                    
                    // Send to WebSocket clients
                    messagingTemplate.convertAndSend("/topic/notifications", notification);
                    
                } catch (Exception e) {
                    // Log error
                }
            });
            dispatcher.subscribe(NOTIFICATION_SUBJECT);
        } catch (Exception e) {
            throw new RuntimeException("Failed to subscribe to notifications", e);
        }
    }
    
    // Subscribe to tasks
    private void subscribeToTasks() {
        try {
            Dispatcher dispatcher = natsConnection.createDispatcher((msg) -> {
                try {
                    String messageData = new String(msg.getData());
                    Message task = objectMapper.readValue(messageData, Message.class);
                    
                    // Simulate task processing
                    Thread.sleep(2000);
                    
                    // Mark as processed
                    task.setContent(task.getContent() + " [PROCESSED]");
                    messageRepository.save(task);
                    
                    // Send completion notification
                    messagingTemplate.convertAndSend("/topic/tasks", task);
                    
                } catch (Exception e) {
                    // Log error
                }
            });
            dispatcher.subscribe(TASK_SUBJECT);
        } catch (Exception e) {
            throw new RuntimeException("Failed to subscribe to tasks", e);
        }
    }
    
    // Get recent messages
    public List<Message> getRecentMessages(int limit) {
        return messageRepository.findTop10ByOrderByTimestampDesc();
    }
}