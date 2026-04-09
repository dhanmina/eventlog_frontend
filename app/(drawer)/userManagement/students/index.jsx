import React, { useState } from "react";
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
import { fetchUsers, disableUser } from "../../../../services/api";
import { router, useFocusEffect } from "expo-router";
import images from "../../../../constants/images";
import SearchBar from "../../../../components/CustomSearch";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [studentToDisable, setStudentToDisable] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const loadStudents = async (query = "", page = 1) => {
    try {
      const response = await fetchUsers({ search: query, page });
      if (response && response.success && Array.isArray(response.data)) {
        setStudents(response.data);
        setTotalPages(
          Math.ceil(
            response.pagination.totalItems / response.pagination.itemsPerPage
          )
        );
      } else {
        setStudents([]);
        setTotalPages(1);
      }
    } catch (err) {
      setStudents([]);
      setTotalPages(1);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadStudents(searchQuery, currentPage);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStudents(searchQuery, currentPage);
    }, [])
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadStudents(searchQuery, newPage);
    }
  };

  const handleDisablePress = (student) => {
    setStudentToDisable(student);
    setIsDisableModalVisible(true);
  };

  const handleConfirmDisable = async () => {
    try {
      if (studentToDisable) {
        await disableUser(studentToDisable.id_number);
        setIsDisableModalVisible(false);
        setIsSuccessModalVisible(true);
        loadStudents(searchQuery, currentPage);
      }
    } catch (error) {
      console.error("Error disabling student:", error);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>STUDENTS</Text>
      <View style={{ paddingHorizontal: theme.spacing.medium, width: "100%" }}>
        <SearchBar
          placeholder="Search students..."
          onSearch={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
            loadStudents(query, 1);
          }}
        />
      </View>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={[styles.scrollview]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {students.length > 0 ? (
          students.map((student) => (
            <TouchableOpacity
              key={student.id_number}
              style={styles.studentContainer}
              onPress={() =>
                router.push(
                  `/userManagement/students/StudentDetails?id=${student.id_number}`
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {`${student.first_name || ""} ${student.middle_name || ""} ${
                    student.last_name || ""
                  }${student.suffix ? `, ${student.suffix}` : ""}`}
                </Text>
                <Text style={styles.status} numberOfLines={1}>
                  {student.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/userManagement/students/EditStudent?id=${student.id_number}`
                    )
                  }
                >
                  <Image source={images.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(student)}
                  disabled={student.status === "Disabled"}
                  style={{ opacity: student.status === "Disabled" ? 0.5 : 1 }}
                >
                  <Image source={images.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No students found</Text>
        )}
      </ScrollView>
      {totalPages > 1 && (
  <View style={styles.pageNav}>
    <TouchableOpacity
      onPress={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
      style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
    >
      <Image
        source={images.arrowLeft}
        style={[
          styles.pageIconNav,
          {
            tintColor:
              currentPage === 1
                ? theme.colors.secondary
                : theme.colors.primary,
          },
        ]}
      />
    </TouchableOpacity>
    <View style={styles.textPage}>
      <Text style={styles.page}>{currentPage.toString()}</Text>
    </View>
    <TouchableOpacity
      onPress={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
    >
      <Image
        source={images.arrowRight}
        style={[
          styles.pageIconNav,
          {
            tintColor:
              currentPage === totalPages
                ? theme.colors.secondary
                : theme.colors.primary,
          },
        ]}
      />
    </TouchableOpacity>
  </View>
)}

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD STUDENT"
          onPress={() => {
            router.push("/userManagement/students/AddStudent");
          }}
        />
      </View>
      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${studentToDisable?.first_name} ${studentToDisable?.last_name}?`}
        type="warning"
        onClose={() => setIsDisableModalVisible(false)}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Student disabled successfully!"
        type="success"
        onClose={handleSuccessModalClose}
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
  studentContainer: {
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
    paddingBottom: 0,
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
  name: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
    flexShrink: 1,
  },
  status: {
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
  pageNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.medium,
    marginBottom: 170,
  },
  pageIconNav: {
    width: 30,
    height: 30,
    marginHorizontal: theme.spacing.small,
  },
  textPage: {
    height: 30,
    width: 50,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
  },
});
