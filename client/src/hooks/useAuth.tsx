import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, getOrCreateUser } from "@/lib/auth";
import type { User } from "@shared/schema";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  impersonatedCompany: any | null;
  isImpersonating: boolean;
  impersonateCompany: (company: any) => void;
  stopImpersonation: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedCompany, setImpersonatedCompany] = useState<any | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for temporary user first
        const tempUserData = localStorage.getItem('tempUser');
        if (tempUserData) {
          const tempUser = JSON.parse(tempUserData);
          setUser(tempUser);
          setLoading(false);
          return;
        }

        // If no temp user, check Firebase auth
        const unsubscribe = onAuthStateChange(async (firebaseUser) => {
          try {
            setFirebaseUser(firebaseUser);
            
            if (firebaseUser) {
              // Get or create user in our database
              const dbUser = await getOrCreateUser(firebaseUser);
              setUser(dbUser);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error("Error handling auth state change:", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error checking auth:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAdmin = user?.role === "admin" || (typeof user?.role === 'object' && (user?.role as any)?.nombre === "admin");

  const impersonateCompany = (company: any) => {
    if (isAdmin) {
      setImpersonatedCompany(company);
      setIsImpersonating(true);
    }
  };

  const stopImpersonation = () => {
    setImpersonatedCompany(null);
    setIsImpersonating(false);
  };

  const signOut = () => {
    // Clear temporary user data
    localStorage.removeItem('tempUser');
    setUser(null);
    setFirebaseUser(null);
    // Also clear any Firebase auth if present
    if (firebaseUser) {
      import('@/lib/auth').then(({ signOutUser }) => signOutUser());
    }
  };

  const value = {
    firebaseUser,
    user,
    loading,
    isAdmin,
    impersonatedCompany,
    isImpersonating,
    impersonateCompany,
    stopImpersonation,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
