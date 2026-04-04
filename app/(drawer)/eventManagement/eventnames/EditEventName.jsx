import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { fetchEventNameById, editEventName } from "../../../../services/api/events";
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

const EditEventName = () => {
  const { id: eventNameId } = useLocalSearchParams();
  const [formData, setFormData] = useState({ name: "", status: "Active" });
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!eventNameId) throw new Error("Invalid event name ID");
        const data = await fetchEventNameById(eventNameId);
        if (!data?.data) throw new Error("Event name details not found");
        const { name, status } = data.data;
        if (!name?.trim() || name.trim() === "0") {
          setModal({ visible: true, title: "Warning", message: "The fetched event name is invalid or missing.", type: "warning" });
          return;
        }
        setFormData({ name: name?.trim() || "", status: status || "Active" });
      } catch (error) {
        setModal({ visible: true, title: "Error", message: error.message || "Failed to load event name details.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [eventNameId]);

  const handleChange = (name, value) => {
    const trimmedValue = name === "name" && typeof value === "string" ? value.trim() : value;
    setFormData((prev) => ({ ...prev, [name]: trimmedValue }));
  };

  const handleSubmit = async () => {
    if (!formData.name || typeof formData.name !== "string" || !formData.name.trim()) {
      setModal({ visible: true, title: "Warning", message: "Please enter a valid event name.", type: "warning" });
      return;
    }
    try {
      await editEventName(eventNameId, { name: formData.name.trim(), status: formData.status });
      setModal({ visible: true, title: "Success", message: "Event name updated successfully!", type: "success" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update event name.", type: "error" });
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
        <Text style={styles.headerTitle}>EDIT EVENT NAME</Text>
        <Text style={styles.headerSubtitle}>Update event name details</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          title="Event Name"
          placeholder="Enter event name"
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
        />
        <CustomDropdown
          title="Status"
          data={STATUS_OPTIONS}
          placeholder="Select Status"
          value={formData.status}
          onSelect={(item) => handleChange("status", item?.value ?? "")}
        />
        <View style={styles.buttonContainer}>
          <CustomButton title="UPDATE" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </View>
  );
};

export default EditEventName;

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
