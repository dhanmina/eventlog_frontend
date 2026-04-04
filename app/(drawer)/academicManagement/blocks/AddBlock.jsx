import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { addBlock } from "../../../../services/api/blocks";
import { fetchYearLevels } from "../../../../services/api/roles";
import { fetchDepartments } from "../../../../services/api/departments";
import { fetchCoursesByDepartmentId } from "../../../../services/api/courses";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomDropdown from "../../../../components/CustomDropdown";

const AddBlock = () => {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    course: "",
    year_level: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, yearLevelsData] = await Promise.all([
          fetchDepartments(),
          fetchYearLevels(),
        ]);
        if (deptResponse.success) {
          setDepartments(
            deptResponse.departments.map((d) => ({
              label: d.department_name,
              value: d.department_id,
            }))
          );
        }
        setYearLevels(
          yearLevelsData.map((y) => ({
            label: y.year_level_name,
            value: y.year_level_id,
          }))
        );
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load data.", type: "error" });
      }
    };
    fetchData();
  }, []);

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
      setModal({ visible: true, title: "Error", message: "Failed to load courses.", type: "error" });
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.department &&
    formData.course &&
    formData.year_level;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addBlock({
        name: formData.name,
        course_id: formData.course,
        year_level_id: formData.year_level,
        department_id: formData.department,
      });
      setModal({ visible: true, title: "Success", message: "Block added successfully!", type: "success" });
      setFormData({ name: "", department: "", course: "", year_level: "" });
      setCourses([]);
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to add block.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>ADD BLOCK</Text>
        <Text style={styles.headerSubtitle}>Create a new section</Text>
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
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
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
        <View style={styles.buttonContainer}>
          <CustomButton
            title={isSubmitting ? "ADDING..." : "ADD BLOCK"}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default AddBlock;

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
