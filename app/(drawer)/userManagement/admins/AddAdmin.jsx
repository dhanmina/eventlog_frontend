import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useState } from "react";

import { StatusBar } from "expo-status-bar";
import TabsComponent from "../../../../components/TabsComponent";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import { addAdmin } from "../../../../services/api";
import CustomModal from "../../../../components/CustomModal";

const INITIAL_FORM_DATA = {
  id_number: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  email: "",
  role_id: null,
};

const INITIAL_MODAL = {
  visible: false,
  title: "",
  message: "",
  type: "success",
};

const ROLE_OPTIONS = [
  { label: "Admin", value: 3 },
  { label: "Super Admin", value: 4 },
];

const AddAdmin = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(INITIAL_MODAL);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const showModal = useCallback((title, message, type) => {
    setModal({
      visible: true,
      title,
      message,
      type,
    });
  }, []);

  const closeModal = () => {
    setModal((prevModal) => ({ ...prevModal, visible: false }));
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.id_number ||
        !formData.first_name ||
        !formData.last_name ||
        !formData.email.trim() ||
        formData.role_id === null
      ) {
        showModal("Warning", "Please fill in all required fields.", "warning");
        return;
      }

      const submitData = {
        id_number: formData.id_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        email: formData.email,
        role_id: formData.role_id,
      };

      await addAdmin(submitData);
      showModal("Success", "Admin added successfully!", "success");
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      showModal(
        "Error",
        error.response?.data?.message ||
          "Failed to add admin. Please try again.",
        "error"
      );
    }
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        cancelTitle="CLOSE"
      />

      <Text style={styles.textHeader}>EVENTLOG</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>ADD ADMIN</Text>
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <FormField
          type="id"
          iconShow={false}
          title="ID Number"
          placeholder="12345678"
          value={formData.id_number}
          onChangeText={(text) => handleChange("id_number", text)}
        />
        <FormField
          title="First Name"
          placeholder="Juan Miguel"
          value={formData.first_name}
          onChangeText={(text) => handleChange("first_name", text)}
        />
        <FormField
          title="Middle Name"
          placeholder="Reyes"
          value={formData.middle_name}
          onChangeText={(text) => handleChange("middle_name", text)}
        />
        <FormField
          title="Last Name"
          placeholder="Santos"
          value={formData.last_name}
          onChangeText={(text) => handleChange("last_name", text)}
        />
        <FormField
          title="Suffix"
          placeholder="Jr"
          value={formData.suffix}
          onChangeText={(text) => handleChange("suffix", text)}
        />
        <FormField
          type="email"
          iconShow={false}
          title="Email"
          placeholder="example@gmail.com"
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
        />

        <CustomDropdown
          title="Role"
          data={ROLE_OPTIONS}
          placeholder="Select a role"
          value={formData.role_id}
          onSelect={(item) => handleChange("role_id", item.value)}
        />

        <CustomButton title="ADD" onPress={handleSubmit} />
      </ScrollView>

      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default AddAdmin;

const styles = StyleSheet.create({
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollviewContainer: {
    width: "100%",
    marginBottom: 90,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderTopWidth: 0,
  },
  scrollview: {
    flexGrow: 1,
    padding: theme.spacing.medium,
  },
  titleContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  textTitle: {
    fontSize: theme.fontSizes.extraLarge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
});
