import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { fetchDepartments } from "../../../../services/api/departments";
import { editCourse, fetchCourseById } from "../../../../services/api/courses";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
];

const EditCourse = () => {
  const { id: course_id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    course_name: "",
    course_code: "",
    department_id: "",
    status: "Active",
  });
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!course_id) throw new Error("Invalid course ID");

        const [deptResponse, courseDetails] = await Promise.all([
          fetchDepartments(),
          fetchCourseById(course_id),
        ]);

        if (deptResponse?.departments) {
          setDepartments(
            deptResponse.departments.map((d) => ({
              label: d.department_name,
              value: d.department_id,
            }))
          );
        }

        if (!courseDetails) throw new Error("Course details not found");
        setFormData({
          course_name: courseDetails.course_name || "",
          course_code: courseDetails.course_code || "",
          department_id: courseDetails.department_id || "",
          status: courseDetails.status || "Active",
        });
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load course details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [course_id]);

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.course_name.trim() &&
    formData.course_code.trim() &&
    formData.department_id &&
    formData.status;

  const handleSubmit = async () => {
    try {
      await editCourse(course_id, {
        name: formData.course_name,
        course_code: formData.course_code,
        department_id: formData.department_id,
        status: formData.status,
      });
      setModal({ visible: true, title: "Success", message: "Course updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update course.", type: "error" });
    }
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal((m) => ({ ...m, visible: false }))}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>EDIT COURSE</Text>
        <Text style={styles.headerSubtitle}>Update course information</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
        <CustomDropdown
          title="Department"
          data={departments}
          placeholder="Select Department"
          value={formData.department_id}
          onSelect={(item) => handleChange("department_id", item?.value ?? "")}
        />
        <CustomDropdown
          title="Status"
          data={STATUS_OPTIONS}
          placeholder="Select Status"
          value={formData.status}
          onSelect={(item) => handleChange("status", item?.value ?? "")}
        />
        <View style={styles.buttonContainer}>
          <CustomButton title="UPDATE" onPress={handleSubmit} disabled={!isFormValid} />
        </View>
      </ScrollView>
    </View>
  );
};

export default EditCourse;

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  headerTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  headerSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.55,
    marginTop: 3,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
  },
});
