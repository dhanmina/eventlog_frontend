import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { fetchCourseById, disableCourse } from "../../../../services/api";

const getEditCourseRoute = (courseId) =>
  `/academicManagement/courses/EditCourse?id=${courseId}`;

const CourseDetails = () => {
  const { id: course_id } = useLocalSearchParams();
  const [courseDetails, setCourseDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    try {
      if (!course_id) throw new Error("Invalid course ID");

      const courseData = await fetchCourseById(course_id);
      if (!courseData) throw new Error("Course details not found");

      setCourseDetails(courseData);
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [course_id]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchCourseDetails();
    }, [fetchCourseDetails]),
  );

  const handleDisablePress = () => {
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
  };

  const handleConfirmDisable = async () => {
    try {
      await disableCourse(courseDetails.course_id);

      setCourseDetails((prevDetails) =>
        prevDetails ? { ...prevDetails, status: "Disabled" } : null,
      );

      handleDisableModalClose();
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error("Error disabling course:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!courseDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Course details not found.</Text>
      </View>
    );
  }

  const courseDetailRows = [
    { label: "Course Name:", value: courseDetails.course_name },
    { label: "Course Code:", value: courseDetails.course_code || "-" },
    { label: "Department:", value: courseDetails.department_name || "-" },
    { label: "Status:", value: courseDetails.status || "-" },
  ];

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Course Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        {courseDetailRows.map((row) => (
          <View key={row.label} style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>{row.label}</Text>
            <Text style={styles.detail}>{row.value}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(getEditCourseRoute(courseDetails.course_id))
            }
          />
        </View>
        {courseDetails.status === "Disabled" ? null : (
          <View style={styles.button}>
            <CustomButton
              title="DISABLE"
              type="secondary"
              onPress={handleDisablePress}
            />
          </View>
        )}
      </View>

      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${courseDetails.course_name}?`}
        type="warning"
        onClose={handleDisableModalClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Course disabled successfully!"
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default CourseDetails;

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.medium,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  detailsWrapper: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  button: {
    marginHorizontal: theme.spacing.small,
    flex: 1,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
  },
  detailTitle: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    width: "40%",
    flexShrink: 1,
  },
  detail: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    width: "60%",
    flexShrink: 1,
  },
  loadingText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.Regular,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
  errorText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.Regular,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
});
