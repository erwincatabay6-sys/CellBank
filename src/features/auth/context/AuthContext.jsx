import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  updateProfile as updateProfileRequest,
  changePassword as changePasswordRequest,
  uploadProfileImage as uploadProfileImageRequest,
} from "../../../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setAuthError("");

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);

      if (error.status !== 401) {
        setAuthError("Unable to check your session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function handleSessionExpired() {
      if (!user) {
        return;
      }

      setUser(null);
      setAuthError("");
      setSessionMessage("Your session has ended. Please sign in again.");
    }

    window.addEventListener("cellbank:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "cellbank:session-expired",
        handleSessionExpired,
      );
    };
  }, [user]);

  async function login(identifier, password) {
    await loginRequest(identifier, password);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setAuthError("");
    setSessionMessage("");

    return currentUser;
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
    setAuthError("");
    setSessionMessage("");
  }

  async function updateProfile(name) {
    const updatedUser = await updateProfileRequest(name);

    setUser(updatedUser);

    return updatedUser;
  }
  async function uploadProfileImage(file) {
    const updatedUser = await uploadProfileImageRequest(file);
    setUser(updatedUser);
    return updatedUser;
  }

  async function changePassword(currentPassword, newPassword) {
    await changePasswordRequest(currentPassword, newPassword);

    setSessionMessage(
      "Your password was changed successfully. Please sign in again.",
    );
    setAuthError("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        sessionMessage,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshSession,
        updateProfile,
        uploadProfileImage,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
