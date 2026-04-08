import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchStudentAttendanceByEventAndBlock } from "../../../../services/api/records";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";

import CustomSearch from "../../../../components/CustomSearch";

const StudentsList = ({
  attendancePath = "eventManagement/records/Attendance",
  showTabs = true,
}) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockLabel, setBlockLabel] = useState("");
  const [eventName, setEventName] = useState("");
  const { eventId, blockId } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchStudentAttendanceByEventAndBlock(
          eventId,
          blockId
        );

        if (response.success) {
          const { data } = response;
          const studentList = data.students || [];
          setStudents(studentList);
          setFilteredStudents(studentList);
          if (data.course_code && data.block_name) {
            setBlockLabel(`${data.course_code} ${data.block_name}`);
          } else if (data.block_name) {
            setBlockLabel(data.block_name);
          }
          if (data.event_name) {
            setEventName(data.event_name);
          }
        } else {
          setError(new Error(response.message));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId && blockId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [eventId, blockId]);

  const handleSearch = (text) => {
    if (!text.trim()) {
      setFilteredStudents(students);
      return;
    }
    const searchTermLower = text.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTermLower) ||
        student.student_id.toLowerCase().includes(searchTermLower)
    );
    setFilteredStudents(filtered);
  };

  const handleStudentPress = (student) => {
    router.push({
      pathname: attendancePath,
      params: {
        eventId,
        blockId,
        studentId: student.student_id,
      },
    });
  };

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <View style={styles.emptyState}>
          <Image source={icons.student} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Failed to load students</Text>
          <Text style={styles.emptySub}>{error.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{blockLabel || "Students"}</Text>
        <Text style={styles.headerSubtitle}>
          {eventName || "Attendance Records"}
        </Text>
        {students.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>
              {students.length} {students.length === 1 ? "Student" : "Students"}
            </Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <CustomSearch
          onSearch={handleSearch}
          placeholder="Search by name or ID"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={icons.student} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>
              {students.length === 0 ? "No students found" : "No results"}
            </Text>
            <Text style={styles.emptySub}>
              {students.length === 0
                ? "No students assigned to this block"
                : "Try a different search term"}
            </Text>
          </View>
        ) : (
          filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.student_id}
              style={styles.card}
              onPress={() => handleStudentPress(student)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {student.student_id}
                </Text>
              </View>
              <View style={styles.cardArrow}>
                <Image source={icons.arrowRight} style={styles.arrowIcon} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default StudentsList;

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
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: 120,
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
  cardArrow: {
    paddingHorizontal: theme.spacing.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    opacity: 0.4,
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
});
