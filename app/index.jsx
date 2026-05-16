import React, { useEffect, useState } from "react";
import { StyleSheet, Text, Image, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import theme from "../constants/theme";
import globalStyles from "../constants/globalStyles";
import images from "../constants/images";
import CustomButton from "../components/CustomButton";
import CustomModal from "../components/CustomModal";
import NetInfo from "@react-native-community/netinfo";

import ArialFont from "../assets/fonts/Arial.ttf";
import ArialBoldFont from "../assets/fonts/ArialBold.ttf";
import ArialItalicFont from "../assets/fonts/ArialItalic.ttf";
import SquadaOneFont from "../assets/fonts/SquadaOne.ttf";

const FONT_SOURCES = {
  Arial: require("../assets/fonts/Arial.ttf"),
  ArialBold: require("../assets/fonts/ArialBold.ttf"),
  ArialItalic: require("../assets/fonts/ArialItalic.ttf"),
  SquadaOne: require("../assets/fonts/SquadaOne.ttf"),
};

const WEB_FONT_FACES = [
  {
    family: "Arial",
    source: ArialFont,
    declarations: "",
  },
  {
    family: "ArialBold",
    source: ArialBoldFont,
    declarations: "font-weight: bold;",
  },
  {
    family: "ArialItalic",
    source: ArialItalicFont,
    declarations: "font-style: italic;",
  },
  {
    family: "SquadaOne",
    source: SquadaOneFont,
    declarations: "",
  },
];

const createWebFontCss = () =>
  WEB_FONT_FACES.map(
    ({ family, source, declarations }) => `
        @font-face {
          font-family: '${family}';
          src: url('${source}') format('truetype');
          font-display: swap;
          ${declarations}
        }
      `
  ).join("");

const webFontLoaders = WEB_FONT_FACES.map(({ family }) => `16px ${family}`);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);

  const [fontsReady, setFontsReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [isOfflineModalVisible, setIsOfflineModalVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      console.log("App: Registering fonts for web...");

      const style = document.createElement("style");
      style.textContent = createWebFontCss();

      const existingStyle = document.getElementById("app-custom-fonts");
      if (!existingStyle) {
        style.id = "app-custom-fonts";
        document.head.appendChild(style);
        console.log("App: Font CSS added to document");
      }

      if (document.fonts) {
        Promise.all(webFontLoaders.map((font) => document.fonts.load(font)))
          .then(() => {
            console.log("App: All fonts loaded successfully");
            setFontsReady(true);
          })
          .catch((error) => {
            console.warn("App: Font loading failed:", error);
            setFontsReady(true);
          });
      } else {
        setTimeout(() => {
          console.log("App: Using fallback font loading method");
          setFontsReady(true);
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" && fontsLoaded && !fontError) {
      setFontsReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        if (!fontsReady) return;

        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          await SplashScreen.hideAsync();
          router.replace("/(tabs)/home");
          return;
        }

        if (Platform.OS === "web") {
          await SplashScreen.hideAsync();
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error during app preparation:", error);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, [fontsReady]);

  const handleLoginPress = async () => {
    await navigateWhenOnline("/login");
  };

  const handleRegisterPress = async () => {
    await navigateWhenOnline("/signup");
  };

  const navigateWhenOnline = async (route) => {
    const netInfoState = await NetInfo.fetch();
    if (!netInfoState.isConnected) {
      setIsOfflineModalVisible(true);
      return;
    }
    router.push(route);
  };

  const closeOfflineModal = () => {
    setIsOfflineModalVisible(false);
  };

  if (!appReady || !fontsReady) {
    return Platform.OS === "web" ? (
      <View
        style={[
          globalStyles.secondaryContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={{
            fontFamily:
              Platform.OS === "web" ? "system-ui, sans-serif" : "system",
            fontSize: 18,
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
              marginTop: 10,
            }}
          >
            Preparing application fonts
          </Text>
        )}
      </View>
    ) : null;
  }

  return (
    <SafeAreaView style={[globalStyles.secondaryContainer, { padding: 0 }]}>
      <Text style={styles.header}>EVENTLOG</Text>
      <View style={styles.logoContainer}>
        <Image source={images.logo} style={styles.logo} />
      </View>
      <Text style={styles.tagline}>Every CIT Event's Companion</Text>

      <View style={styles.buttons}>
        <View style={styles.loginContainer}>
          <CustomButton
            type="primary"
            title="LOG IN"
            onPress={handleLoginPress}
          />
        </View>
        <CustomButton
          type="secondary"
          title="REGISTER"
          onPress={handleRegisterPress}
        />
      </View>
      <StatusBar style="auto" />

      <CustomModal
        visible={isOfflineModalVisible}
        title="No Internet Connection"
        message="Please check your internet connection and try again."
        type="error"
        onClose={closeOfflineModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    fontSize: theme.fontSizes.display,
    textAlign: "center",
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  logoContainer: {
    padding: 20,
  },
  tagline: {
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    fontSize: theme.fontSizes.huge,
    textAlign: "center",
  },
  buttons: {
    paddingTop: 20,
    paddingHorizontal: 20,
    width: "70%",
  },
  loginContainer: {
    marginBottom: theme.spacing.medium,
    marginTop: theme.spacing.medium,
  },
});
