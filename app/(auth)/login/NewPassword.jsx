import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { changeUserPassword } from "../../../services/api";

const INITIAL_MODAL_STATE = {
  visible: false,
  title: "",
  message: "",
  type: "",
};

const NewPassword = () => {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modal, setModal] = useState(INITIAL_MODAL_STATE);

  const showModal = (type, title, message) => {
    setModal({
      visible: true,
      title,
      message,
      type,
    });
  };

  const closeModal = () => {
    setModal((currentModal) => ({
      ...currentModal,
      visible: false,
    }));
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      showModal("error", "Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      showModal("error", "Invalid Password", "Password should be at least 8 characters long.");
      return;
    }

    try {
      await changeUserPassword(email, password);

      showModal("success", "Success", "Password successfully reset. Please log in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      showModal("error", "Error", error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[globalStyles.primaryContainer, { paddingTop: 0 }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.forgotPassword}>SET NEW PASSWORD</Text>
        <Text style={styles.info}>
          Your password should be at least 8 characters long
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <FormField
          type="password"
          placeholder="Enter your new password"
          value={password}
          onChangeText={setPassword}
          title="New Password"
        />
        <FormField
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          title="Confirm Password"
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
        cancelTitle="CLOSE"
        onClose={closeModal}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default NewPassword;

const styles = StyleSheet.create({
  forgotPassword: {
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.huge,
    color: theme.colors.secondary,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.medium,
  },
  info: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
    width: "80%",
  },
  inputContainer: {
    width: "100%",
    paddingHorizontal: theme.spacing.medium,
  },
});
