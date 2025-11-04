import { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      // when a user signs in, ensure a profile/doc exists in Firestore
      if (user) {
        try {
          await ensureUserDoc(user.uid, user.displayName || '', user.email || '', user.photoURL || '');
        } catch (err) {
          console.error('Error ensuring user doc:', err);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  // Ensure a user document exists in Firestore with a 3-digit userid and wallet balance
  async function ensureUserDoc(uid: string, name: string, email: string, photoURL: string) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log('User doc already exists for uid:', uid);
      return;
    }

    // generate unique 3-digit userid
    const generate3Digit = () => Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    let candidate = generate3Digit();
    // try up to 10 times to find a unique id
    for (let i = 0; i < 10; i++) {
      const q = query(collection(db, 'users'), where('userid', '==', candidate));
      const res = await getDocs(q);
      if (res.empty) break;
      candidate = generate3Digit();
    }

    const userData = {
      userid: candidate,
      uid,
      name,
      email,
      photoURL,
      wallet: {
        balance: 0,
      },
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, userData);
      console.log('Created user doc for uid:', uid, userData);
    } catch (err) {
      console.error('Failed to create user doc for uid:', uid, err);
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};