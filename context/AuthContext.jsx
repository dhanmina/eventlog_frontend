import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getStoredUser, clearAllTablesData } from "../database/queries";
import { stopSync } from "../services/api/sync";
import { io } from "socket.io-client";
import { API_URL } from "../config/config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    socketRef.current = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);

    try {
      await AsyncStorage.multiRemove([
        "userToken",
        "id_number",
        "email",
        "role_id",
        "full_name",
        "user",
        "userData",
      ]);
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  }, []);

  const showGlobalModal = useCallback((title, message, type = "success") => {
    setModalConfig({ title, message, type });
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    if (modalConfig.title === "Session Expired") {
      router.replace("/login");
    }
  }, [modalConfig.title]);

  const handleSessionExpired = useCallback(
    async (customMessage = null) => {
      await logout();

      const message =
        customMessage ||
        "Your session has expired. Please contact support for assistance.";

      showGlobalModal("Session Expired", message, "error");

      setTimeout(() => {
        router.replace("/login");
      }, 3000);
    },
    [logout, showGlobalModal],
  );

  useEffect(() => {
    if (!socketRef.current || !user) {
      return;
    }

    const userIdStr = String(user.id_number);

    const handleUserDisabled = (eventData) => {
      const isCurrentUser =
        eventData.userId === userIdStr ||
        eventData.id_number === userIdStr ||
        eventData.email === user.email;
      if (isCurrentUser) {
        handleSessionExpired(
          "Your account has been disabled. Please contact support for assistance.",
        );
      }
    };

    const handleAdminDisabled = (eventData) => {
      if (String(eventData.id_number) === userIdStr) {
        handleSessionExpired(
          "Your account has been disabled. Please contact support for assistance.",
        );
      }
    };

    const handleBlockStatusUpdated = (eventData) => {
      if (
        (user.role_id === 1 || user.role_id === 2) &&
        user.block_id &&
        String(eventData.block_id) === String(user.block_id) &&
        eventData.status === "Disabled"
      ) {
        handleSessionExpired(
          "Your block has been disabled. Please contact support for assistance.",
        );
      }
    };

    const handleSchoolYearChanged = async () => {
      try {
        stopSync();
        await clearAllTablesData();
      } catch {}
      await logout();
      showGlobalModal(
        "New School Year",
        "A new school year has started. Please log in again.",
        "warning",
      );
      setTimeout(() => {
        router.replace("/login");
      }, 3000);
    };

    socketRef.current.on("user-disabled", handleUserDisabled);
    socketRef.current.on("admin-disabled", handleAdminDisabled);
    socketRef.current.on("block-status-updated", handleBlockStatusUpdated);
    socketRef.current.on("school-year-changed", handleSchoolYearChanged);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("user-disabled", handleUserDisabled);
        socketRef.current.off("admin-disabled", handleAdminDisabled);
        socketRef.current.off("block-status-updated", handleBlockStatusUpdated);
        socketRef.current.off("school-year-changed", handleSchoolYearChanged);
      }
    };
  }, [user, handleSessionExpired, logout, showGlobalModal]);

  useEffect(() => {
    if (!user) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" &&
        socketRef.current &&
        !socketRef.current.connected
      ) {
        socketRef.current.connect();
      }
    });
    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await getStoredUser();
        if (storedUser) {
          if (
            storedUser.status === "Disabled" ||
            storedUser.isActive === false
          ) {
            handleSessionExpired("Your account has been disabled.");
            return;
          }
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading stored user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, [handleSessionExpired]);

  const checkUserStatus = useCallback(async () => {
    if (!user) return true;

    try {
      const currentUser = await getStoredUser();

      if (
        currentUser &&
        (currentUser.status === "Disabled" || currentUser.isActive === false)
      ) {
        handleSessionExpired("Your account has been disabled.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking user status:", error);
      return true;
    }
  }, [user, handleSessionExpired]);

  const login = async (userData, token) => {
    if (userData.status === "Disabled" || userData.isActive === false) {
      showGlobalModal(
        "Access Denied",
        "Your account has been disabled. Please contact support for assistance.",
        "error",
      );
      return false;
    }

    setUser(userData);
    setIsAuthenticated(true);

    if (token) {
      try {
        await AsyncStorage.setItem("userToken", token);
      } catch (error) {
        console.error("Error storing token:", error);
      }
    }

    return true;
  };

  const updateUser = useCallback(
    (userData) => {
      if (userData.status === "Disabled" || userData.isActive === false) {
        handleSessionExpired("Your account has been disabled.");
        return;
      }

      setUser(userData);
      setIsAuthenticated(true);
    },
    [handleSessionExpired],
  );

  const validateSession = useCallback(async () => {
    return await checkUserStatus();
  }, [checkUserStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        modalVisible,
        modalConfig,
        closeModal,
        showGlobalModal,
        handleSessionExpired,
        validateSession,
        checkUserStatus,
        socket: socketRef.current,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
