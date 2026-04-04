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
import { editAdmin, fetchAdminById } from "../../../../services/api/admins";
import { getStoredUser } from "../../../../database/queries";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const ROLE_OPTIONS = [
  { label: "Admin", value: 3 },
  { label: "Super Admin", value: 4 },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Disabled", value: "Disabled" },
];

const EditAdmin = () => {
  const { id_number: initialIdNumber } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    id_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    role_id: null,
    status: "Active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!initialIdNumber) throw new Error("Invalid admin ID");
        const adminDetails = await fetchAdminById(initialIdNumber);
        if (!adminDetails) throw new Error("Admin details not found");
        setFormData({
          id_number: adminDetails.id_number || "",
          first_name: adminDetails.first_name || "",
          middle_name: adminDetails.middle_name || "",
          last_name: adminDetails.last_name || "",
          suffix: adminDetails.suffix || "",
          email: adminDetails.email || "",
          role_id: adminDetails.role_id || null,
          status: adminDetails.status || "Active",
        });
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load admin details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [initialIdNumber]);

  const handleChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.first_name &&
    formData.last_name &&
    formData.role_id !== null;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setModal({ visible: true, title: "Warning", message: "Please fill in all required fields.", type: "warning" });
      return;
    }
    try {
      const currentUser = await getStoredUser();
      if (!currentUser) throw new Error("Failed to verify your account.");

      const isEditingOwnAccount = currentUser.id_number === initialIdNumber;
      if (isEditingOwnAccount && formData.status === "Disabled") {
        setModal({ visible: true, title: "Action Not Allowed", message: "You cannot disable your own account.", type: "error" });
        return;
      }

      await editAdmin(initialIdNumber, {
        new_id_number: formData.id_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: formData.email || null,
        role_id: formData.role_id,
        status: formData.status,
      });
      setModal({ visible: true, title: "Success", message: "Admin updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update admin.", type: "error" });
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
        <Text style={styles.headerTitle}>EDIT ADMIN</Text>
        <Text style={styles.headerSubtitle}>Update administrator information</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          data={ROLE_OPTIONS}
          value={formData.role_id}
          onSelect={(item) => handleChange("role_id", item?.value ?? "")}
        />
        <CustomDropdown
          title="Status"
          data={STATUS_OPTIONS}
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

export default EditAdmin;

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
