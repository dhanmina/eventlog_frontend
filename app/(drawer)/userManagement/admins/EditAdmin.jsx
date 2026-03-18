import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import TabsComponent from "../../../../components/TabsComponent";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import { editAdmin, fetchAdminById } from "../../../../services/api/admins";
import CustomModal from "../../../../components/CustomModal";
import { useLocalSearchParams } from "expo-router";
import { getStoredUser } from "../../../../database/queries";

const EditAdmin = () => {
  const { id_number: initialIdNumber } = useLocalSearchParams();
  const [currentIdNumber, setCurrentIdNumber] = useState(initialIdNumber);
  const [formData, setFormData] = useState({
    id_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    role_id: null,
    status: "active",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const roleOptions = [
    { label: "Admin", value: 3 },
    { label: "Super Admin", value: 4 },
  ];

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Disabled", value: "Disabled" },
  ];

  const fetchAdminDetails = async (id) => {
    setIsLoading(true);
    try {
      if (!id) throw new Error("Invalid admin ID");

      const adminDetails = await fetchAdminById(id);
      if (!adminDetails) throw new Error("Admin details not found");

      setFormData({
        id_number: adminDetails.id_number || "",
        first_name: adminDetails.first_name || "",
        middle_name: adminDetails.middle_name || "",
        last_name: adminDetails.last_name || "",
        suffix: adminDetails.suffix || "",
        email: adminDetails.email || "",
        role_id: adminDetails.role_id || null,
        status: adminDetails.status || "active",
      });
    } catch (error) {
      setModal({
        visible: true,
        title: "Error",
        message: error.message || "Failed to load admin details.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDetails(initialIdNumber);
  }, [initialIdNumber]);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const currentUser = await getStoredUser();
      if (!currentUser) throw new Error("Failed to verify your account.");

      const isEditingOwnAccount = currentUser.id_number === currentIdNumber;

      if (isEditingOwnAccount && formData.status === "disabled") {
        setModal({
          visible: true,
          title: "Action Not Allowed",
          message: "You cannot disable your own account.",
          type: "error",
        });
        return;
      }

      if (
        !formData.first_name ||
        !formData.last_name ||
        formData.role_id === null
      ) {
        setModal({
          visible: true,
          title: "Warning",
          message: "Please fill in all required fields.",
          type: "warning",
        });
        return;
      }

      const submitData = {
        id_number: formData.id_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: formData.email || null,
        role_id: formData.role_id,
        status: formData.status,
      };

      await editAdmin(currentIdNumber, submitData);

      setModal({
        visible: true,
        title: "Success",
        message: "Admin updated successfully!",
        type: "success",
      });

      fetchAdminDetails(currentIdNumber);
    } catch (error) {
      setModal({
        visible: true,
        title: "Error",
        message: error.response?.data?.message || "Failed to update admin.",
        type: "error",
      });
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
        onClose={() => setModal({ ...modal, visible: false })}
        cancelTitle="CLOSE"
      />

      <Text style={styles.textHeader}>EVENTLOG</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>EDIT ADMIN</Text>
      </View>

      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <FormField
          title="First Name"
          value={formData.first_name}
          onChangeText={(text) => handleChange("first_name", text)}
        />
        <FormField
          title="Middle Name"
          value={formData.middle_name}
          onChangeText={(text) => handleChange("middle_name", text)}
        />
        <FormField
          title="Last Name"
          value={formData.last_name}
          onChangeText={(text) => handleChange("last_name", text)}
        />
        <FormField
          title="Suffix"
          value={formData.suffix}
          onChangeText={(text) => handleChange("suffix", text)}
        />
        <FormField
          title="Email"
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
        />
        <CustomDropdown
          title="Role"
          data={roleOptions}
          value={formData.role_id}
          onSelect={(item) => handleChange("role_id", item.value)}
        />
        <CustomDropdown
          title="Status"
          data={statusOptions}
          value={formData.status}
          onSelect={(item) => handleChange("status", item.value)}
        />
        <CustomButton title="UPDATE" onPress={handleSubmit} />
      </ScrollView>
      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default EditAdmin;

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
