import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import TabsComponent from "../../../../components/TabsComponent";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import { fetchEventNameById, editEventName } from "../../../../services/api/events";
import CustomModal from "../../../../components/CustomModal";
import { useLocalSearchParams } from "expo-router";

const EditEventName = () => {
  const { id: eventNameId } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    status: "Active",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Disabled", value: "Disabled" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!eventNameId) {
          throw new Error("Invalid event name ID");
        }

        const eventNameDetails = await fetchEventNameById(eventNameId);

        if (!eventNameDetails) {
          throw new Error("Event name details not found");
        }

        const { name, status } = eventNameDetails.data;

        if (!name || name.trim() === "0") {
          setModal({
            visible: true,
            title: "Warning",
            message: "The fetched event name is invalid or missing.",
            type: "warning",
          });
          return;
        }

        setFormData({
          name: name?.trim() || "",
          status: status || "Active",
        });
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: error.message || "Failed to load event name details.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventNameId]);

  const handleChange = (name, value) => {
    const trimmedValue =
      name === "name" && typeof value === "string" ? value.trim() : value;

    setFormData((prevFormData) => ({ ...prevFormData, [name]: trimmedValue }));
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.name ||
        typeof formData.name !== "string" ||
        !formData.name.trim()
      ) {
        setModal({
          visible: true,
          title: "Warning",
          message: "Please enter a valid event name.",
          type: "warning",
        });
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        status: formData.status,
      };

      const response = await editEventName(eventNameId, submitData);

      setModal({
        visible: true,
        title: "Success",
        message: "Event name updated successfully!",
        type: "success",
      });
    } catch (error) {
      setModal({
        visible: true,
        title: "Error",
        message:
          error.response?.data?.message || "Failed to update event name.",
        type: "error",
      });
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
        onClose={() => setModal({ ...modal, visible: false })}
        cancelTitle="CLOSE"
      />

      <Text style={styles.headerText}>EDIT EVENT NAME</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            title="Event Name"
            placeholder="Enter event name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
          />

          <CustomDropdown
            title="Status"
            data={statusOptions}
            placeholder="Select Status"
            value={formData.status}
            onSelect={(item) => handleChange("status", item.value)}
          />
        </View>

        <View>
          <CustomButton title="UPDATE" onPress={handleSubmit} />
        </View>
      </ScrollView>

      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default EditEventName;

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: 120,
  },
});
