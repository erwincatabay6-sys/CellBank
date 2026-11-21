import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { RequestError } from "../../../api/http.js";

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
  const profileRequest = useRef(0);

  const refreshSession = useCallback(async () => {
    profileRequest.current++;
    setLoading(true);
    setAuthError("");

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);

      if (error.status !== 401) {
        setAuthError(
          error instanceof RequestError
            ? error.message
            : "Unable to check your session. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const request = ++profileRequest.current;
    const currentUser = await getCurrentUser();
    if (request === profileRequest.current) setUser(currentUser);
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

      profileRequest.current++;
      setUser(null);
      setAuthError("");
      setSessionMessage("Your session has ended. Please sign in again.");
    }

    function handleVerificationRequired() {
      profileRequest.current++;
      setUser((current) => current ? { ...current, emailVerified: false } : current);
    }

    window.addEventListener("cellbank:email-verification-required", handleVerificationRequired);
    window.addEventListener("cellbank:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("cellbank:email-verification-required", handleVerificationRequired);
      window.removeEventListener(
        "cellbank:session-expired",
        handleSessionExpired,
      );
    };
  }, [user]);

  async function login(identifier, password) {
    profileRequest.current++;
    await loginRequest(identifier, password);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setAuthError("");
    setSessionMessage("");

    return currentUser;
  }

  async function logout() {
    await logoutRequest();
    profileRequest.current++;
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
