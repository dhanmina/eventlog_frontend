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
import CustomButton from "../../../../components/CustomButton";
import { editDepartment, fetchDepartmentById } from "../../../../services/api/departments";
import CustomModal from "../../../../components/CustomModal";
import { useLocalSearchParams } from "expo-router";
import CustomDropdown from "../../../../components/CustomDropdown";

const EditDepartment = () => {
  const { id: department_id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
    status: "active",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Disabled", value: "Disabled" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!department_id) {
          throw new Error("Invalid department ID");
        }

        const departmentDetails = await fetchDepartmentById(department_id);

        if (!departmentDetails) {
          throw new Error("Department details not found");
        }

        setFormData({
          department_name: departmentDetails.department_name || "",
          department_code: departmentDetails.department_code || "",
          status: departmentDetails.status || "active",
        });
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: error.message || "Failed to load department details.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [department_id]);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.department_name.trim() ||
        !formData.department_code.trim()
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
        department_name: formData.department_name,
        department_code: formData.department_code,
        status: formData.status,
      };

      await editDepartment(department_id, submitData);

      setModal({
        visible: true,
        title: "Success",
        message: "Department updated successfully!",
        type: "success",
      });
    } catch (error) {
      setModal({
        visible: true,
        title: "Error",
        message:
          error.response?.data?.message || "Failed to update department.",
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
        <Text style={styles.textTitle}>EDIT DEPARTMENT</Text>
      </View>

      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            title="Department Name"
            placeholder="Enter department name"
            value={formData.department_name}
            onChangeText={(text) => handleChange("department_name", text)}
          />

          <FormField
            title="Department Code"
            placeholder="Enter department code"
            value={formData.department_code}
            onChangeText={(text) => handleChange("department_code", text)}
          />

          <CustomDropdown
            title="Status"
            data={statusOptions}
            placeholder="Select Status"
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

export default EditDepartment;

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
