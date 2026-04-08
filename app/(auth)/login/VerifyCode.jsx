import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { resetPassword, confirmResetPassword } from "../../../services/api";

const VerifyCode = () => {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const handleResend = async () => {
    try {
      setTimer(60);
      await resetPassword(email);
      setModalType("success");
      setModalTitle("Success");
      setModalMessage("A new code has been sent to your email.");
      setModalVisible(true);
    } catch (error) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(error.message || "Failed to resend the code. Please try again later.");
      setModalVisible(true);
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join("");
    try {
      await confirmResetPassword(email, enteredCode, "");
      setTimeout(() =>
        router.push(`/login/NewPassword?email=${encodeURIComponent(email)}`)
      );
    } catch (error) {
      setIsCodeValid(false);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(error.message || "Please check the code and try again.");
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={globalStyles.primaryContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.forgotPassword}>CHECK YOUR EMAIL</Text>
        <Text style={styles.info}>Enter the 5-digit code sent to {email}</Text>
      </View>

      <FormField
        type="code"
        value={code}
        onChangeText={setCode}
        error={!isCodeValid ? "Invalid code, please try again." : ""}
      />

      <View style={styles.buttonContainer}>
        <CustomButton
          type="secondary"
          title="VERIFY CODE"
          onPress={handleVerifyCode}
        />
      </View>

      <View style={styles.resendContainer}>
        <Text style={styles.question}>Didn't receive the code?</Text>
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend code in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendText}>Resend code</Text>
          </TouchableOpacity>
        )}
      </View>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default VerifyCode;

const styles = StyleSheet.create({
  forgotPassword: {
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.huge,
    color: theme.colors.secondary,
  },
  headerContainer: {
    width: "80%",
    marginBottom: theme.spacing.medium,
  },
  info: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
  },
  resendContainer: {
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.xlarge,
    alignItems: "center",
  },
  timerText: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
    fontSize: theme.fontSizes.small,
  },
  resendText: {
    color: theme.colors.secondary,
    fontFamily: "ArialBold",
    fontSize: theme.fontSizes.small,
  },
  question: {
    color: theme.colors.secondary,
    fontFamily: "Arial",
    fontSize: theme.fontSizes.small,
  },
  buttonContainer: {
    width: "80%",
    paddingHorizontal: theme.spacing.medium,
  },
});
