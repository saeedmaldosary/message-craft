"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Bell, Settings, MessageCircle, CheckCircle } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const MessageQueueApp = () => {
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [username, setUsername] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [taskData, setTaskData] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  // WebSocket connection with STOMP
  useEffect(() => {
    const connectWebSocket = () => {
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: (frame) => {
          console.log('Connected to WebSocket: ' + frame);
          setIsConnected(true);
          setStompClient(client);
          
          // Subscribe to different topics
          client.subscribe('/topic/chat', (message) => {
            const data = JSON.parse(message.body);
            setMessages(prev => [data, ...prev]);
          });
          
          client.subscribe('/topic/notifications', (message) => {
            const data = JSON.parse(message.body);
            setNotifications(prev => [data, ...prev]);
          });
          
          client.subscribe('/topic/tasks', (message) => {
            const data = JSON.parse(message.body);
            setTasks(prev => [data, ...prev]);
          });
        },
        onStompError: (frame) => {
          console.error('STOMP Error:', frame);
          setIsConnected(false);
          setStompClient(null);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket Error:', error);
          setIsConnected(false);
          setStompClient(null);
        },
        onDisconnect: () => {
          console.log('Disconnected from WebSocket');
          setIsConnected(false);
          setStompClient(null);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      client.activate();
      return client;
    };
    
    const client = connectWebSocket();
    
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  // Fetch recent messages on load
  useEffect(() => {
    fetchRecentMessages();
  }, []);

  const fetchRecentMessages = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/messages/recent');
      const data = await response.json();
      
      const chatMessages = data.filter(msg => msg.type === 'CHAT');
      const notificationMessages = data.filter(msg => msg.type === 'NOTIFICATION');
      const taskMessages = data.filter(msg => msg.type === 'TASK');
      
      setMessages(chatMessages);
      setNotifications(notificationMessages);
      setTasks(taskMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!username.trim() || !chatMessage.trim()) return;

    try {
      await fetch('http://localhost:8080/api/messages/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          content: chatMessage.trim(),
        }),
      });
      
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!notificationTitle.trim() || !notificationMessage.trim()) return;

    try {
      await fetch('http://localhost:8080/api/messages/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
        }),
      });
      
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const submitTask = async (e) => {
    e.preventDefault();
    if (!taskData.trim()) return;

    try {
      await fetch('http://localhost:8080/api/messages/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskData: taskData.trim(),
        }),
      });
      
      setTaskData('');
    } catch (error) {
      console.error('Failed to submit task:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Message Queue Learning App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Username Input */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
            {[
              { id: 'chat', label: 'Chat Messages', icon: MessageCircle },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'tasks', label: 'Task Processing', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center sm:justify-start space-x-2 px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Send Message */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Send Chat Message</h2>
              <form onSubmit={sendChatMessage} className="space-y-4">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!username.trim() || !chatMessage.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Chat Messages</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet. Start a conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-blue-600">{msg.username}</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <p className="text-gray-800">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Send Notification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
              <form onSubmit={sendNotification} className="space-y-4">
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Notification message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  type="submit"
                  disabled={!notificationTitle.trim() || !notificationMessage.trim()}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Bell className="h-4 w-4" />
                  <span>Send Notification</span>
                </button>
              </form>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No notifications yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-yellow-800">System Notification</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(notif.timestamp)}</span>
                      </div>
                      <p className="text-gray-800">{notif.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Submit Task */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Submit Task</h2>
              <form onSubmit={submitTask} className="space-y-4">
                <textarea
                  value={taskData}
                  onChange={(e) => setTaskData(e.target.value)}
                  placeholder="Enter task data to process..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={!taskData.trim()}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Submit Task</span>
                </button>
              </form>
            </div>

            {/* Task Results */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Task Results</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks processed yet.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-green-800 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Task Processed
                        </span>
                        <span className="text-xs text-gray-500">{formatTimestamp(task.timestamp)}</span>
                      </div>
                      <p className="text-gray-800">{task.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How This Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">1. Chat Messages</h4>
              <p className="text-gray-600">Messages are published to NATS subject "chat.messages", stored in PostgreSQL, and broadcast via WebSocket to all connected clients.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">2. Notifications</h4>
              <p className="text-gray-600">System notifications use NATS subject "notifications" and are immediately displayed to all users in real-time.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">3. Task Processing</h4>
              <p className="text-gray-600">Tasks are queued via NATS subject "tasks.process", processed asynchronously (2s delay), and results are sent back to the UI.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessageQueueApp;