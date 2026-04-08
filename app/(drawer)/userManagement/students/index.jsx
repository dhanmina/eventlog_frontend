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
import { fetchUsers, updateUserStatus } from "../../../../services/api/users";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStudents = async (query = "", page = 1) => {
    try {
      const response = await fetchUsers(query, page);
      if (response?.success && Array.isArray(response.data)) {
        setStudents(response.data);
        setTotalPages(Math.ceil(response.pagination.totalItems / response.pagination.itemsPerPage));
      } else {
        setStudents([]);
        setTotalPages(1);
      }
    } catch {
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

  useFocusEffect(useCallback(() => { loadStudents(searchQuery, currentPage); }, []));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadStudents(searchQuery, newPage);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || student.id_number?.includes(searchQuery);
  });

  const activeCount = students.filter((s) => s.status === "Active").length;
  const disabledCount = students.filter((s) => s.status === "Disabled").length;

  const handleTogglePress = (student) => {
    setStudentToToggle(student);
    setIsToggleModalVisible(true);
  };

  const handleToggleModalClose = () => {
    setIsToggleModalVisible(false);
    setStudentToToggle(null);
  };

  const handleConfirmToggle = async () => {
    if (!studentToToggle) return;
    const isDisabled = studentToToggle.status === "Disabled";
    try {
      await updateUserStatus(studentToToggle.id_number, isDisabled ? "Active" : "Disabled");
      setIsToggleModalVisible(false);
      setSuccessMessage(`Student ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
      loadStudents(searchQuery, currentPage);
    } catch (error) {
      setIsToggleModalVisible(false);
      setErrorMessage(error?.response?.data?.message || error?.message || "Failed to update student status.");
      setIsErrorModalVisible(true);
    }
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={studentToToggle?.status === "Disabled" ? "Enable Student" : "Disable Student"}
        message={`Are you sure you want to ${studentToToggle?.status === "Disabled" ? "enable" : "disable"} ${studentToToggle?.first_name} ${studentToToggle?.last_name}?`}
        type="warning"
        onClose={handleToggleModalClose}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={studentToToggle?.status === "Disabled" ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />
      <CustomModal
        visible={isErrorModalVisible}
        title="Error"
        message={errorMessage}
        type="error"
        onClose={() => setIsErrorModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>STUDENTS</Text>
        <Text style={styles.headerSubtitle}>Manage student accounts</Text>
        {students.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const isDisabled = student.status === "Disabled";
            const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}${student.suffix ? `, ${student.suffix}` : ""}`;
            return (
              <TouchableOpacity
                key={student.id_number}
                style={styles.card}
                onPress={() => router.push(`/userManagement/students/StudentDetails?id=${student.id_number}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{fullName}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{student.id_number}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push(`/userManagement/students/EditStudent?id=${student.id_number}`)}
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(student)}
                  >
                    <Image source={isDisabled ? icons.check : icons.disabled} style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.student} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add a student to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      {totalPages > 1 && (
        <View style={styles.pageNav}>
          <TouchableOpacity
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={[styles.pageArrowBtn, { opacity: currentPage === 1 ? 0.3 : 1 }]}
          >
            <Image source={icons.arrowLeft} style={styles.pageIconNav} />
          </TouchableOpacity>
          <View style={styles.textPage}>
            <Text style={styles.page}>{`${currentPage} / ${totalPages}`}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={[styles.pageArrowBtn, { opacity: currentPage === totalPages ? 0.3 : 1 }]}
          >
            <Image source={icons.arrowRight} style={styles.pageIconNav} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <CustomButton title="ADD STUDENT" onPress={() => router.push("/userManagement/students/AddStudent")} />
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
  pageNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.medium,
    gap: theme.spacing.small,
  },
  pageArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pageIconNav: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  textPage: {
    height: 36,
    minWidth: 80,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.medium,
  },
  page: {
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.small,
  },
});
