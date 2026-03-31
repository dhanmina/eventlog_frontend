import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import CustomButton from "../../components/CustomButton";
import globalStyles from "../../constants/globalStyles";
import theme from "../../constants/theme";
import WebHeader from "../../components/WebHeader";
import icons from "../../constants/icons";
import useUserAccount from "../../hooks/useUserAccount";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ArialFont from "../../assets/fonts/Arial.ttf";
import ArialBoldFont from "../../assets/fonts/ArialBold.ttf";
import ArialItalicFont from "../../assets/fonts/ArialItalic.ttf";
import SquadaOneFont from "../../assets/fonts/SquadaOne.ttf";

const Account = () => {
  const [fontsLoaded, fontError] = useFonts({
    Arial: require("../../assets/fonts/Arial.ttf"),
    ArialBold: require("../../assets/fonts/ArialBold.ttf"),
    ArialItalic: require("../../assets/fonts/ArialItalic.ttf"),
    SquadaOne: require("../../assets/fonts/SquadaOne.ttf"),
  });

  const [fontsReady, setFontsReady] = useState(false);
  const { user, handleLogout } = useUserAccount();

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    idNumber: "",
    email: "",
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      console.log("Account: Registering fonts for web...");

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

      const existingStyle = document.getElementById("account-custom-fonts");
      if (!existingStyle) {
        style.id = "account-custom-fonts";
        document.head.appendChild(style);
        console.log("Account: Font CSS added to document");
      }

      if (document.fonts) {
        Promise.all([
          document.fonts.load("16px Arial"),
          document.fonts.load("16px ArialBold"),
          document.fonts.load("16px ArialItalic"),
          document.fonts.load("16px SquadaOne"),
        ])
          .then(() => {
            console.log("Account: All fonts loaded successfully");
            setFontsReady(true);
          })
          .catch((error) => {
            console.warn("Account: Font loading failed:", error);
            setFontsReady(true);
          });
      } else {
        setTimeout(() => {
          console.log("Account: Using fallback font loading method");
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
    const loadUserInfo = async () => {
      if (!fontsReady) return;

      try {
        const [fullName, idNumber, email] = await Promise.all([
          AsyncStorage.getItem("full_name"),
          AsyncStorage.getItem("id_number"),
          AsyncStorage.getItem("email"),
        ]);

        setUserInfo({
          fullName: fullName || "N/A",
          idNumber: idNumber || "N/A",
          email: email || "N/A",
        });

        console.log("User Info Loaded:", { fullName, idNumber, email });
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };

    loadUserInfo();
  }, [fontsReady]);

  if (!fontsReady) {
    return (
      <SafeAreaView
        style={[
          globalStyles.secondaryContainer,
          { padding: 0, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={{
            fontFamily:
              Platform.OS === "web" ? "system-ui, sans-serif" : "system",
            fontSize: 18,
            color: theme.colors.primary,
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
            Preparing account interface
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.secondaryContainer, { padding: 0 }]}>
      <View style={{ width: "100%" }}>
        <WebHeader type="secondary" />
      </View>
      <Text style={styles.title}>ACCOUNT</Text>
      <ScrollView
        style={{ width: "80%" }}
        contentContainerStyle={{
          paddingBottom: theme.spacing.xlarge,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsWrapper}>
          <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailsTitle}>Name: </Text>
            <Text style={styles.details}>{userInfo.fullName}</Text>
          </View>
          <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailsTitle}>ID Number: </Text>
            <Text style={styles.details}>{userInfo.idNumber}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Email: </Text>
            <Text style={styles.details}>{userInfo.email}</Text>
          </View>
        </View>

        <View style={styles.contactUsContainer}>
          {user?.role_id === 3 || user?.role_id === 4 ? (
            <View style={styles.buttonContainer}>
              <CustomButton
                type="primary"
                title="ADD EVENT"
                onPress={() => router.push("/account/AddEvent")}
                otherStyles={styles.button}
              />
              <CustomButton
                type="secondary"
                title="EDIT EVENT"
                onPress={() => router.push("/account/EventsList")}
                otherStyles={styles.button}
              />
            </View>
          ) : (
            <View style={{ height: theme.spacing.medium }} />
          )}

          <Text style={styles.contactUs}>Contact Us</Text>
          <View style={styles.line} />
          <Text style={styles.school}>UNIVERSITY OF CAGAYAN VALLEY</Text>
          <Text style={styles.department}>
            COLLEGE OF INFORMATION TECHNOLOGY
          </Text>
          <Text style={styles.address}>
            VHNP Building 4th Floor - New Site Campus, Balzain, Tuguegarao City,
            Cagayan
          </Text>

          <View>
            <View style={styles.socialsContainer}>
              <Image source={icons.email} style={styles.icon} />
              <Text style={styles.socialText}>
                cit_eventlogsupport@gmail.com
              </Text>
            </View>
            <View style={styles.socialsContainer}>
              <Image source={icons.facebook} style={styles.icon} />
              <Text style={styles.socialText}>CITofficial.UCV</Text>
            </View>
          </View>

          <View style={[styles.buttonContainer, styles.logout]}>
            <CustomButton
              type="primary"
              title="Logout"
              onPress={handleLogout}
              otherStyles={styles.button}
            />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default Account;

const styles = StyleSheet.create({
  title: {
    fontSize: theme.fontSizes.display,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 2,
    padding: theme.spacing.medium,
    borderColor: theme.colors.primary,
  },
  details: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
  },
  detailsTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
  },
  contactUs: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    marginTop: theme.spacing.medium,
  },
  line: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    width: "100%",
  },
  contactUsContainer: {
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    alignItems: "center",
  },
  school: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    marginTop: theme.spacing.medium,
  },
  department: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    textAlign: "center",
  },
  address: {
    textAlign: "center",
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
  },
  icon: {
    tintColor: theme.colors.primary,
    width: 24,
    height: 24,
  },
  socialText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    paddingLeft: theme.spacing.medium,
  },
  socialsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: theme.spacing.medium,
  },
  button: {
    marginTop: theme.spacing.medium,
  },
  buttonContainer: {
    width: "80%",
  },
  logout: {
    marginTop: theme.spacing.medium,
  },
});
