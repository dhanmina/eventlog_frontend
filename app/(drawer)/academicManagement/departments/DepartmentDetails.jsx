import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import {
  fetchDepartmentById,
  disableDepartment,
} from "../../../../services/api/departments";
import { useLocalSearchParams } from "expo-router";

const DepartmentDetails = () => {
  const { id: department_id } = useLocalSearchParams();
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const fetchDepartmentDetails = async () => {
    try {
      if (!department_id) throw new Error("Invalid department ID");

      const departmentData = await fetchDepartmentById(department_id);
      if (!departmentData) throw new Error("Department details not found");

      setDepartmentDetails(departmentData);
    } catch (error) {
      console.error("Error fetching department details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchDepartmentDetails();
    }, [department_id])
  );

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!departmentDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Department details not found.</Text>
      </View>
    );
  }

  const handleDisablePress = () => {
    setIsDisableModalVisible(true);
  };

  const handleConfirmDisable = async () => {
    try {
      await disableDepartment(departmentDetails.department_id);

      setDepartmentDetails((prevDetails) =>
        prevDetails ? { ...prevDetails, status: "Disabled" } : null
      );

      setIsDisableModalVisible(false);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error("Error disabling department:", error);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    fetchDepartmentDetails();
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <Text style={styles.headerText}>Department Details</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Department Name:</Text>
          <Text style={styles.detail}>{departmentDetails.department_name}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Department Code:</Text>
          <Text style={styles.detail}>{departmentDetails.department_code}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Status:</Text>
          <Text style={styles.detail}>{departmentDetails.status}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(
                `/academicManagement/departments/EditDepartment?id=${departmentDetails.department_id}`
              )
            }
          />
        </View>
        {departmentDetails.status === "Disabled" ? null : (
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
        message={`Are you sure you want to disable ${departmentDetails.department_name}?`}
        type="warning"
        onClose={() => setIsDisableModalVisible(false)}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Department disabled successfully!"
        type="success"
        onClose={handleSuccessModalClose}
        cancelTitle="CLOSE"
      />

      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default DepartmentDetails;

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  detailsWrapper: {
    flexGrow: 1,
    paddingVertical: theme.spacing.small,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.small,
    paddingTop: theme.spacing.medium,
    paddingBottom: 80 + theme.spacing.medium,
    width: "100%",
  },
  button: {
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
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
  errorText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
});
