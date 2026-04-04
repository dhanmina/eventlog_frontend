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
import { editDepartment, fetchDepartmentById } from "../../../../services/api/departments";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomDropdown from "../../../../components/CustomDropdown";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
];

const EditDepartment = () => {
  const { id: department_id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
    status: "Active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!department_id) throw new Error("Invalid department ID");
        const details = await fetchDepartmentById(department_id);
        if (!details) throw new Error("Department details not found");
        setFormData({
          department_name: details.department_name || "",
          department_code: details.department_code || "",
          status: details.status || "Active",
        });
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load department details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [department_id]);

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.department_name.trim() &&
    formData.department_code.trim() &&
    formData.status;

  const handleSubmit = async () => {
    try {
      await editDepartment(department_id, {
        department_name: formData.department_name,
        department_code: formData.department_code,
        status: formData.status,
      });
      setModal({ visible: true, title: "Success", message: "Department updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update department.", type: "error" });
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
        <Text style={styles.headerTitle}>EDIT DEPARTMENT</Text>
        <Text style={styles.headerSubtitle}>Update department information</Text>
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

export default EditDepartment;

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
