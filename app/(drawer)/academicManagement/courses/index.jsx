import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { fetchCourses, disableCourse, enableCourse } from "../../../../services/api/courses";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [courseToToggle, setCourseToToggle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = async () => {
    try {
      const fetched = await fetchCourses();
      setCourses(Array.isArray(fetched) ? fetched : []);
    } catch {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadCourses();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadCourses(); }, []));

  const filteredCourses = courses.filter((c) => {
    const name = c.course_name?.toLowerCase() || "";
    const code = c.course_code?.toLowerCase() || "";
    const dept = c.department_name?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  const activeCount = courses.filter((c) => c.status === "Active").length;
  const disabledCount = courses.filter((c) => c.status === "Disabled").length;

  const handleTogglePress = (course) => {
    setCourseToToggle(course);
    setIsToggleModalVisible(true);
  };

  const handleConfirmToggle = async () => {
    if (!courseToToggle) return;
    const isDisabled = courseToToggle.status === "Disabled";
    try {
      if (isDisabled) {
        await enableCourse(courseToToggle.course_id);
      } else {
        await disableCourse(courseToToggle.course_id);
      }
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === courseToToggle.course_id
            ? { ...c, status: isDisabled ? "Active" : "Disabled" }
            : c
        )
      );
      setIsToggleModalVisible(false);
      setSuccessMessage(`Course ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch {}
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={courseToToggle?.status === "Disabled" ? "Enable Course" : "Disable Course"}
        message={`Are you sure you want to ${courseToToggle?.status === "Disabled" ? "enable" : "disable"} ${courseToToggle?.course_name}?`}
        type="warning"
        onClose={() => { setIsToggleModalVisible(false); setCourseToToggle(null); }}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={courseToToggle?.status === "Disabled" ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>COURSES</Text>
        <Text style={styles.headerSubtitle}>Manage courses per department</Text>
        {courses.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar
          placeholder="Search courses..."
          onSearch={(q) => setSearchQuery(q)}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const isDisabled = course.status === "Disabled";
            return (
              <TouchableOpacity
                key={course.course_id}
                style={styles.card}
                onPress={() =>
                  router.push(`/academicManagement/courses/CourseDetails?id=${course.course_id}`)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {course.course_name}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {[course.course_code, course.department_name].filter(Boolean).join("  ·  ")}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      router.push(`/academicManagement/courses/EditCourse?id=${course.course_id}`)
                    }
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(course)}
                  >
                    <Image
                      source={isDisabled ? icons.check : icons.disabled}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.course} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add a course to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD COURSE"
          onPress={() => router.push("/academicManagement/courses/AddCourse")}
        />
      </View>
      <View style={styles.tabSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
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
  headerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    marginTop: theme.spacing.small,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
  },
  headerStat: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  headerStatDivider: {
    color: theme.colors.secondary,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
    marginBottom: theme.spacing.small,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardLeft: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
  },
  cardLeftDisabled: {
    backgroundColor: "rgba(0,0,0,0.15)",
    opacity: 1,
  },
  cardBody: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    gap: 3,
  },
  cardName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  cardSub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: theme.spacing.xsmall,
  },
  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: theme.spacing.small,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    tintColor: theme.colors.primary,
    opacity: 0.2,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    opacity: 0.4,
  },
  emptySub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.3,
  },
  buttonContainer: {
    width: "100%",
    paddingVertical: theme.spacing.small,
  },
  tabSpacer: {
    height: 80,
  },
});
