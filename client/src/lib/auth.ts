import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = false): Promise<FirebaseUser> => {
  // Set persistence based on rememberMe option
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Create user with email and password
export const createUserWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  if (!auth) {
    // Return empty function if auth is not available
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Get or create user in our database
export const getOrCreateUser = async (firebaseUser: FirebaseUser) => {
  try {
    // Try to get existing user
    const response = await fetch(`/api/users/firebase/${firebaseUser.uid}`, {
      credentials: "include",
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status === 404) {
      // User doesn't exist, create new one
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        role: "user", // Default role
      };

      const createResponse = await apiRequest("POST", "/api/users", userData);
      return await createResponse.json();
    }

    throw new Error("Failed to get or create user");
  } catch (error) {
    console.error("Error getting or creating user:", error);
    throw error;
  }
};

// Combined function for representative authentication
export const signInWithFirebase = async (email: string, password: string, isRegistration: boolean = false): Promise<FirebaseUser> => {
  if (isRegistration) {
    return await createUserWithEmail(email, password);
  } else {
    return await signInWithEmail(email, password, true);
  }
};

// Hook for authentication (simplified)
export const useAuth = () => {
  return {
    signInWithFirebase,
    signOut: signOutUser,
  };
};
