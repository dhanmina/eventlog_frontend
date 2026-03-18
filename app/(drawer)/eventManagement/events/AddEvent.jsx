import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import FormField from "../../../../components/FormField";
import TimePickerComponent from "../../../../components/TimePickerComponent";
import DatePickerComponent from "../../../../components/DatePickerComponent";
import DurationPicker from "../../../../components/DurationPicker";
import { fetchDepartments } from "../../../../services/api/departments";
import { fetchEventNames, addEvent } from "../../../../services/api/events";
import { fetchBlocksByDepartment } from "../../../../services/api/blocks";
import { getStoredUser } from "../../../../database/queries";
import { router } from "expo-router";

const AddEvent = () => {
  const [formData, setFormData] = useState({
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
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [errorDepartments, setErrorDepartments] = useState(null);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });
  const [isDurationPickerVisible, setIsDurationPickerVisible] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const storedUserData = await getStoredUser();
        if (!storedUserData || !storedUserData.id_number) {
          throw new Error("Invalid or missing user ID.");
        }
        handleChange("created_by", storedUserData.id_number);
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: "Failed to load user data. Please try again.",
          type: "error",
        });
      }
    };
    const fetchEventNamesData = async () => {
      setIsLoading(true);
      try {
        const eventNamesData = await fetchEventNames();
        if (!Array.isArray(eventNamesData)) {
          throw new Error("Invalid data format from API.");
        }
        const activeEventNamesData = eventNamesData.filter(
          (name) => name.status === "Active"
        );
        const formattedEventNames = activeEventNamesData.map((name) => ({
          label: name.label || name.name,
          value: name.value || name.id,
        }));
        setEventNames(formattedEventNames);
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: "Failed to load event names. Please try again.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    const fetchDepartmentData = async () => {
      setLoadingDepartments(true);
      setErrorDepartments(null);
      try {
        const response = await fetchDepartments();
        if (!response || !Array.isArray(response.departments)) {
          throw new Error(
            "Invalid data format from API: Expected 'departments' array."
          );
        }
        const departmentsData = response.departments;
        const activeDepartmentsData = departmentsData.filter(
          (dept) => dept.status === "Active"
        );
        const formattedDepartments = activeDepartmentsData.map((dept) => ({
          label: dept.department_name,
          value: dept.department_id,
        }));
        if (
          formattedDepartments.some(
            (dept) => !dept.label || dept.value === undefined
          )
        ) {
          throw new Error("Invalid department data.");
        }
        setDepartmentOptions(formattedDepartments);
      } catch (err) {
        setErrorDepartments(err);
        setModal({
          visible: true,
          title: "Error",
          message: "Failed to load departments. Please try again.",
          type: "error",
        });
      } finally {
        setLoadingDepartments(false);
      }
    };
    initializeData();
    fetchEventNamesData();
    fetchDepartmentData();
  }, []);

  useEffect(() => {
    const fetchBlocksData = async () => {
      setLoadingBlocks(true);
      try {
        const departmentIds = formData.department_ids;
        if (!departmentIds || departmentIds.length === 0) {
          setBlockOptions([]);
          return;
        }
        const blocksResponse = await fetchBlocksByDepartment(departmentIds);
        if (!Array.isArray(blocksResponse)) {
          throw new Error("Invalid API response: Expected an array of blocks.");
        }
        const activeBlocks = blocksResponse.filter(
          (block) => block.status === "Active"
        );

        const formattedBlocks = activeBlocks.map((block) => ({
          label: `${block.course_code || ""}  ${block.block_name}`,
          value: block.block_id,
        }));

        setBlockOptions(formattedBlocks);
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: "Failed to load blocks. Please try again.",
          type: "error",
        });
      } finally {
        setLoadingBlocks(false);
      }
    };
    fetchBlocksData();
  }, [formData.department_ids]);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.event_name_id) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select an event name.",
          type: "error",
        });
        return;
      }
      if (formData.department_ids.length === 0) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select at least one department.",
          type: "error",
        });
        return;
      }
      if (formData.block_ids.length === 0) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select at least one block.",
          type: "error",
        });
        return;
      }
      if (!formData.venue) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please enter a venue.",
          type: "error",
        });
        return;
      }
      if (!formData.description.trim()) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please fill in the event description.",
          type: "error",
        });
        return;
      }
      if (!formData.event_date) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select a valid event date.",
          type: "error",
        });
        return;
      }

      const formattedDates = Array.isArray(formData.event_date)
        ? formData.event_date.flat().filter(Boolean)
        : [];

      if (formattedDates.length === 0) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select a valid event date.",
          type: "error",
        });
        return;
      }

      if (
        !(
          formData.am_in ||
          formData.am_out ||
          formData.pm_in ||
          formData.pm_out
        )
      ) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Please select at least one of the AM or PM times.",
          type: "error",
        });
        return;
      }

      const convertToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(":").map(Number);
        return hours * 60 + minutes;
      };

      if (formData.am_in && formData.am_out) {
        const amInMinutes = convertToMinutes(formData.am_in);
        const amOutMinutes = convertToMinutes(formData.am_out);
        const amTimeDifference = amOutMinutes - amInMinutes;
        if (amTimeDifference < 60) {
          setModal({
            visible: true,
            title: "Validation Error",
            message: "AM times must be at least one hour apart.",
            type: "error",
          });
          return;
        }
      }

      if (formData.pm_in && formData.pm_out) {
        const pmInMinutes = convertToMinutes(formData.pm_in);
        const pmOutMinutes = convertToMinutes(formData.pm_out);
        const pmTimeDifference = pmOutMinutes - pmInMinutes;
        if (pmTimeDifference < 60) {
          setModal({
            visible: true,
            title: "Validation Error",
            message: "PM times must be at least one hour apart.",
            type: "error",
          });
          return;
        }
      }

      if (formData.duration < 30) {
        setModal({
          visible: true,
          title: "Validation Error",
          message: "Event duration must be at least 30 minutes.",
          type: "error",
        });
        return;
      }

      const requestData = {
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
      };

      const response = await addEvent(requestData);

      if (response?.success) {
        setModal({
          visible: true,
          title: "Success",
          message: "Event added successfully!",
          type: "success",
          onPress: () => router.back(),
        });
        setTimeout(() => {
          router.back();
        }, 1500);
        setFormData({
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
          created_by: formData.created_by,
        });
      } else {
        let errorMessage =
          "Failed to add the event. Please double-check your information and try again.";
        if (response?.message) {
          errorMessage = response.message;
        }
        setModal({
          visible: true,
          title: "Error",
          message: errorMessage,
          type: "error",
        });
      }
    } catch (error) {
      let errorMessage =
        "Failed to add the event. Please double-check your information and try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Network request failed") {
        errorMessage =
          "There was a problem connecting to the server. Please check your internet connection and try again.";
      }
      setModal({
        visible: true,
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleModalClose = () => {
    setModal({ ...modal, visible: false });
  };

  const handleDateChange = (date) => {
    handleChange("event_date", date);
  };

  const openDurationPicker = () => {
    setIsDurationPickerVisible(true);
  };

  const closeDurationPicker = () => {
    setIsDurationPickerVisible(false);
  };

  const handleDurationSelect = (durationInMinutes) => {
    handleChange("duration", durationInMinutes);
    closeDurationPicker();
  };

  if (isLoading || loadingDepartments) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (errorDepartments) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={{ color: "red", textAlign: "center" }}>
          Failed to load departments. Please try again.
        </Text>
        <CustomButton
          title="Retry"
          onPress={() => {
            setLoadingDepartments(true);
            setErrorDepartments(null);
            fetchDepartmentData();
          }}
        />
      </View>
    );
  }

  return (
    <View style={[globalStyles.secondaryContainer]}>
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={handleModalClose}
        cancelTitle="CLOSE"
      />
      <Text style={styles.textHeader}>EVENTLOG</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>ADD EVENT</Text>
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <CustomDropdown
            title="Select Event Name"
            data={eventNames}
            placeholder="Select an event name"
            value={formData.event_name_id}
            onSelect={(item) => handleChange("event_name_id", item.value)}
          />
          <CustomDropdown
            title="Select Departments"
            data={departmentOptions}
            placeholder="Select departments"
            value={formData.department_ids}
            onSelect={(selectedItems) => {
              const selectedValues = Array.isArray(selectedItems)
                ? selectedItems.map((item) =>
                    typeof item === "object" && item !== null
                      ? item.value
                      : item
                  )
                : [];
              handleChange("department_ids", selectedValues);
            }}
            multiSelect
          />
          {loadingBlocks ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <CustomDropdown
              title="Select Blocks"
              data={blockOptions}
              placeholder="Select blocks"
              value={formData.block_ids}
              onSelect={(selectedItems) => {
                const selectedValues = Array.isArray(selectedItems)
                  ? selectedItems.map((item) =>
                      typeof item === "object" && item !== null
                        ? item.value
                        : item
                    )
                  : [];
                handleChange("block_ids", selectedValues);
              }}
              multiSelect
            />
          )}
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
            onDateChange={handleDateChange}
            selectedDate={formData.event_date}
          />
          <View>
            <View style={styles.timeWrapper}>
              <View style={styles.timeContainer}>
                <TimePickerComponent
                  title="AM Time In"
                  mode="single"
                  onTimeChange={(time) => handleChange("am_in", time)}
                  selectedValue={formData.am_in}
                  allowPM={false}
                />
              </View>
              <View style={styles.timeContainer}>
                {formData.am_in && (
                  <TimePickerComponent
                    title="AM Time Out"
                    mode="single"
                    onTimeChange={(time) => handleChange("am_out", time)}
                    selectedValue={formData.am_out}
                    allowPM={false}
                  />
                )}
              </View>
            </View>
          </View>
          <View>
            <View style={styles.timeWrapper}>
              <View style={styles.timeContainer}>
                <TimePickerComponent
                  title="PM Time In"
                  mode="single"
                  onTimeChange={(time) => handleChange("pm_in", time)}
                  selectedValue={formData.pm_in}
                  allowAM={false}
                />
              </View>
              <View style={styles.timeContainer}>
                {formData.pm_in && (
                  <TimePickerComponent
                    title="PM Time Out"
                    mode="single"
                    onTimeChange={(time) => handleChange("pm_out", time)}
                    selectedValue={formData.pm_out}
                    allowAM={false}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={openDurationPicker}
            >
              <Text style={styles.durationButtonText}>
                Set Duration:{" "}
                {formData.duration > 0
                  ? `${Math.floor(formData.duration / 60)} ${
                      Math.floor(formData.duration / 60) === 1 ? "hr" : "hrs"
                    } ${formData.duration % 60} mins`
                  : ""}
              </Text>
            </TouchableOpacity>
            {isDurationPickerVisible && (
              <DurationPicker
                visible={isDurationPickerVisible}
                onClose={closeDurationPicker}
                onDurationSelect={handleDurationSelect}
                selectedDuration={formData.duration}
                key={isDurationPickerVisible ? "visible" : "hidden"}
              />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <CustomButton title="SUBMIT" onPress={handleSubmit} />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollviewContainer: {
    width: "100%",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderTopWidth: 0,
  },
  scrollview: {
    justifyContent: "space-between",
    flexGrow: 1,
    padding: theme.spacing.medium,
  },
  titleContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  textTitle: {
    fontSize: theme.fontSizes.extraLarge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
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
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
});

export default AddEvent;
