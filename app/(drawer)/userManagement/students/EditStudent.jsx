import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import CustomModal from "../../../../components/CustomModal";
import {
  fetchBlocks,
  fetchUserById,
  updateUser,
} from "../../../../services/api";
import { useLocalSearchParams } from "expo-router";

const INITIAL_FORM_DATA = {
  id_number: "",
  role_id: null,
  block_id: null,
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  email: null,
  status: "Active",
};

const INITIAL_MODAL = {
  visible: false,
  title: "",
  message: "",
  type: "success",
};

const ROLE_OPTIONS = [
  { label: "Student", value: "1" },
  { label: "Officer", value: "2" },
];

const ACTIVE_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
];

const NOT_ENROLLED_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
  { label: "Not Enrolled", value: "Not Enrolled" },
];

const UNREGISTERED_STATUS_OPTIONS = [
  { label: "Unregistered", value: "Unregistered" },
  { label: "Disabled", value: "Disabled" },
];

const DISABLED_WITH_EMAIL_STATUS_OPTIONS = [
  { label: "Disabled", value: "Disabled" },
  { label: "Active", value: "Active" },
];

const DISABLED_WITHOUT_EMAIL_STATUS_OPTIONS = [
  { label: "Disabled", value: "Disabled" },
  { label: "Unregistered", value: "Unregistered" },
];

const formatBlockOption = (block) => ({
  label: block.block_name || `Block ${block.block_id}`,
  value: block.block_id,
});

const EditStudent = () => {
  const { id: id_number } = useLocalSearchParams();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(INITIAL_MODAL);

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

  const statusOptions = useMemo(() => {
    if (formData.status === "Not Enrolled") {
      return NOT_ENROLLED_STATUS_OPTIONS;
    }
    if (formData.status === "Unregistered") {
      return UNREGISTERED_STATUS_OPTIONS;
    }
    if (formData.status === "Disabled") {
      return formData.email
        ? DISABLED_WITH_EMAIL_STATUS_OPTIONS
        : DISABLED_WITHOUT_EMAIL_STATUS_OPTIONS;
    }
    return ACTIVE_STATUS_OPTIONS;
  }, [formData.email, formData.status]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!id_number) {
          throw new Error("Invalid student ID");
        }

        const blocksData = await fetchBlocks();
        setBlocks(
          blocksData
            .filter((block) => block.status === "Active")
            .map(formatBlockOption)
        );

        const studentDetails = await fetchUserById(id_number);
        if (!studentDetails) {
          throw new Error("Student details not found");
        }

        setFormData({
          id_number: studentDetails.id_number || "",
          role_id: String(studentDetails.role_id) || null,
          block_id: studentDetails.block_id || null,
          first_name: studentDetails.first_name || "",
          middle_name: studentDetails.middle_name || "",
          last_name: studentDetails.last_name || "",
          suffix: studentDetails.suffix || "",
          email: studentDetails.email || null,
          status: studentDetails.status || "Active",
        });
      } catch (error) {
        showModal(
          "Error",
          error.message || "Failed to load student details.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id_number, showModal]);

  const handleChange = (name, value) => {
    if (
      name === "email" &&
      (formData.status === "Unregistered" ||
        formData.status === "Not Enrolled") &&
      value.trim() !== ""
    ) {
      setFormData((prevFormData) => ({ ...prevFormData, email: null }));
      showModal(
        "Warning",
        `This student is currently ${formData.status.toLowerCase()}. Email cannot be added.`,
        "warning"
      );
      return;
    }
    if (name === "email" && value.trim() === "") {
      setFormData((prevFormData) => ({ ...prevFormData, email: null }));
      return;
    }
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.id_number.trim() ||
        !formData.role_id ||
        !formData.block_id ||
        !formData.first_name.trim() ||
        !formData.last_name.trim()
      ) {
        showModal("Warning", "Please fill in all required fields.", "warning");
        return;
      }

      if (formData.status === "Active" && !formData.email) {
        showModal("Warning", "Email is required for active students.", "warning");
        return;
      }

      let emailValue = formData.email;
      if (
        formData.status === "Unregistered" ||
        formData.status === "Not Enrolled"
      ) {
        emailValue = null;
      }

      const submitData = {
        id_number: formData.id_number,
        role_id: parseInt(formData.role_id, 10),
        block_id: parseInt(formData.block_id, 10),
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: emailValue,
        status: formData.status,
      };

      await updateUser(id_number, submitData);

      showModal("Success", "Student updated successfully!", "success");
    } catch (error) {
      showModal(
        "Error",
        error.response?.data?.message || "Failed to update student.",
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
        <Text style={styles.textTitle}>EDIT STUDENT DETAILS</Text>
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            title="First Name"
            example="Juan Miguel"
            exampleColor="primary"
            value={formData.first_name}
            onChangeText={(text) => handleChange("first_name", text)}
          />
          <FormField
            title="Middle Name (Optional)"
            example="Reyes"
            exampleColor="primary"
            value={formData.middle_name}
            onChangeText={(text) => handleChange("middle_name", text)}
          />
          <FormField
            title="Last Name"
            example="Santos"
            exampleColor="primary"
            value={formData.last_name}
            onChangeText={(text) => handleChange("last_name", text)}
          />
          <FormField
            title="Suffix (Optional)"
            example="Jr"
            exampleColor="primary"
            value={formData.suffix}
            onChangeText={(text) => handleChange("suffix", text)}
          />
          <FormField
            title="Email"
            example="example@gmail.com"
            exampleColor="primary"
            value={formData.email || ""}
            onChangeText={(text) => handleChange("email", text)}
            editable={
              formData.status !== "Unregistered" &&
              formData.status !== "Not Enrolled"
            }
          />
          <CustomDropdown
            title="Block"
            data={blocks}
            placeholder="Select a block"
            value={formData.block_id}
            onSelect={(item) => handleChange("block_id", item.value)}
          />
          <CustomDropdown
            title="Role"
            data={ROLE_OPTIONS}
            placeholder="Select a role"
            value={formData.role_id}
            onSelect={(item) => handleChange("role_id", item.value)}
          />
          <CustomDropdown
            title="Status"
            data={statusOptions}
            value={formData.status}
            onSelect={(item) => handleChange("status", item.value)}
          />
        </View>
        <View>
          <CustomButton title="UPDATE" onPress={handleSubmit} />
        </View>
      </ScrollView>
      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default EditStudent;

const styles = StyleSheet.create({
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
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
    justifyContent: "space-between",
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
