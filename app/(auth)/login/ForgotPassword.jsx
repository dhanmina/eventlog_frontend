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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalType, setModalType] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      setModalType("error");
      setModalTitle("Invalid Email");
      setModalMessage(
        "The email address provided is not valid. Please check and try again."
      );
      setModalVisible(true);
      return;
    }

    try {
      await resetPassword(email);
      router.push(`/login/VerifyCode?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(
        error.message || "No account found with this email. Please check your email or register."
      );
      setModalVisible(true);
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
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
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
