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
import { changeUserPassword } from "../../../services/api/users";

const NewPassword = () => {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setModalType("error");
      setModalTitle("Password Mismatch");
      setModalMessage("Passwords do not match. Please try again.");
      setModalVisible(true);
      return;
    }
    if (password.length < 8) {
      setModalType("error");
      setModalTitle("Invalid Password");
      setModalMessage("Password should be at least 8 characters long.");
      setModalVisible(true);
      return;
    }

    try {
      await changeUserPassword(email, password);

      setModalType("success");
      setModalTitle("Success");
      setModalMessage("Password successfully reset. Please log in.");
      setModalVisible(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(
        error.response?.data?.message || "An error occurred. Please try again."
      );
      setModalVisible(true);
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
          type="primary"
          title="RESET PASSWORD"
          onPress={handleResetPassword}
        />
      </View>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        cancelTitle="CLOSE"
        onClose={() => setModalVisible(false)}
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
    color: theme.colors.primary,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.medium,
  },
  info: {
    color: theme.colors.gray,
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
