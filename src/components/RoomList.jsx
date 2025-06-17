import React, { useState, useEffect } from 'react';
import { getRoomList, createNewRoom, joinRoom } from '../utils/chatUtils';
import { useAuth } from '../context/AuthContext';

function RoomList({ onSelectRoom }) {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [userLimit, setUserLimit] = useState('');
  const [error, setError] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Fetch room list
  useEffect(() => {
    const fetchRooms = () => {
      const roomList = getRoomList();
      setRooms(roomList);
    };
    
    // Initial fetch
    fetchRooms();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchRooms, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleCreateRoom = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate room name
    if (!newRoomName.trim()) {
      setError('Room name cannot be empty');
      return;
    }
    
    // Check for duplicate room names
    if (rooms.some(room => room.name.toLowerCase() === newRoomName.trim().toLowerCase())) {
      setError('A room with this name already exists');
      return;
    }

    // If private, validate password
    if (isPrivate && (!password || password.length < 4)) {
      setError('Private rooms require a password (minimum 4 characters)');
      return;
    }

    // Validate user limit if provided
    if (userLimit && (isNaN(userLimit) || parseInt(userLimit) < 2)) {
      setError('User limit must be at least 2');
      return;
    }
    
    try {
      // Create new room
      const newRoom = createNewRoom(
        newRoomName.trim(),
        currentUser,
        isPrivate,
        isPrivate ? password : null,
        userLimit ? parseInt(userLimit) : null
      );

      // Reset form
      setNewRoomName('');
      setIsPrivate(false);
      setPassword('');
      setUserLimit('');
      setError('');
      
      // Automatically join the newly created room
      onSelectRoom(newRoom);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinRoom = (room) => {
    // If room is not private or user is the creator, join directly
    if (!room.isPrivate || room.createdBy.id === currentUser.id) {
      try {
        joinRoom(room.id, currentUser);
        onSelectRoom(room);
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    // For private rooms, show password modal
    setJoiningRoomId(room.id);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    try {
      const room = rooms.find(r => r.id === joiningRoomId);
      if (!room) {
        setError('Room not found');
        return;
      }

      joinRoom(joiningRoomId, currentUser, joinPassword);
      
      // Reset password modal
      setJoinPassword('');
      setJoiningRoomId(null);
      setShowPasswordModal(false);
      
      // Join the room
      onSelectRoom(room);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelPasswordJoin = () => {
    setJoinPassword('');
    setJoiningRoomId(null);
    setShowPasswordModal(false);
  };
  
  return (
    <div className="max-w-3xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6">Available Chat Rooms</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Create new room form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-3">Create a New Room</h3>
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              id="roomName"
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              id="isPrivate"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
              Private Room
            </label>
          </div>

          {isPrivate && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={4}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="userLimit" className="block text-sm font-medium text-gray-700 mb-1">
              User Limit (Optional)
            </label>
            <input
              id="userLimit"
              type="number"
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              placeholder="Maximum number of users"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={2}
            />
            <p className="mt-1 text-xs text-gray-500">Leave blank for no limit</p>
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Create & Join
          </button>
        </form>
      </div>
      
      {/* Room list */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Join Existing Room</h3>
        </div>
        
        {rooms.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No rooms available. Create a new one to get started!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rooms.map((room) => {
              // Check if room has user limit and is full
              const activeUsers = room.users ? room.users.filter(u => u.isOnline).length : 0;
              const isFull = room.userLimit && activeUsers >= room.userLimit && !room.users.some(u => u.id === currentUser.id);
              
              return (
                <li key={room.id} className="hover:bg-gray-50">
                  <div className="w-full text-left p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
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
                            {activeUsers}/{room.userLimit} users
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Created by {room.createdBy.username} • {new Date(room.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room)}
                      className={`px-4 py-2 rounded-md ${
                        isFull 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={isFull}
                    >
                      {isFull ? 'Room Full' : 'Join Room'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Password Modal for Private Rooms */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Enter Room Password</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="joinPassword"
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelPasswordJoin}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomList;