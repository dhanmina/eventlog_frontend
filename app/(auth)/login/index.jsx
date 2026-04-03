import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import icons from "../../../constants/icons";
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
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "",
  });
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
        console.warn("[Login] Failed to load remembered credentials:", error);
      }
    };
    loadRememberedCredentials();
  }, [fontsReady]);

  const showModal = (title, message) => {
    setModal({ visible: true, title, message, type: "error" });
  };

  const handleLogin = async () => {
    if (!id || !password) {
      showModal("Login Error", "Please enter your credentials.");
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
          showModal("Access Denied", "Invalid account.");
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
          console.warn("[Login] Failed to store user locally:", dbError);
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
        showModal(
          "Login Failed",
          response.data.message || "Invalid credentials. Please try again."
        );
      }
    } catch (error) {
      showModal(
        "Login Error",
        error.response?.data?.message || "An error occurred during login."
      );
    }
  };

  if (!fontsReady) {
    return (
      <SafeAreaView style={[globalStyles.primaryContainer, { padding: 0 }]}>
        <Text style={styles.loadingText}>Loading...</Text>
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
          <TouchableOpacity
            style={[styles.checkbox, isChecked && styles.checkboxChecked]}
            onPress={() => setChecked(!isChecked)}
          >
            {isChecked && (
              <Image source={icons.check} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChecked(!isChecked)}>
            <Text style={styles.rememberMe}>Remember Me</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push("/login/ForgotPassword")}>
          <Text style={styles.forgotPass}>Forgot Password?</Text>
        </TouchableOpacity>
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
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  loadingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  header: {
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.title,
    fontFamily: theme.fontFamily.SquadaOne,
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.medium,
  },
  form: {
    width: "80%",
    marginBottom: theme.spacing.small,
  },
  rememberForgotContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    marginBottom: theme.spacing.large,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: theme.spacing.small,
    borderColor: theme.colors.secondary,
    borderWidth: 2,
    backgroundColor: "transparent",
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.secondary,
  },
  checkIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
  },
  rememberMe: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
  },
  forgotPass: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
  },
  buttonContainer: {
    width: "80%",
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.medium,
  },
  registerQ: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
    marginRight: theme.spacing.small,
  },
  registerLink: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.ArialBold,
  },
});
