import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { resetPassword } from "../../../services/api";

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const INITIAL_MODAL_STATE = {
  visible: false,
  title: "",
  message: "",
  type: "",
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [modal, setModal] = useState(INITIAL_MODAL_STATE);
  const router = useRouter();

  const showErrorModal = (title, message) => {
    setModal({
      visible: true,
      title,
      message,
      type: "error",
    });
  };

  const closeModal = () => {
    setModal((currentModal) => ({
      ...currentModal,
      visible: false,
    }));
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      showErrorModal(
        "Invalid Email",
        "The email address provided is not valid. Please check and try again."
      );
      return;
    }

    try {
      await resetPassword(email);
      router.push(`/login/VerifyCode?email=${encodeURIComponent(email)}`);
    } catch (error) {
      showErrorModal(
        "Error",
        error.message || "No account found with this email. Please check your email or register."
      );
    }
  };

  return (
    <SafeAreaView style={[globalStyles.primaryContainer, { paddingTop: 0 }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.forgotPassword}>FORGOT PASSWORD</Text>
        <Text style={styles.info}>
          Please enter your email to reset your password.
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <FormField
          type="email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.buttonContainer}>
        <CustomButton
          type="secondary"
          title="RESET PASSWORD"
          onPress={handleResetPassword}
        />
      </View>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  forgotPassword: {
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.huge,
    color: theme.colors.secondary,
  },
  info: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.xlarge,
    width: "80%",
    paddingHorizontal: theme.spacing.medium,
  },
  inputContainer: {
    marginTop: theme.spacing.medium,
    width: "100%",
    paddingHorizontal: theme.spacing.medium,
  },
});

export default ForgotPassword;
