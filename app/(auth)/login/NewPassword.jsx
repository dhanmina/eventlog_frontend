import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { changeUserPassword } from "../../../services/api/users";

const NewPassword = () => {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "",
  });

  const showModal = (title, message, type = "error") => {
    setModal({ visible: true, title, message, type });
  };

  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      showModal("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      showModal("Invalid Password", "Password should be at least 8 characters long.");
      return;
    }

    try {
      await changeUserPassword(email, password);
      showModal("Success", "Password successfully reset. Please log in.", "success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      showModal(
        "Error",
        error.response?.data?.message || "An error occurred. Please try again.",
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
            SET NEW PASSWORD
          </Text>
          <Text style={styles.subtitle}>
            Your new password must be at least 8 characters long.
          </Text>
          <FormField
            type="password"
            placeholder="New password"
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
          <CustomButton title="RESET PASSWORD" onPress={handleResetPassword} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        cancelTitle="CLOSE"
        onClose={closeModal}
      />

      <StatusBar style="light" />
    </View>
  );
};

export default NewPassword;

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
