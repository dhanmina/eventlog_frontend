import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
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
    <View style={globalStyles.primaryContainer}>
      <View style={globalStyles.authContent}>
        <Text style={globalStyles.authTitle} numberOfLines={1} adjustsFontSizeToFit>
          SET NEW PASSWORD
        </Text>
        <Text style={globalStyles.authInfo}>
          Your password should be at least 8 characters long
        </Text>
        <View style={styles.form}>
          <FormField
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChangeText={setPassword}
            title="New Password"
            titleColor="secondary"
            borderColor="secondary"
          />
          <FormField
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            title="Confirm Password"
            titleColor="secondary"
            borderColor="secondary"
          />
          <CustomButton
            type="secondary"
            title="RESET PASSWORD"
            onPress={handleResetPassword}
          />
        </View>
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
    </View>
  );
};

export default NewPassword;

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
});
