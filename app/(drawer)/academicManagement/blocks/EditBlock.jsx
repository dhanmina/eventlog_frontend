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
import { fetchBlockById, editBlock } from "../../../../services/api/blocks";
import { fetchYearLevels } from "../../../../services/api/roles";
import { fetchDepartments } from "../../../../services/api/departments";
import { fetchCoursesByDepartmentId } from "../../../../services/api/courses";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomDropdown from "../../../../components/CustomDropdown";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
  { label: "Archived", value: "Archived" },
];

const EditBlock = () => {
  const { id: block_id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    block_name: "",
    course: "",
    year_level: "",
    department: "",
    status: "Active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!block_id) throw new Error("Invalid block ID");

        const blockDetails = await fetchBlockById(block_id);
        if (!blockDetails) throw new Error("Block details not found");

        setFormData({
          block_name: blockDetails.block_name || "",
          course: blockDetails.course_id || "",
          year_level: blockDetails.year_level_id || "",
          department: blockDetails.department_id || "",
          status: blockDetails.status || "Active",
        });

        const [departmentsData, yearLevelsData] = await Promise.all([
          fetchDepartments(),
          fetchYearLevels(),
        ]);

        setDepartments(
          departmentsData.departments.map((d) => ({
            label: d.department_name,
            value: d.department_id,
          }))
        );
        setYearLevels(
          yearLevelsData.map((y) => ({
            label: y.year_level_name,
            value: y.year_level_id,
          }))
        );

        if (blockDetails.department_id) {
          const coursesData = await fetchCoursesByDepartmentId(blockDetails.department_id);
          setCourses(
            coursesData.map((c) => ({ label: c.course_code, value: c.course_id }))
          );
        }
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load block details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [block_id]);

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleDepartmentChange = async (item) => {
    if (!item) {
      handleChange("department", "");
      handleChange("course", "");
      setCourses([]);
      return;
    }
    handleChange("department", item.value);
    handleChange("course", "");
    try {
      const coursesData = await fetchCoursesByDepartmentId(item.value);
      setCourses(coursesData.map((c) => ({ label: c.course_code, value: c.course_id })));
    } catch {
      setModal({ visible: true, title: "Error", message: "Failed to load courses for the selected department.", type: "error" });
    }
  };

  const isFormValid =
    formData.block_name.trim() &&
    formData.department &&
    formData.course &&
    formData.year_level &&
    formData.status;

  const handleSubmit = async () => {
    if (!formData.block_name.trim() || !formData.course || !formData.year_level || !formData.department) {
      setModal({ visible: true, title: "Warning", message: "Please fill in all required fields.", type: "warning" });
      return;
    }
    try {
      await editBlock(block_id, {
        name: formData.block_name,
        course_id: formData.course,
        year_level_id: formData.year_level,
        status: formData.status,
      });
      setModal({ visible: true, title: "Success", message: "Block updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update block.", type: "error" });
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
        <Text style={styles.headerTitle}>EDIT BLOCK</Text>
        <Text style={styles.headerSubtitle}>Update block information</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          title="Block Name"
          placeholder="Enter block name"
          value={formData.block_name}
          onChangeText={(text) => handleChange("block_name", text)}
        />
        <CustomDropdown
          title="Department"
          data={departments}
          placeholder="Select Department"
          value={formData.department}
          onSelect={handleDepartmentChange}
        />
        <CustomDropdown
          title="Course"
          data={courses}
          placeholder="Select Course"
          value={formData.course}
          onSelect={(item) => handleChange("course", item?.value ?? "")}
        />
        <CustomDropdown
          title="Year Level"
          data={yearLevels}
          placeholder="Select Year Level"
          value={formData.year_level}
          onSelect={(item) => handleChange("year_level", item?.value ?? "")}
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

export default EditBlock;

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
