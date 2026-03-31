import React, { useState, useCallback } from "react";
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
import { fetchDepartments, disableDepartment } from "../../../../services/api/departments";
import { router, useFocusEffect } from "expo-router";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function DepartmentsScreen() {
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [departmentToDisable, setDepartmentToDisable] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDepartments = async () => {
    try {
      const response = await fetchDepartments();
      if (!response || !Array.isArray(response.departments)) {
        throw new Error("Invalid data format: Expected 'departments' array.");
      }
      setDepartments(response.departments);
    } catch (err) {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadDepartments();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDepartments();
    }, [])
  );

  const filteredDepartments = Array.isArray(departments)
    ? departments.filter((dept) => {
        if (!searchQuery.trim()) return true;

        const departmentName = dept.department_name?.toLowerCase() || "";
        const status = dept.status?.toLowerCase() || "";
        const departmentId = dept.department_id?.toString().toLowerCase() || "";
        const query = searchQuery.toLowerCase().trim();

        return (
          departmentName.includes(query) ||
          status.includes(query) ||
          departmentId.includes(query)
        );
      })
    : [];

  const handleDisablePress = (departmentId) => {
    const department = departments.find(
      (dept) => dept.department_id === departmentId
    );
    if (!department) return;
    setDepartmentToDisable(department);
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
    setDepartmentToDisable(null);
  };

  const handleConfirmDisable = async () => {
    if (!departmentToDisable) return;
    try {
      await disableDepartment(departmentToDisable.department_id);
      setDepartments((prevDepartments) =>
        prevDepartments.map((dept) =>
          dept.department_id === departmentToDisable.department_id
            ? { ...dept, status: "Disabled" }
            : dept
        )
      );
      handleDisableModalClose();
      setIsSuccessModalVisible(true);
    } catch (error) {}
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>DEPARTMENTS</Text>
      <View style={{ paddingHorizontal: theme.spacing.medium, width: "100%" }}>
        <SearchBar
          placeholder="Search departments..."
          value={searchQuery}
          onSearch={handleSearchChange}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
        />
      </View>
      <ScrollView
        style={{ flex: 1, width: "100%", marginBottom: 70 }}
        contentContainerStyle={[styles.scrollview, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((department) => (
            <TouchableOpacity
              key={department.department_id}
              style={styles.departmentContainer}
              onPress={() =>
                router.push(
                  `/academicManagement/departments/DepartmentDetails?id=${department.department_id}`
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {department.department_name}
                </Text>
                <Text style={styles.departmentCode} numberOfLines={1}>
                  Status: {department.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/academicManagement/departments/EditDepartment?id=${department.department_id}`
                    )
                  }
                >
                  <Image source={icons.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(department.department_id)}
                  disabled={department.status === "Disabled"}
                  style={{
                    opacity: department.status === "Disabled" ? 0.5 : 1,
                  }}
                >
                  <Image source={icons.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>
            {searchQuery.trim()
              ? `No departments found matching "${searchQuery}"`
              : "No departments found"}
          </Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD DEPARTMENT"
          onPress={() =>
            router.push("/academicManagement/departments/AddDepartment")
          }
        />
      </View>

      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${departmentToDisable?.department_name}?`}
        type="warning"
        onClose={handleDisableModalClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Department disabled successfully!"
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
  departmentContainer: {
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
  departmentCode: {
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
