import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './components/Login';
import Register from './components/Register';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';

// Block Cloudflare Insights errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', function(e) {
    // Prevent Cloudflare Insights errors from showing in console
    if (e.filename && e.filename.includes('cloudflareinsights')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

// Protected route component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);
  
  const handleLogout = () => {
    setCurrentRoom(null);
    logout();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat Portal</h1>
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm">
                Logged in as <span className="font-bold">{currentUser.username}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto p-4 max-w-5xl">
        {!currentUser ? (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : !currentRoom ? (
          <RoomList 
            onSelectRoom={setCurrentRoom} 
          />
        ) : (
          <ChatRoom 
            room={currentRoom} 
            user={currentUser} 
            onLeaveRoom={() => setCurrentRoom(null)} 
          />
        )}
      </main>
      
      <footer className="bg-gray-200 p-4 text-center text-gray-600 text-sm">
        <p>Chat Portal - A Real-time Chat Application</p>
      </footer>
    </div>
  );
}

function App() {
  // Main application component that orchestrates the entire chat portal
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;