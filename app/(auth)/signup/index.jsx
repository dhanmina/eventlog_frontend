import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import theme from "../../../constants/theme";
import globalStyles from "../../../constants/globalStyles";

import Header from "../../../components/Header";
import FormField from "../../../components/FormField";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";

import { fetchPublicDepartments, signup } from "../../../services/api";

const SignUp = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    password: "",
    confirm_password: "",
    department_id: null,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const depts = await fetchPublicDepartments();
      setDepartments(
        depts.map((dept) => ({
          label: dept.department_name,
          value: dept.department_id,
        })),
      );
    } catch (error) {
      showModal("Failed to load departments. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (message, type) => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id_number: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      email: "",
      password: "",
      confirm_password: "",
      department_id: null,
    });
  };

  const handleRegister = async () => {
    if (
      !formData.id_number ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirm_password ||
      !formData.department_id
    ) {
      showModal("Please fill in all required fields.", "warning");
      return;
    }

    if (formData.password.length < 8) {
      showModal("Password must be at least 8 characters long.", "error");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      showModal("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      await signup({
        id_number: formData.id_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: formData.email,
        password: formData.password,
        department_id: formData.department_id,
      });

      showModal("Registration successful!", "success");
      resetForm();
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      showModal(
        error.response?.data?.message || "Something went wrong.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = { iconShow: false };

  return (
    <SafeAreaView style={[globalStyles.primaryContainer, styles.safeArea]} edges={["top"]}>
      <View style={styles.logoSection}>
        <Header type="primary" style={styles.header} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.card}
      >
        <ScrollView
          contentContainerStyle={styles.scrollview}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>REGISTER</Text>

          <FormField
            type="id"
            placeholder="ID Number"
            value={formData.id_number}
            onChangeText={(value) => handleInputChange("id_number", value)}
            {...fieldProps}
          />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField
                placeholder="First Name"
                value={formData.first_name}
                onChangeText={(value) => handleInputChange("first_name", value)}
                {...fieldProps}
              />
            </View>
            <View style={styles.flex1}>
              <FormField
                placeholder="Last Name"
                value={formData.last_name}
                onChangeText={(value) => handleInputChange("last_name", value)}
                {...fieldProps}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField
                placeholder="Middle Name"
                value={formData.middle_name}
                onChangeText={(value) => handleInputChange("middle_name", value)}
                {...fieldProps}
              />
            </View>
            <View style={styles.flex1}>
              <FormField
                placeholder="Suffix"
                value={formData.suffix}
                onChangeText={(value) => handleInputChange("suffix", value)}
                {...fieldProps}
              />
            </View>
          </View>
          <FormField
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            {...fieldProps}
          />

          {loading ? (
            <Text style={styles.loadingText}>Loading departments...</Text>
          ) : (
            <CustomDropdown
              placeholder="Department"
              data={departments}
              value={formData.department_id}
              onSelect={(selected) =>
                handleInputChange("department_id", selected?.value ?? null)
              }
            />
          )}

          <FormField
            type="password"
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            {...fieldProps}
          />
          <FormField
            type="password"
            placeholder="Confirm Password"
            value={formData.confirm_password}
            onChangeText={(value) => handleInputChange("confirm_password", value)}
            {...fieldProps}
          />

          <Text style={styles.agreement}>
            By registering, you agree to the terms and conditions set by the
            College of Information Technology Department. Please use only one
            account.
          </Text>

          <CustomButton
            title="REGISTER"
            onPress={handleRegister}
            disabled={loading}
          />

          <View style={styles.footer}>
            <Text style={styles.prompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        message={modalMessage}
        type={modalType}
        cancelTitle="CLOSE"
        onClose={() => setModalVisible(false)}
      />

      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    justifyContent: "flex-start",
  },
  logoSection: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginTop: 0,
    marginBottom: 0,
  },
  card: {
    flex: 3,
    width: "100%",
    backgroundColor: theme.colors.secondary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollview: {
    paddingHorizontal: theme.spacing.xlarge,
    paddingTop: theme.spacing.large,
    paddingBottom: 60,
  },
  title: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.small,
  },
  flex1: {
    flex: 1,
  },
  loadingText: {
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.gray,
    fontSize: theme.fontSizes.medium,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  agreement: {
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.gray,
    fontSize: theme.fontSizes.extraSmall,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
    opacity: 0.8,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: theme.spacing.small,
  },
  prompt: {
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.gray,
    fontSize: theme.fontSizes.small,
  },
  loginText: {
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
  },
});
