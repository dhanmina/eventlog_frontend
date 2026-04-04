import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { addEventName } from "../../../../services/api/events";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const AddEventName = () => {
  const [formData, setFormData] = useState({ name: "" });
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });

  const handleChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!formData.name || typeof formData.name !== "string" || !formData.name.trim()) {
      setModal({ visible: true, title: "Warning", message: "Please enter a valid event name.", type: "warning" });
      return;
    }
    try {
      await addEventName(formData.name.trim());
      setModal({ visible: true, title: "Success", message: "Event name added successfully!", type: "success" });
      setFormData({ name: "" });
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to add event name.", type: "error" });
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
        <Text style={styles.headerTitle}>ADD EVENT NAME</Text>
        <Text style={styles.headerSubtitle}>Create a new event category</Text>
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
        <View style={styles.buttonContainer}>
          <CustomButton title="ADD" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </View>
  );
};

export default AddEventName;

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
