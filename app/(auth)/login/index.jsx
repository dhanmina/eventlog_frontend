import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Checkbox from "expo-checkbox";
import axios from "axios";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { storeUser } from "../../../database/queries";
import CustomModal from "../../../components/CustomModal";
import theme from "../../../constants/theme";
import globalStyles from "../../../constants/globalStyles";
import Header from "../../../components/Header";
import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import { API_URL } from "../../../config/config";
import { useAuth } from "../../../context/AuthContext";

import ArialFont from "../../../assets/fonts/Arial.ttf";
import ArialBoldFont from "../../../assets/fonts/ArialBold.ttf";
import ArialItalicFont from "../../../assets/fonts/ArialItalic.ttf";
import SquadaOneFont from "../../../assets/fonts/SquadaOne.ttf";

const Login = () => {
  const { login: authLogin } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    Arial: ArialFont,
    ArialBold: ArialBoldFont,
    ArialItalic: ArialItalicFont,
    SquadaOne: SquadaOneFont,
  });

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: 'Arial';
          src: url('${ArialFont}') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'ArialBold';
          src: url('${ArialBoldFont}') format('truetype');
          font-display: swap;
          font-weight: bold;
        }
        @font-face {
          font-family: 'ArialItalic';
          src: url('${ArialItalicFont}') format('truetype');
          font-display: swap;
          font-style: italic;
        }
        @font-face {
          font-family: 'SquadaOne';
          src: url('${SquadaOneFont}') format('truetype');
          font-display: swap;
        }
      `;

      const existingStyle = document.getElementById("login-fonts");
      if (!existingStyle) {
        style.id = "login-fonts";
        document.head.appendChild(style);
      }

      setTimeout(() => {
        setFontsReady(true);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      if (fontsLoaded || fontError) {
        setFontsReady(true);
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsReady) return;

    const loadRememberedCredentials = async () => {
      try {
        const rememberedId = await AsyncStorage.getItem("rememberedId");
        const rememberedPassword = await AsyncStorage.getItem(
          "rememberedPassword"
        );
        const rememberedChecked = await AsyncStorage.getItem(
          "rememberedChecked"
        );

        if (
          rememberedId &&
          rememberedPassword &&
          rememberedChecked === "true"
        ) {
          setId(rememberedId);
          setPassword(rememberedPassword);
          setChecked(true);
        }
      } catch (error) {
        console.error("Error loading remembered credentials:", error);
      }
    };
    loadRememberedCredentials();
  }, [fontsReady]);

  const handleLogin = async () => {
    if (!id || !password) {
      setModalTitle("Login Error");
      setModalMessage("Please enter your credentials.");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        id_number: id,
        password: password,
      });

      if (response.status === 200) {
        const roleId = parseInt(response.data.user.role_id);

        if (Platform.OS === "web" && roleId !== 3 && roleId !== 4) {
          setModalTitle("Access Denied");
          setModalMessage("Invalid account.");
          setModalType("error");
          setModalVisible(true);
          return;
        }

        const userData = {
          ...response.data.user,
          full_name: `${response.data.user.first_name} ${
            response.data.user.middle_name ?? ""
          } ${response.data.user.last_name}`
            .replace(/\s+/g, " ")
            .trim(),
        };

        await authLogin(userData, response.data.token);

        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem("id_number", response.data.user.id_number);
        await AsyncStorage.setItem("email", response.data.user.email);
        await AsyncStorage.setItem(
          "role_id",
          String(response.data.user.role_id)
        );
        await AsyncStorage.setItem("full_name", userData.full_name);

        try {
          await storeUser(response.data.user);
        } catch (dbError) {
          console.error("Error storing user in local database:", dbError);
        }

        if (isChecked) {
          await AsyncStorage.setItem("rememberedId", id);
          await AsyncStorage.setItem("rememberedPassword", password);
          await AsyncStorage.setItem("rememberedChecked", "true");
        } else {
          await AsyncStorage.removeItem("rememberedId");
          await AsyncStorage.removeItem("rememberedPassword");
          await AsyncStorage.removeItem("rememberedChecked");
        }

        router.replace(Platform.OS === "web" ? "/web" : "/(tabs)/home");
      } else {
        setModalTitle("Login Failed");
        setModalMessage(
          response.data.message || "Invalid credentials. Please try again."
        );
        setModalType("error");
        setModalVisible(true);
      }
    } catch (error) {
      setModalTitle("Login Error");
      setModalMessage(
        error.response?.data?.message || "An error occurred during login."
      );
      setModalType("error");
      setModalVisible(true);
    }
  };

  if (!fontsReady) {
    return (
      <SafeAreaView
        style={[
          globalStyles.primaryContainer,
          { padding: 0, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={{
            fontFamily:
              Platform.OS === "web" ? "system-ui, sans-serif" : "System",
            fontSize: 18,
            color: theme.colors.secondary,
            marginBottom: 10,
          }}
        >
          Loading...
        </Text>
        {Platform.OS === "web" && (
          <Text
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 14,
              color: "#666",
              textAlign: "center",
            }}
          >
            Preparing custom fonts
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.primaryContainer, { padding: 0 }]}>
      <Header type="primary" />
      <Text style={styles.header}>WELCOME!</Text>
      <View style={styles.form}>
        <FormField
          type="id"
          value={id}
          onChangeText={setId}
          placeholder="ID Number"
        />
        <FormField
          type="password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
      </View>
      <View style={styles.rememberForgotContainer}>
        <View style={styles.rememberMeContainer}>
          <Checkbox
            style={styles.checkbox}
            value={isChecked}
            onValueChange={setChecked}
            color={isChecked ? "#81b0ff" : undefined}
          />
          <TouchableOpacity onPress={() => setChecked(!isChecked)}>
            <Text style={styles.rememberMe}>Remember Me</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.forgotPassContainer}>
          <TouchableOpacity
            onPress={() => router.push("/login/ForgotPassword")}
          >
            <Text style={styles.forgotPass}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <CustomButton type="secondary" title="Login" onPress={handleLogin} />
      </View>

      {Platform.OS !== "web" && (
        <View style={styles.registerContainer}>
          <Text style={styles.registerQ}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="auto" />
      <CustomModal
        cancelTitle="CLOSE"
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  header: {
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.display,
    fontFamily: "SquadaOne",
    marginBottom: theme.spacing.medium,
  },
  checkbox: {
    marginRight: theme.spacing.small,
    borderColor: theme.colors.secondary,
    borderWidth: 2,
    backgroundColor: "#FBF1E5",
    width: 20,
    height: 20,
  },
  rememberMe: {
    fontFamily: "Arial",
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberForgotContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    marginBottom: theme.spacing.large,
  },
  forgotPass: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    fontFamily: "Arial",
  },
  registerQ: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
    paddingRight: theme.spacing.small,
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.medium,
  },
  registerLink: {
    color: theme.colors.secondary,
    fontFamily: "ArialBold",
  },
  form: {
    width: "80%",
  },
  buttonContainer: {
    width: "80%",
  },
});
