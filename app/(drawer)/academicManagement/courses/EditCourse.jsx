import React, { useCallback, useState, useEffect } from "react";
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
import {
  fetchDepartments,
  editCourse,
  fetchCourseById,
} from "../../../../services/api";
import CustomModal from "../../../../components/CustomModal";
import { useLocalSearchParams } from "expo-router";

const INITIAL_FORM_DATA = {
  course_name: "",
  course_code: "",
  short_name: "",
  department_id: null,
  status: "Active",
};

const INITIAL_MODAL = {
  visible: false,
  title: "",
  message: "",
  type: "success",
};

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
];

const toArray = (value) => (Array.isArray(value) ? value : []);

const getDepartmentList = (response) =>
  toArray(Array.isArray(response) ? response : response?.departments);

const formatDepartmentOptions = (departments) =>
  toArray(departments).map((department) => ({
    label: department.department_name,
    value: department.department_id,
  }));

const EditCourse = () => {
  const { id: course_id } = useLocalSearchParams();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(INITIAL_MODAL);

  const showModal = useCallback((title, message, type) => {
    setModal({ visible: true, title, message, type });
  }, []);

  const closeModal = useCallback(() => {
    setModal((currentModal) => ({ ...currentModal, visible: false }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!course_id) {
          throw new Error("Invalid course ID");
        }

        const departments = await fetchDepartments();
        setDepartmentOptions(
          formatDepartmentOptions(getDepartmentList(departments))
        );

        const courseDetails = await fetchCourseById(course_id);

        if (!courseDetails) {
          throw new Error("Course details not found");
        }

        setFormData({
          course_name: courseDetails.course_name || "",
          course_code: courseDetails.course_code || "",
          short_name: courseDetails.short_name || "",
          department_id: courseDetails.department_id || null,
          status: courseDetails.status || "Active",
        });
      } catch (error) {
        showModal(
          "Error",
          error.message || "Failed to load course details.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [course_id, showModal]);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const hasMissingRequiredFields =
        !formData.course_name.trim() || formData.department_id === null;

      if (hasMissingRequiredFields) {
        showModal("Warning", "Please fill in all required fields.", "warning");
        return;
      }

      const submitData = {
        course_name: formData.course_name,
        course_code: formData.course_code,
        department_id: formData.department_id,
        status: formData.status,
        short_name: formData.short_name.trim() || null,
      };

      await editCourse(course_id, submitData);

      showModal("Success", "Course updated successfully!", "success");
    } catch (error) {
      showModal(
        "Error",
        error.response?.data?.message || "Failed to update course.",
        "error",
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
        <Text style={styles.textTitle}>EDIT COURSE</Text>
      </View>

      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            title="Course Name"
            placeholder="Enter course name"
            value={formData.course_name}
            onChangeText={(text) => handleChange("course_name", text)}
          />

          <FormField
            title="Course Code"
            placeholder="Enter course code"
            value={formData.course_code}
            onChangeText={(text) => handleChange("course_code", text)}
          />

          <FormField
            title="Short Name (Optional)"
            placeholder="e.g. BSINFOTECH"
            value={formData.short_name}
            onChangeText={(text) => handleChange("short_name", text)}
          />

          <CustomDropdown
            title="Department"
            data={departmentOptions}
            placeholder="Select a department"
            value={formData.department_id}
            onSelect={(item) => handleChange("department_id", item.value)}
          />

          <CustomDropdown
            title="Status"
            data={STATUS_OPTIONS}
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

export default EditCourse;

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
