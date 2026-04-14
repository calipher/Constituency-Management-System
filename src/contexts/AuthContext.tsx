import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(currentUser);
          setRole(userSnap.data().role);
        } else {
          // If default admin, create profile
          if (currentUser.email === 'calipherrndlovu@gmail.com') {
            await setDoc(userRef, {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Admin',
              email: currentUser.email,
              role: 'admin',
              createdAt: new Date().toISOString()
            });
            setUser(currentUser);
            setRole('admin');
          } else if (currentUser.email) {
            // Check invitations
            const invRef = doc(db, 'invitations', currentUser.email);
            const invSnap = await getDoc(invRef);
            
            if (invSnap.exists()) {
              const invitedRole = invSnap.data().role;
              await setDoc(userRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Staff',
                email: currentUser.email,
                role: invitedRole,
                createdAt: new Date().toISOString()
              });
              // Delete the invitation after successful registration
              await deleteDoc(invRef);
              setUser(currentUser);
              setRole(invitedRole);
            } else {
              // Not invited
              await signOut(auth);
              setUser(null);
              setRole(null);
              alert("You are not authorized to access this system. Please contact an administrator.");
            }
          }
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
