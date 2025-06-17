import React, { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword, verifyPassword } from '../utils/chatUtils';

// Create context
const AuthContext = createContext();

// Custom hook for using the auth context
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize auth state from localStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user data');
      }
    }
    setLoading(false);
  }, []);
  
  // Register new user
  const register = (username, password, confirmPassword) => {
    // Clear previous errors
    setError('');
    
    // Validation
    if (!username || !password) {
      setError('Username and password are required');
      return null;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return null;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return null;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return null;
    }
    
    // Check if username already exists
    const users = JSON.parse(localStorage.getItem('chat_users') || '[]');
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
      setError('Username already exists');
      return null;
    }
    
    // Create and store new user
    const hashedPassword = hashPassword(password);
    const newUser = {
      id: `user_${Date.now()}`,
      username: username.trim(),
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      isOnline: true,
    };
    
    // Save to localStorage
    const updatedUsers = [...users, newUser];
    localStorage.setItem('chat_users', JSON.stringify(updatedUsers));
    
    // Save current user session
    const userSession = { ...newUser };
    delete userSession.passwordHash; // Don't store password in session
    localStorage.setItem('chat_user', JSON.stringify(userSession));
    
    // Update state
    setCurrentUser(userSession);
    return userSession;
  };
  
  // Login user
  const login = (username, password) => {
    // Clear previous errors
    setError('');
    
    // Validation
    if (!username || !password) {
      setError('Username and password are required');
      return null;
    }
    
    // Find user
    const users = JSON.parse(localStorage.getItem('chat_users') || '[]');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      setError('Invalid username or password');
      return null;
    }
    
    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      setError('Invalid username or password');
      return null;
    }
    
    // User authenticated - create session
    const userSession = { ...user };
    delete userSession.passwordHash; // Don't store password in session
    userSession.isOnline = true;
    
    // Update user status in users list
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, isOnline: true, lastLoginAt: new Date().toISOString() } : u
    );
    localStorage.setItem('chat_users', JSON.stringify(updatedUsers));
    
    // Save session
    localStorage.setItem('chat_user', JSON.stringify(userSession));
    
    // Update state
    setCurrentUser(userSession);
    return userSession;
  };
  
  // Logout user
  const logout = () => {
    if (currentUser) {
      // Update user status in users list
      const users = JSON.parse(localStorage.getItem('chat_users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, isOnline: false, lastLogoutAt: new Date().toISOString() } : u
      );
      localStorage.setItem('chat_users', JSON.stringify(updatedUsers));
    }
    
    localStorage.removeItem('chat_user');
    setCurrentUser(null);
  };
  
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    setError
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}