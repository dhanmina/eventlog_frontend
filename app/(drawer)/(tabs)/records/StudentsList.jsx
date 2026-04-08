import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchStudentAttendanceByEventAndBlock } from "../../../../services/api/attendance";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import images from "../../../../constants/images";

import CustomSearch from "../../../../components/CustomSearch";

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        } else {
          setError(new Error(response.message));
        }
      } catch (error) {
        setError(error);
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
      pathname: "/records/Attendance",
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.noStudentsText}>
          No students found for this block.
        </Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={{ width: "100%", paddingHorizontal: theme.spacing.medium }}>
        <CustomSearch
          onSearch={handleSearch}
          placeholder="Search by name or ID"
        />
      </View>
      <ScrollView style={{ width: "100%" }}>
        {filteredStudents.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No students match your search
            </Text>
          </View>
        ) : (
          filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.student_id}
              style={styles.studentContainer}
              onPress={() => handleStudentPress(student)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentId}>{student.student_id}</Text>
              </View>
              <View style={styles.imageContainer}>
                <Image source={images.arrowRight} style={styles.icon} />
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
  studentContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderWidth: 2,
    height: 50,
    paddingHorizontal: theme.spacing.medium,
    borderColor: theme.colors.primary,
    alignItems: "center",
    marginTop: theme.spacing.medium,
    marginHorizontal: theme.spacing.medium,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  studentId: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
  },
  icon: {
    height: 24,
    width: 24,
    tintColor: theme.colors.gray,
  },
  imageContainer: {
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  errorText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
  noStudentsText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  noResultsContainer: {
    alignItems: "center",
    marginTop: theme.spacing.large,
    padding: theme.spacing.medium,
  },
  noResultsText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
});
