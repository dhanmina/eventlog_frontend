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
import { fetchBlocks } from "../../../../services/api/blocks";
import { fetchUserById, updateUser } from "../../../../services/api/users";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const ROLES = [
  { label: "Student", value: "1" },
  { label: "Officer", value: "2" },
];

const EditStudent = () => {
  const { id: id_number } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    id_number: "",
    role_id: null,
    block_id: null,
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: null,
    status: "Active",
  });
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  const getStatusOptions = () => {
    if (formData.status === "Not Enrolled") {
      return [
        { label: "Active", value: "Active" },
        { label: "Disabled", value: "Disabled" },
        { label: "Not Enrolled", value: "Not Enrolled" },
      ];
    }
    if (formData.status === "Unregistered") {
      return [
        { label: "Unregistered", value: "Unregistered" },
        { label: "Disabled", value: "Disabled" },
      ];
    }
    if (formData.status === "Disabled") {
      if (formData.email) {
        return [
          { label: "Disabled", value: "Disabled" },
          { label: "Active", value: "Active" },
        ];
      }
      return [
        { label: "Disabled", value: "Disabled" },
        { label: "Unregistered", value: "Unregistered" },
      ];
    }
    return [
      { label: "Active", value: "Active" },
      { label: "Disabled", value: "Disabled" },
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!id_number) throw new Error("Invalid student ID");

        const blocksData = await fetchBlocks();
        if (Array.isArray(blocksData)) {
          setBlocks(blocksData.filter((b) => b.status === "Active").map((b) => ({
            label: b.block_name || `Block ${b.block_id}`,
            value: b.block_id,
          })));
        }

        const studentDetails = await fetchUserById(id_number);
        if (!studentDetails) throw new Error("Student details not found");

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
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load student details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id_number]);

  const handleChange = (name, value) => {
    if (
      name === "email" &&
      (formData.status === "Unregistered" || formData.status === "Not Enrolled") &&
      typeof value === "string" && value.trim() !== ""
    ) {
      setModal({ visible: true, title: "Warning", message: `This student is currently ${formData.status.toLowerCase()}. Email cannot be added.`, type: "warning" });
      return;
    }
    if (name === "email" && typeof value === "string" && value.trim() === "") {
      setFormData((prev) => ({ ...prev, email: null }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    formData.id_number.trim() &&
    formData.role_id &&
    formData.block_id &&
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    (formData.status !== "Active" || formData.email);

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (formData.status === "Active" && !formData.email) {
        setModal({ visible: true, title: "Warning", message: "Email is required for active students.", type: "warning" });
        return;
      }
      setModal({ visible: true, title: "Warning", message: "Please fill in all required fields.", type: "warning" });
      return;
    }

    try {
      let emailValue = formData.email;
      if (formData.status === "Unregistered" || formData.status === "Not Enrolled") {
        emailValue = null;
      }
      await updateUser(id_number, {
        id_number: formData.id_number,
        role_id: parseInt(formData.role_id, 10),
        block_id: parseInt(formData.block_id, 10),
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: emailValue,
        status: formData.status,
      });
      setModal({ visible: true, title: "Success", message: "Student updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update student.", type: "error" });
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
        <Text style={styles.headerTitle}>EDIT STUDENT</Text>
        <Text style={styles.headerSubtitle}>Update student information</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          title="First Name"
          example="Juan Miguel"
          value={formData.first_name}
          onChangeText={(text) => handleChange("first_name", text)}
        />
        <FormField
          title="Middle Name (Optional)"
          example="Reyes"
          value={formData.middle_name}
          onChangeText={(text) => handleChange("middle_name", text)}
        />
        <FormField
          title="Last Name"
          example="Santos"
          value={formData.last_name}
          onChangeText={(text) => handleChange("last_name", text)}
        />
        <FormField
          title="Suffix (Optional)"
          example="Jr"
          value={formData.suffix}
          onChangeText={(text) => handleChange("suffix", text)}
        />
        <FormField
          title="Email"
          example="example@gmail.com"
          value={formData.email || ""}
          onChangeText={(text) => handleChange("email", text)}
          editable={formData.status !== "Unregistered" && formData.status !== "Not Enrolled"}
        />
        <CustomDropdown
          title="Block"
          data={blocks}
          placeholder="Select a block"
          value={formData.block_id}
          onSelect={(item) => handleChange("block_id", item?.value ?? "")}
        />
        <CustomDropdown
          title="Role"
          data={ROLES}
          placeholder="Select a role"
          value={formData.role_id}
          onSelect={(item) => handleChange("role_id", item?.value ?? "")}
        />
        <CustomDropdown
          title="Status"
          data={getStatusOptions()}
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

export default EditStudent;

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
