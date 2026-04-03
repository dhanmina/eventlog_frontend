import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import axios from "axios";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { API_URL } from "../../../config/config";

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "",
  });

  const showModal = (title, message) => {
    setModal({ visible: true, title, message, type: "error" });
  };

  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      showModal(
        "Invalid Email",
        "The email address provided is not valid. Please check and try again.",
      );
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
      });

      if (response.status === 200) {
        router.push(`/login/VerifyCode?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      showModal(
        "Error",
        "No account found with this email. Please check your email or register.",
      );
    }
  };

  return (
    <View style={[globalStyles.primaryContainer, styles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.card}
      >
        <ScrollView
          contentContainerStyle={styles.scrollview}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            FORGOT PASSWORD
          </Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a reset code.
          </Text>
          <FormField
            type="email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <CustomButton title="SEND CODE" onPress={handleResetPassword} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        cancelTitle="CLOSE"
      />

      <StatusBar style="light" />
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-start",
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: theme.colors.secondary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollview: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xlarge,
    paddingTop: theme.spacing.large,
    paddingBottom: 60,
    gap: theme.spacing.medium,
  },
  title: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    color: theme.colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.gray,
    textAlign: "center",
    marginTop: -theme.spacing.small,
  },
});
