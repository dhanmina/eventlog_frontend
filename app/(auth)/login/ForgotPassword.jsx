import { Text, View } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import axios from "axios";

import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import globalStyles from "../../../constants/globalStyles";
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
    <View style={globalStyles.primaryContainer}>
      <View style={globalStyles.authContent}>
        <Text style={globalStyles.authTitle} numberOfLines={1} adjustsFontSizeToFit>
          FORGOT PASSWORD
        </Text>
        <Text style={globalStyles.authInfo}>
          Please enter your email to reset your password.
        </Text>
        <FormField
          type="email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
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
        cancelTitle="CLOSE"
      />

      <StatusBar style="auto" />
    </View>
  );
};

export default ForgotPassword;
