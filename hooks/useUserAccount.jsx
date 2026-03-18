import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { clearAllTablesData, getStoredUser } from "../database/queries";
import { stopSync } from "../services/api/sync";

const useUserAccount = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getStoredUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      stopSync();
      await clearAllTablesData();
      await AsyncStorage.multiRemove(["userToken", "id_number"]);
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return { user, handleLogout };
};

export default useUserAccount;
