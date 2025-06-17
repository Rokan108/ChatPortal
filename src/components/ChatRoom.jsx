import React, { useState, useEffect, useRef } from 'react';
import { getRoomMessages, sendMessage, getUsersInRoom, removeUserFromRoom } from '../utils/chatUtils';
import ChatMessage from './ChatMessage';

function ChatRoom({ room, user, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Fetch messages and users in room
  useEffect(() => {
    const fetchData = () => {
      const roomMessages = getRoomMessages(room.id);
      setMessages(roomMessages);
      
      const roomUsers = getUsersInRoom(room.id);
      setUsers(roomUsers);
    };
    
    // Initial fetch
    fetchData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchData, 1000);
    
    return () => {
      clearInterval(intervalId);
      // When leaving the room, update user status
      removeUserFromRoom(room.id, user.id);
    };
  }, [room.id, user.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Send message
    sendMessage(room.id, user, newMessage.trim());
    setNewMessage('');
  };

  // Count active users
  const activeUsers = users.filter(u => u.isOnline);
  const isRoomFull = room.userLimit && activeUsers.length >= room.userLimit;
  
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="bg-white p-4 rounded-t-lg shadow-md flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{room.name}</h2>
            {room.isPrivate && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </span>
            )}
            {room.userLimit && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeUsers.length}/{room.userLimit} users
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Created by {room.createdBy.username} • {new Date(room.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onLeaveRoom}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
        >
          Leave Room
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat messages */}
        <div className="flex-1 bg-white p-4 overflow-y-auto">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No messages yet. Be the first to say something!
              </p>
            ) : (
              messages.map(message => (
                <ChatMessage 
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender.id === user.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Online users sidebar */}
        <div className="w-64 bg-gray-50 p-4 border-l border-gray-200 hidden md:block">
          <h3 className="font-medium text-gray-700 mb-3">
            {room.userLimit 
              ? `Users (${activeUsers.length}/${room.userLimit})` 
              : `Online Users (${activeUsers.length})`}
          </h3>
          <ul className="space-y-2">
            {users.map(roomUser => (
              <li key={roomUser.id} className="flex items-center">
                <span className={`h-2 w-2 rounded-full mr-2 ${roomUser.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className={`${roomUser.id === user.id ? 'font-medium' : ''}`}>
                  {roomUser.username} {roomUser.id === user.id && '(You)'}
                  {roomUser.id === room.createdBy.id && (
                    <span className="ml-1 text-xs text-blue-600">(Creator)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {isRoomFull && room.userLimit > 0 && (
            <div className="mt-4 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              This room has reached its maximum capacity of {room.userLimit} users.
            </div>
          )}
        </div>
      </div>
      
      {/* Message input */}
      <div className="bg-white p-4 rounded-b-lg shadow-md border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;