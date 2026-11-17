import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from './firebase';
import { authService } from './firebase-services';
import { initializeFirestoreCollections, checkCollectionStatus } from './firestore-collections';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<User>;
  signin: (email: string, password: string) => Promise<User>;
  signout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      if (!isMounted) return;

      if (currentUser) {
        setUser(currentUser);
        try {
          await initializeFirestoreCollections();
          await checkCollectionStatus();
        } catch (err) {
          console.warn('Firestore collections init:', err);
        }
      } else {
        // In personal app mode, automatically sign in anonymously in the background so Firestore sync functions seamlessly
        try {
          const anonUser = await authService.signInAnonymously();
          if (isMounted && anonUser) {
            setUser(anonUser);
          }
        } catch (err) {
          console.warn('Personal local mode (anonymous auth offline):', err);
          if (isMounted) setUser(null);
        }
      }
      
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string) => {
    setError(null);
    try {
      const user = await authService.signup(email, password);
      return user;
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      throw err;
    }
  };

  const signin = async (email: string, password: string) => {
    setError(null);
    try {
      const user = await authService.signin(email, password);
      return user;
    } catch (err: any) {
      const errorMessage = err.message || 'Signin failed';
      setError(errorMessage);
      throw err;
    }
  };

  const signout = async () => {
    setError(null);
    try {
      await authService.signout();
    } catch (err: any) {
      const errorMessage = err.message || 'Signout failed';
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (err: any) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signup,
        signin,
        signout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
