import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import { API_URL } from "../../../config/config";

const VerifyCode = () => {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "",
  });

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const showModal = (title, message, type = "error") => {
    setModal({ visible: true, title, message, type });
  };

  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const handleResend = async () => {
    try {
      setTimer(60);
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
      });

      if (response.status === 200) {
        showModal("Success", "A new code has been sent to your email.", "success");
      } else {
        throw new Error("Failed to resend the code. Please try again later.");
      }
    } catch (error) {
      showModal(
        "Error",
        error.response?.data?.message ||
          "Failed to resend the code. Please try again later.",
      );
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join("");
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/reset-password/confirm`,
        { email, reset_code: enteredCode },
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.status === 200) {
        router.push(`/login/NewPassword?email=${encodeURIComponent(email)}`);
      } else {
        setIsCodeValid(false);
        showModal("Error", "Invalid code, please try again.");
      }
    } catch (error) {
      setIsCodeValid(false);
      showModal("Error", "Please check the code and try again.");
    }
  };

  return (
    <View style={globalStyles.primaryContainer}>
      <View style={globalStyles.authContent}>
        <Text style={globalStyles.authTitle} numberOfLines={1} adjustsFontSizeToFit>CHECK YOUR EMAIL</Text>
        <Text style={globalStyles.authInfo}>
          Enter the 5-digit code sent to {email}
        </Text>
        <FormField
          type="code"
          value={code}
          onChangeText={setCode}
          error={!isCodeValid ? "Invalid code, please try again." : ""}
        />
        <CustomButton
          type="secondary"
          title="VERIFY CODE"
          onPress={handleVerifyCode}
        />
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
      </View>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        cancelTitle="CLOSE"
      />

      <StatusBar style="auto" />
    </View>
  );
};

export default VerifyCode;

const styles = StyleSheet.create({
  resendContainer: {
    alignItems: "center",
    alignSelf: "center",
  },
  timerText: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
  },
  resendText: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
  },
  question: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
  },
});
