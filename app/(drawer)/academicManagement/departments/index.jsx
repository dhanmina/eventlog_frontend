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
import { fetchDepartments, disableDepartment, enableDepartment } from "../../../../services/api/departments";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function DepartmentsScreen() {
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deptToToggle, setDeptToToggle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDepartments = async () => {
    try {
      const response = await fetchDepartments();
      if (!response || !Array.isArray(response.departments)) return;
      setDepartments(response.departments);
    } catch {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadDepartments();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadDepartments(); }, []));

  const filteredDepartments = departments.filter((d) => {
    const name = d.department_name?.toLowerCase() || "";
    const code = d.department_code?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const activeCount = departments.filter((d) => d.status === "Active").length;
  const disabledCount = departments.filter((d) => d.status === "Disabled").length;

  const handleTogglePress = (dept) => {
    setDeptToToggle(dept);
    setIsToggleModalVisible(true);
  };

  const handleConfirmToggle = async () => {
    if (!deptToToggle) return;
    const isDisabled = deptToToggle.status === "Disabled";
    try {
      if (isDisabled) {
        await enableDepartment(deptToToggle.department_id);
      } else {
        await disableDepartment(deptToToggle.department_id);
      }
      setDepartments((prev) =>
        prev.map((d) =>
          d.department_id === deptToToggle.department_id
            ? { ...d, status: isDisabled ? "Active" : "Disabled" }
            : d
        )
      );
      setIsToggleModalVisible(false);
      setSuccessMessage(`Department ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch {}
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={deptToToggle?.status === "Disabled" ? "Enable Department" : "Disable Department"}
        message={`Are you sure you want to ${deptToToggle?.status === "Disabled" ? "enable" : "disable"} ${deptToToggle?.department_name}?`}
        type="warning"
        onClose={() => { setIsToggleModalVisible(false); setDeptToToggle(null); }}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={deptToToggle?.status === "Disabled" ? "Enable" : "Disable"}
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
        <Text style={styles.headerTitle}>DEPARTMENTS</Text>
        <Text style={styles.headerSubtitle}>Manage academic departments</Text>
        {departments.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar
          placeholder="Search departments..."
          onSearch={(q) => setSearchQuery(q)}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => {
            const isDisabled = dept.status === "Disabled";
            return (
              <TouchableOpacity
                key={dept.department_id}
                style={styles.card}
                onPress={() =>
                  router.push(`/academicManagement/departments/DepartmentDetails?id=${dept.department_id}`)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {dept.department_name}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {dept.department_code}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      router.push(`/academicManagement/departments/EditDepartment?id=${dept.department_id}`)
                    }
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(dept)}
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
            <Image source={icons.department} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No departments found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add a department to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD DEPARTMENT"
          onPress={() => router.push("/academicManagement/departments/AddDepartment")}
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
