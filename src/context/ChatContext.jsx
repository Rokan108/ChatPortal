import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getRoomList, 
  getRoomMessages, 
  sendMessage as sendChatMessage,
  getUsersInRoom as fetchUsersInRoom
} from '../utils/chatUtils';

// Create context
const ChatContext = createContext();

// Custom hook for using the chat context
export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  
  // Load rooms on initial render
  useEffect(() => {
    const fetchRooms = () => {
      const roomList = getRoomList();
      setRooms(roomList);
    };
    
    fetchRooms();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchRooms, 3000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Load messages when currentRoom changes
  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      setUsersInRoom([]);
      return;
    }
    
    const fetchMessages = () => {
      const roomMessages = getRoomMessages(currentRoom.id);
      setMessages(roomMessages);
      
      const users = fetchUsersInRoom(currentRoom.id);
      setUsersInRoom(users);
    };
    
    fetchMessages();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchMessages, 1000);
    return () => clearInterval(intervalId);
  }, [currentRoom]);
  
  // Join room
  const joinRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setCurrentRoom(room);
      return room;
    }
    return null;
  };
  
  // Leave room
  const leaveRoom = () => {
    setCurrentRoom(null);
  };
  
  // Send message
  const sendMessage = (content, user) => {
    if (!currentRoom || !content.trim() || !user) return null;
    
    return sendChatMessage(currentRoom.id, user, content.trim());
  };
  
  // Create new room
  const createRoom = (roomName, user) => {
    if (!roomName.trim() || !user) return null;
    
    // Check for duplicate room names
    if (rooms.some(room => room.name.toLowerCase() === roomName.trim().toLowerCase())) {
      throw new Error('A room with this name already exists');
    }
    
    const newRoom = {
      id: `room_${Date.now()}`,
      name: roomName.trim(),
      createdBy: user,
      createdAt: new Date().toISOString(),
      users: [user],
    };
    
    // Save to localStorage
    const existingRooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
    const updatedRooms = [...existingRooms, newRoom];
    localStorage.setItem('chat_rooms', JSON.stringify(updatedRooms));
    
    // Update state
    setRooms([...rooms, newRoom]);
    return newRoom;
  };
  
  const value = {
    rooms,
    currentRoom,
    messages,
    usersInRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    createRoom
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}