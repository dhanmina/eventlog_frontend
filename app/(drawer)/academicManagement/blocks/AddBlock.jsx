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
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomDropdown from "../../../../components/CustomDropdown";
import {
  addBlock,
  fetchYearLevels,
  fetchDepartments,
} from "../../../../services/api";

import { fetchCoursesByDepartmentId } from "../../../../services/api/courses";

const INITIAL_FORM_DATA = {
  name: "",
  course: "",
  year_level: "",
};

const INITIAL_MODAL_STATE = {
  visible: false,
  title: "",
  message: "",
  type: "success",
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getDepartmentList = (response) =>
  toArray(Array.isArray(response) ? response : response?.departments);

const getYearLevelList = (response) =>
  toArray(Array.isArray(response) ? response : response?.yearLevels);

const getCourseList = (response) =>
  toArray(Array.isArray(response) ? response : response?.courses);

const formatDepartmentOptions = (departments) =>
  toArray(departments).map((department) => ({
    label: department.department_name,
    value: department.department_id,
  }));

const formatCourseOptions = (courses) =>
  toArray(courses).map((course) => ({
    label: course.course_code,
    value: course.course_id,
  }));

const formatYearLevelOptions = (yearLevels) =>
  toArray(yearLevels).map((yearLevel) => ({
    label: yearLevel.year_level_name ?? yearLevel.name,
    value: yearLevel.year_level_id ?? yearLevel.id,
  }));

const buildSubmitData = (formData, selectedDepartment) => ({
  name: formData.name,
  course_id: formData.course,
  year_level_id: formData.year_level,
  department_id: selectedDepartment,
});

const AddBlock = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(INITIAL_MODAL_STATE);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const showModal = (config) => {
    setModal({ ...INITIAL_MODAL_STATE, visible: true, ...config });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDepartments();
        if (response.success) {
          setDepartments(formatDepartmentOptions(getDepartmentList(response)));
        } else {
          throw new Error("Failed to fetch departments");
        }

        const yearLevelsData = await fetchYearLevels();
        setYearLevels(formatYearLevelOptions(getYearLevelList(yearLevelsData)));
      } catch (error) {
        console.error("Error fetching dropdown data:", error.message);
        showModal({
          title: "Error",
          message: error.message || "Failed to load dropdown data.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (name, value) =>
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));

  const handleDepartmentChange = async (item) => {
    setSelectedDepartment(item.value);

    try {
      const coursesData = await fetchCoursesByDepartmentId(item.value);
      setCourses(formatCourseOptions(getCourseList(coursesData)));
    } catch (error) {
      console.error("Error fetching courses:", error.message);
      showModal({
        title: "Error",
        message: error.message || "Failed to load courses.",
        type: "error",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.name.trim() ||
        !formData.course ||
        !formData.year_level ||
        !selectedDepartment
      ) {
        showModal({
          title: "Warning",
          message: "Please fill in all required fields.",
          type: "warning",
        });
        return;
      }

      const submitData = buildSubmitData(formData, selectedDepartment);

      setIsLoading(true);

      await addBlock(submitData);

      showModal({
        title: "Success",
        message: "Block added successfully!",
        type: "success",
      });

      setFormData(INITIAL_FORM_DATA);
      setSelectedDepartment(null);
      setCourses([]);
    } catch (error) {
      console.error("Error adding block:", error.message || error);

      showModal({
        title: "Error",
        message: error.response?.data?.message || "Failed to add block.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  return (
    <View style={[globalStyles.secondaryContainer, styles.screenContainer]}>
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, visible: false })}
        cancelTitle="CLOSE"
      />

      <Text style={styles.textHeader}>EVENTLOG</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>ADD BLOCK</Text>
      </View>

      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            title="Block Name"
            placeholder="Enter block name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
          />

          <CustomDropdown
            title="Department"
            data={departments}
            placeholder="Select Department"
            value={selectedDepartment}
            onSelect={handleDepartmentChange}
          />

          <CustomDropdown
            title="Course"
            data={courses}
            placeholder="Select Course"
            value={formData.course}
            onSelect={(item) => handleChange("course", item.value)}
          />

          <CustomDropdown
            title="Year Level"
            data={yearLevels}
            placeholder="Select Year Level"
            value={formData.year_level}
            onSelect={(item) => handleChange("year_level", item.value)}
          />
        </View>

        <View>
          <CustomButton title="ADD" onPress={handleSubmit} />
        </View>
      </ScrollView>

      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default AddBlock;

const styles = StyleSheet.create({
  screenContainer: {
    paddingTop: 0,
  },
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollviewContainer: {
    width: "100%",
    marginBottom: 90,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderTopWidth: 0,
  },
  scrollview: {
    flexGrow: 1,
    padding: theme.spacing.medium,
    justifyContent: "space-between",
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
});
