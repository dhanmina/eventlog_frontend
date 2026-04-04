import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { fetchBlocks } from "../../../../services/api/blocks";
import { addUser } from "../../../../services/api/users";
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

const AddStudent = () => {
  const [formData, setFormData] = useState({
    id_number: "",
    role_id: "1",
    block_id: null,
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
  });
  const [blocks, setBlocks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blocksData = await fetchBlocks();
        if (Array.isArray(blocksData)) {
          const activeBlocks = blocksData.filter((b) => b.status === "Active");
          setBlocks(activeBlocks.map((b) => ({
            label: `${b.course_code || "N/A"} - ${b.block_name || `Block ${b.block_id}`}`,
            value: b.block_id,
          })));
        }
      } catch {
        setModal({ visible: true, title: "Error", message: "Failed to load blocks.", type: "error" });
      }
    };
    fetchData();
  }, []);

  const handleChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const isFormValid =
    formData.id_number.trim() &&
    formData.role_id &&
    formData.block_id &&
    formData.first_name.trim() &&
    formData.last_name.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!isFormValid) {
        setModal({ visible: true, title: "Warning", message: "Please fill in all required fields.", type: "warning" });
        return;
      }
      await addUser({
        id_number: formData.id_number,
        role_id: parseInt(formData.role_id, 10),
        block_id: parseInt(formData.block_id, 10),
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
      });
      setModal({ visible: true, title: "Success", message: "Student added successfully!", type: "success" });
      setFormData({ id_number: "", role_id: "1", block_id: null, first_name: "", middle_name: "", last_name: "", suffix: "" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to add student.", type: "error" });
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
        <Text style={styles.headerTitle}>ADD STUDENT</Text>
        <Text style={styles.headerSubtitle}>Register a new student account</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          type="id"
          iconShow={false}
          title="ID Number"
          example="1234567"
          value={formData.id_number}
          onChangeText={(text) => handleChange("id_number", text)}
        />
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
        <View style={styles.buttonContainer}>
          <CustomButton
            title={isSubmitting ? "ADDING..." : "ADD STUDENT"}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default AddStudent;

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
