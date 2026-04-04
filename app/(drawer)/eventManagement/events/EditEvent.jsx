import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { fetchDepartments } from "../../../../services/api/departments";
import { fetchEventNames, fetchEventById, updateEvent } from "../../../../services/api/events";
import { fetchBlocksByDepartment } from "../../../../services/api/blocks";
import { getStoredUser } from "../../../../database/queries";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import FormField from "../../../../components/FormField";
import TimePickerComponent from "../../../../components/TimePickerComponent";
import DatePickerComponent from "../../../../components/DatePickerComponent";
import DurationPicker from "../../../../components/DurationPicker";

const EditEvent = () => {
  const { id: eventId } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    event_id: "",
    event_name_id: "",
    department_ids: [],
    block_ids: [],
    venue: "",
    description: "",
    am_in: null,
    am_out: null,
    pm_in: null,
    pm_out: null,
    event_date: null,
    duration: 0,
    created_by: "",
  });
  const [eventNames, setEventNames] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "success" });
  const [isDurationPickerVisible, setIsDurationPickerVisible] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserData = await getStoredUser();
        if (storedUserData?.id_number) {
          handleChange("created_by", storedUserData.id_number);
        }

        const [eventNamesData, deptResponse] = await Promise.all([
          fetchEventNames(),
          fetchDepartments(),
        ]);

        const activeEventNames = Array.isArray(eventNamesData)
          ? eventNamesData.filter((n) => n.status === "Active")
          : [];
        setEventNames(activeEventNames.map((n) => ({
          label: n.label || n.name,
          value: n.value || n.id,
        })));

        if (deptResponse?.departments) {
          const activeDepts = deptResponse.departments.filter((d) => d.status === "Active");
          setDepartmentOptions(activeDepts.map((d) => ({
            label: d.department_name,
            value: d.department_id,
          })));
        }

        if (eventId) {
          const eventData = await fetchEventById(eventId);
          if (eventData) {
            const blockIds = eventData.block_ids ? eventData.block_ids.split(",").map(Number).filter((n) => !isNaN(n)) : [];
            const deptIds = eventData.department_ids ? eventData.department_ids.split(",").map(Number).filter((n) => !isNaN(n)) : [];
            const eventDates = eventData.event_dates ? eventData.event_dates.split(",") : [];

            setFormData({
              event_id: eventId,
              event_name_id: eventData.event_name_id || "",
              department_ids: deptIds,
              block_ids: blockIds,
              venue: eventData.venue || "",
              description: eventData.description || "",
              am_in: eventData.am_in || null,
              am_out: eventData.am_out || null,
              pm_in: eventData.pm_in || null,
              pm_out: eventData.pm_out || null,
              event_date: eventDates,
              duration: parseInt(eventData.duration, 10) || 0,
              created_by: eventData.created_by_id || "",
            });
            setSelectedDepartmentIds(deptIds);
          }
        }
      } catch {}
      setIsLoading(false);
    };
    fetchData();
  }, [eventId]);

  useEffect(() => {
    const fetchBlocksData = async () => {
      if (selectedDepartmentIds.length === 0) {
        setBlockOptions([]);
        return;
      }
      setLoadingBlocks(true);
      try {
        const blocksResponse = await fetchBlocksByDepartment(selectedDepartmentIds);
        if (Array.isArray(blocksResponse)) {
          const activeBlocks = blocksResponse.filter((b) => b.status === "Active");
          setBlockOptions(activeBlocks.map((b) => ({
            label: b.course_code ? `${b.course_code} ${b.block_name || b.name || ""}` : (b.block_name || b.name || ""),
            value: b.block_id,
          })));
        }
      } catch {}
      setLoadingBlocks(false);
    };
    fetchBlocksData();
  }, [selectedDepartmentIds]);

  const handleChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!formData.event_name_id) {
      setModal({ visible: true, title: "Validation Error", message: "Please select an event name.", type: "error" });
      return;
    }
    if (formData.department_ids.length === 0) {
      setModal({ visible: true, title: "Validation Error", message: "Please select at least one department.", type: "error" });
      return;
    }
    if (formData.block_ids.length === 0) {
      setModal({ visible: true, title: "Validation Error", message: "Please select at least one block.", type: "error" });
      return;
    }
    if (!formData.venue) {
      setModal({ visible: true, title: "Validation Error", message: "Please enter a venue.", type: "error" });
      return;
    }
    if (!formData.description.trim()) {
      setModal({ visible: true, title: "Validation Error", message: "Please fill in the event description.", type: "error" });
      return;
    }
    if (!formData.event_date || (Array.isArray(formData.event_date) && formData.event_date.flat().filter(Boolean).length === 0)) {
      setModal({ visible: true, title: "Validation Error", message: "Please select a valid event date.", type: "error" });
      return;
    }
    if (!(formData.am_in || formData.am_out || formData.pm_in || formData.pm_out)) {
      setModal({ visible: true, title: "Validation Error", message: "Please select at least one AM or PM time.", type: "error" });
      return;
    }
    if (formData.duration < 30) {
      setModal({ visible: true, title: "Validation Error", message: "Event duration must be at least 30 minutes.", type: "error" });
      return;
    }

    try {
      const formattedDates = Array.isArray(formData.event_date) ? formData.event_date.flat().filter(Boolean) : [];
      await updateEvent(eventId, {
        event_name_id: formData.event_name_id,
        venue: formData.venue,
        dates: formattedDates,
        description: formData.description,
        block_ids: formData.block_ids,
        am_in: formData.am_in,
        am_out: formData.am_out,
        pm_in: formData.pm_in,
        pm_out: formData.pm_out,
        duration: formData.duration,
        admin_id_number: formData.created_by,
      });
      setModal({ visible: true, title: "Success", message: "Event updated successfully!", type: "success" });
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      setModal({ visible: true, title: "Error", message: error.response?.data?.message || "Failed to update event.", type: "error" });
    }
  };

  const addOneHour = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    if (h >= 23) return null;
    return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
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
        <Text style={styles.headerTitle}>EDIT EVENT</Text>
        <Text style={styles.headerSubtitle}>Update event information</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CustomDropdown
          title="Event Name"
          data={eventNames}
          placeholder="Select an event name"
          value={formData.event_name_id}
          onSelect={(item) => handleChange("event_name_id", item?.value ?? "")}
        />
        <CustomDropdown
          title="Departments"
          data={departmentOptions}
          placeholder="Select departments"
          value={selectedDepartmentIds}
          onSelect={(selectedItems) => {
            const values = Array.isArray(selectedItems) ? selectedItems.map((i) => typeof i === "object" ? i.value : i) : [];
            setSelectedDepartmentIds(values);
            handleChange("department_ids", values);
          }}
          multiSelect
        />
        <CustomDropdown
          title="Blocks"
          data={blockOptions}
          placeholder={loadingBlocks ? "Loading blocks..." : "Select blocks"}
          value={formData.block_ids}
          onSelect={(selectedItems) => {
            const values = Array.isArray(selectedItems) ? selectedItems.map((i) => typeof i === "object" ? i.value : i) : [];
            handleChange("block_ids", values);
          }}
          multiSelect
        />
        <FormField
          title="Venue"
          placeholder="Enter venue details"
          value={formData.venue}
          onChangeText={(text) => handleChange("venue", text)}
        />
        <FormField
          title="Description"
          placeholder="Enter event description..."
          value={formData.description}
          onChangeText={(text) => handleChange("description", text)}
          multiline={true}
        />
        <DatePickerComponent
          title="Date of Event"
          onDateChange={(date) => handleChange("event_date", date)}
          selectedDate={formData.event_date}
        />
        <View style={styles.timeWrapper}>
          <View style={styles.timeContainer}>
            <TimePickerComponent
              title="AM Time In"
              onTimeChange={(time) => handleChange("am_in", time)}
              selectedValue={formData.am_in}
              allowPM={false}
            />
          </View>
          <View style={styles.timeContainer}>
            <TimePickerComponent
              title="AM Time Out"
              onTimeChange={(time) => handleChange("am_out", time)}
              selectedValue={formData.am_out}
              defaultValue={addOneHour(formData.am_in)}
              allowPM={false}
            />
          </View>
        </View>
        <View style={styles.timeWrapper}>
          <View style={styles.timeContainer}>
            <TimePickerComponent
              title="PM Time In"
              onTimeChange={(time) => handleChange("pm_in", time)}
              selectedValue={formData.pm_in}
              allowAM={false}
            />
          </View>
          <View style={styles.timeContainer}>
            <TimePickerComponent
              title="PM Time Out"
              onTimeChange={(time) => handleChange("pm_out", time)}
              selectedValue={formData.pm_out}
              defaultValue={addOneHour(formData.pm_in)}
              allowAM={false}
            />
          </View>
        </View>
        <View
          style={styles.durationButton}
          onTouchEnd={() => setIsDurationPickerVisible(true)}
        >
          <Text style={styles.durationButtonText}>
            Set Duration: {formData.duration > 0 ? `${Math.floor(formData.duration / 60)} hrs ${formData.duration % 60} mins` : "Tap to set"}
          </Text>
        </View>
        {isDurationPickerVisible && (
          <DurationPicker
            visible={isDurationPickerVisible}
            onClose={() => setIsDurationPickerVisible(false)}
            onDurationSelect={(d) => { handleChange("duration", d); setIsDurationPickerVisible(false); }}
            selectedDuration={formData.duration}
          />
        )}
        <View style={styles.buttonContainer}>
          <CustomButton title="UPDATE EVENT" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </View>
  );
};

export default EditEvent;

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
  timeWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  timeContainer: {
    width: "45%",
    paddingTop: theme.spacing.medium,
  },
  durationButton: {
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "rgba(37,85,134,0.4)",
    marginTop: theme.spacing.medium,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  durationButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
  },
});
