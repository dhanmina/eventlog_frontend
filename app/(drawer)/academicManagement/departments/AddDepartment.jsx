import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { addDepartment } from "../../../../services/api/departments";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const AddDepartment = () => {
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.department_name.trim() && formData.department_code.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addDepartment({
        department_name: formData.department_name,
        department_code: formData.department_code,
      });
      setModal({ visible: true, title: "Success", message: "Department added successfully!", type: "success" });
      setFormData({ department_name: "", department_code: "" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to add department.", type: "error" });
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
        <Text style={styles.headerTitle}>ADD DEPARTMENT</Text>
        <Text style={styles.headerSubtitle}>Create a new department</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
        <View style={styles.buttonContainer}>
          <CustomButton
            title={isSubmitting ? "ADDING..." : "ADD DEPARTMENT"}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default AddDepartment;

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
