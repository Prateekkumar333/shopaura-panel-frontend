import { createContext, useState, useEffect, useContext } from 'react';
import API from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await API.get('/auth/check');

      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Register new user (supports role: buyer, seller, or admin)
  const register = async (name, email, password, role = 'buyer') => {
    try {
      const { data } = await API.post('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';

      return { success: false, message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', {
        email,
        password,
      });

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Invalid email or password';

      return { success: false, message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await API.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error.response.data);
      // Still clear local state even if server fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh user data (useful after profile update)
  const refreshUser = async () => {
    await checkAuth();
  };

  // Computed role checks
  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller';
  const isBuyer = user?.role === 'buyer';

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    checkAuth,
    refreshUser,
    isAdmin,
    isSeller,
    isBuyer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
