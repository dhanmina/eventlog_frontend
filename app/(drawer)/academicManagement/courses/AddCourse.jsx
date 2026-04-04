import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { fetchDepartments } from "../../../../services/api/departments";
import { addCourse } from "../../../../services/api/courses";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const AddCourse = () => {
  const [formData, setFormData] = useState({
    course_name: "",
    course_code: "",
    department_id: "",
  });
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchDepartments();
        if (response?.departments) {
          setDepartments(
            response.departments.map((d) => ({
              label: d.department_name,
              value: d.department_id,
            }))
          );
        }
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load departments.", type: "error" });
      }
    };
    fetchData();
  }, []);

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.course_name.trim() &&
    formData.course_code.trim() &&
    formData.department_id;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addCourse({
        course_name: formData.course_name,
        course_code: formData.course_code,
        department_id: formData.department_id,
      });
      setModal({ visible: true, title: "Success", message: "Course added successfully!", type: "success" });
      setFormData({ course_name: "", course_code: "", department_id: "" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to add course.", type: "error" });
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
        <Text style={styles.headerTitle}>ADD COURSE</Text>
        <Text style={styles.headerSubtitle}>Create a new course</Text>
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
        <View style={styles.buttonContainer}>
          <CustomButton
            title={isSubmitting ? "ADDING..." : "ADD COURSE"}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default AddCourse;

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
