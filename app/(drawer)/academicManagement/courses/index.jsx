import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import TabsComponent from "../../../../components/TabsComponent";
import { StatusBar } from "expo-status-bar";
import { fetchCourses, disableCourse } from "../../../../services/api";
import { router, useFocusEffect } from "expo-router";

import images from "../../../../constants/images";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

const COURSE_ROUTES = {
  add: "/academicManagement/courses/AddCourse",
  details: (courseId) =>
    `/academicManagement/courses/CourseDetails?id=${courseId}`,
  edit: (courseId) => `/academicManagement/courses/EditCourse?id=${courseId}`,
};

const isCourseDisabled = (course) => course.status === "Disabled";

export default function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [courseToDisable, setCourseToDisable] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const fetchedCourses = await fetchCourses();
      setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadCourses();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  const filteredCourses = useMemo(() => {
    const normalizedSearchQuery = searchQuery.toLowerCase();

    return Array.isArray(courses)
      ? courses.filter((course) => {
          const courseName = course.course_name?.toLowerCase() || "";
          const departmentName = course.department_name?.toLowerCase() || "";

          return (
            courseName.includes(normalizedSearchQuery) ||
            departmentName.includes(normalizedSearchQuery)
          );
        })
      : [];
  }, [courses, searchQuery]);

  const handleDisablePress = (course) => {
    setCourseToDisable(course);
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
    setCourseToDisable(null);
  };

  const handleConfirmDisable = async () => {
    if (!courseToDisable) return;

    try {
      await disableCourse(courseToDisable.course_id);

      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.course_id === courseToDisable.course_id
            ? { ...course, status: "Disabled" }
            : course
        )
      );

      handleDisableModalClose();
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error("Error disabling course:", error);
    }
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>COURSES</Text>
      <View style={styles.searchContainer}>
        <SearchBar placeholder="Search courses..." onSearch={setSearchQuery} />
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <TouchableOpacity
              key={course.course_id}
              style={styles.courseContainer}
              onPress={() =>
                router.push(COURSE_ROUTES.details(course.course_id))
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {course.course_name}
                </Text>
                <Text style={styles.departmentName} numberOfLines={1}>
                  {course.status}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (course.course_id) {
                      router.push(COURSE_ROUTES.edit(course.course_id));
                    }
                  }}
                >
                  <Image source={images.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(course)}
                  disabled={isCourseDisabled(course)}
                  style={[
                    styles.disableButton,
                    isCourseDisabled(course) && styles.disabledButton,
                  ]}
                >
                  <Image source={images.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No courses found</Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD COURSE"
          onPress={() => router.push(COURSE_ROUTES.add)}
        />
      </View>

      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${courseToDisable?.course_name}?`}
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
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.medium,
    width: "100%",
  },
  scrollviewContainer: {
    flex: 1,
    width: "100%",
    marginBottom: 70,
  },
  courseContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  scrollview: {
    padding: theme.spacing.medium,
    paddingBottom: 80,
    flexGrow: 1,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    marginLeft: theme.spacing.small,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  disableButton: {
    opacity: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  name: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
    flexShrink: 1,
  },
  departmentName: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    flexShrink: 1,
  },
  noResults: {
    textAlign: "center",
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    marginTop: theme.spacing.medium,
  },
  buttonContainer: {
    position: "absolute",
    bottom: theme.spacing.medium,
    alignSelf: "center",
    width: "80%",
    padding: theme.spacing.medium,
    marginBottom: 80,
  },
});
