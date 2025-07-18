package io.flowlearn.backend.controller;

import io.flowlearn.backend.service.MessageService;
import io.flowlearn.backend.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @PostMapping("/chat")
    public ResponseEntity<String> sendChatMessage(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String content = request.get("content");
        
        messageService.publishChatMessage(username, content);
        return ResponseEntity.ok("Message sent successfully");
    }
    
    @PostMapping("/notification")
    public ResponseEntity<String> sendNotification(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");
        
        messageService.publishNotification(title, message);
        return ResponseEntity.ok("Notification sent successfully");
    }
    
    @PostMapping("/task")
    public ResponseEntity<String> submitTask(@RequestBody Map<String, String> request) {
        String taskData = request.get("taskData");
        
        messageService.publishTask(taskData);
        return ResponseEntity.ok("Task submitted successfully");
    }
    
    @GetMapping("/recent")
    public ResponseEntity<List<Message>> getRecentMessages() {
        List<Message> messages = messageService.getRecentMessages(20);
        return ResponseEntity.ok(messages);
    }
}