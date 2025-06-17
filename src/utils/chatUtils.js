/**
 * Chat Utilities
 * This file contains utility functions for simulating real-time chat functionality
 * using browser localStorage. In a production environment, these would be replaced
 * with actual API calls to a backend server.
 */

// Simple password hashing (for demo purposes only - in production use proper hashing)
export function hashPassword(password) {
  // In a real app, use a proper hashing library like bcrypt
  // This is a very simplified version for demo purposes
  return btoa(password + '_salted');
}

// Verify password
export function verifyPassword(password, hashedPassword) {
  return btoa(password + '_salted') === hashedPassword;
}

// Get room list from localStorage
export function getRoomList() {
  const rooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
  return rooms;
}

// Create new room
export function createNewRoom(roomName, creator, isPrivate = false, password = null, userLimit = null) {
  if (!roomName.trim() || !creator) {
    throw new Error('Room name and creator are required');
  }
  
  // Check for duplicate room names
  const existingRooms = getRoomList();
  if (existingRooms.some(room => room.name.toLowerCase() === roomName.trim().toLowerCase())) {
    throw new Error('A room with this name already exists');
  }
  
  // If private room, ensure password is set
  if (isPrivate && !password) {
    throw new Error('Private rooms require a password');
  }
  
  // Validate user limit
  if (userLimit !== null && (isNaN(userLimit) || userLimit < 2)) {
    throw new Error('User limit must be at least 2');
  }
  
  const newRoom = {
    id: `room_${Date.now()}`,
    name: roomName.trim(),
    createdBy: creator,
    createdAt: new Date().toISOString(),
    users: [creator],
    isPrivate: isPrivate,
    passwordHash: isPrivate ? hashPassword(password) : null,
    userLimit: userLimit !== null ? parseInt(userLimit, 10) : null,
  };
  
  // Save to localStorage
  const updatedRooms = [...existingRooms, newRoom];
  localStorage.setItem('chat_rooms', JSON.stringify(updatedRooms));
  
  // Initialize empty messages array for the room
  localStorage.setItem(`chat_messages_${newRoom.id}`, JSON.stringify([]));
  
  return newRoom;
}

// Join room with password check
export function joinRoom(roomId, user, password = null) {
  const rooms = getRoomList();
  const room = rooms.find(r => r.id === roomId);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  // Check if room is private and requires password
  if (room.isPrivate) {
    // Skip password check if user is the creator
    if (room.createdBy.id !== user.id) {
      // Verify password
      if (!password || !verifyPassword(password, room.passwordHash)) {
        throw new Error('Invalid room password');
      }
    }
  }
  
  // Check if room has user limit and is full
  if (room.userLimit !== null) {
    const activeUsers = room.users.filter(u => u.isOnline).length;
    if (activeUsers >= room.userLimit && !room.users.some(u => u.id === user.id)) {
      throw new Error(`Room is full (limit: ${room.userLimit} users)`);
    }
  }
  
  // Add user to room
  addUserToRoom(roomId, user);
  return room;
}

// Get messages for a specific room
export function getRoomMessages(roomId) {
  const messages = JSON.parse(localStorage.getItem(`chat_messages_${roomId}`) || '[]');
  return messages;
}

// Send a new message in a room
export function sendMessage(roomId, sender, content) {
  if (!roomId || !sender || !content.trim()) {
    throw new Error('Room ID, sender, and message content are required');
  }
  
  const newMessage = {
    id: `msg_${Date.now()}`,
    roomId,
    sender,
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };
  
  // Get existing messages
  const messages = getRoomMessages(roomId);
  
  // Add new message
  const updatedMessages = [...messages, newMessage];
  
  // Save to localStorage
  localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(updatedMessages));
  
  // Update room's last activity
  updateRoomActivity(roomId);
  
  // Update user presence in the room
  addUserToRoom(roomId, sender);
  
  return newMessage;
}

// Get users in a specific room
export function getUsersInRoom(roomId) {
  const rooms = getRoomList();
  const room = rooms.find(r => r.id === roomId);
  
  if (!room) return [];
  
  return room.users || [];
}

// Add user to room (or update their presence)
export function addUserToRoom(roomId, user) {
  const rooms = getRoomList();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  
  if (roomIndex === -1) return false;
  
  const room = rooms[roomIndex];
  
  // Check if user is already in room
  const userIndex = room.users.findIndex(u => u.id === user.id);
  
  if (userIndex === -1) {
    // Add user to room
    room.users.push({
      ...user,
      isOnline: true,
      joinedAt: new Date().toISOString(),
    });
  } else {
    // Update user status
    room.users[userIndex] = {
      ...room.users[userIndex],
      isOnline: true,
      lastActive: new Date().toISOString(),
    };
  }
  
  // Update room in storage
  rooms[roomIndex] = room;
  localStorage.setItem('chat_rooms', JSON.stringify(rooms));
  
  return true;
}

// Update room's last activity
function updateRoomActivity(roomId) {
  const rooms = getRoomList();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  
  if (roomIndex === -1) return;
  
  rooms[roomIndex].lastActivity = new Date().toISOString();
  localStorage.setItem('chat_rooms', JSON.stringify(rooms));
}

// Remove a user from a room
export function removeUserFromRoom(roomId, userId) {
  const rooms = getRoomList();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  
  if (roomIndex === -1) return false;
  
  const room = rooms[roomIndex];
  
  // Update user status to offline
  const userIndex = room.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    room.users[userIndex].isOnline = false;
    room.users[userIndex].leftAt = new Date().toISOString();
  }
  
  // Update room in storage
  rooms[roomIndex] = room;
  localStorage.setItem('chat_rooms', JSON.stringify(rooms));
  
  return true;
}

// Clear all chat data (for testing)
export function clearChatData() {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Remove all chat-related items
  keys.forEach(key => {
    if (key === 'chat_rooms' || key.startsWith('chat_messages_')) {
      localStorage.removeItem(key);
    }
  });
}