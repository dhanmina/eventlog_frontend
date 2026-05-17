import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { fetchUserById, disableUser } from "../../../../services/api";

const getEditStudentRoute = (idNumber) =>
  `/userManagement/students/EditStudent?id=${idNumber}`;

const getRoleLabel = (roleId) => (roleId === 1 ? "Student" : "Officer");

const StudentDetails = () => {
  const { id: id_number } = useLocalSearchParams();
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const fetchStudentDetails = useCallback(async () => {
    try {
      if (!id_number) throw new Error("Invalid student ID");

      const studentData = await fetchUserById(id_number);
      if (!studentData) throw new Error("Student details not found");

      setStudentDetails(studentData);
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id_number]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStudentDetails();
    }, [fetchStudentDetails])
  );

  const handleDisablePress = () => {
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
  };

  const handleConfirmDisable = async () => {
    try {
      await disableUser(studentDetails.id_number);
      setIsDisableModalVisible(false);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    fetchStudentDetails();
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!studentDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Student details not found.</Text>
      </View>
    );
  }

  const studentDetailRows = [
    ["ID Number:", studentDetails.id_number],
    ["Role:", getRoleLabel(studentDetails.role_id)],
    ["Block:", studentDetails.block_name || "-"],
    ["First Name:", studentDetails.first_name],
    ["Middle Name:", studentDetails.middle_name || "-"],
    ["Last Name:", studentDetails.last_name],
    ["Suffix:", studentDetails.suffix || "-"],
    ["Email: ", studentDetails.email || "-"],
    ["Status:", studentDetails.status],
  ];

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <Text style={styles.textHeader}>Student Details</Text>

      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        {studentDetailRows.map(([label, value]) => (
          <View key={label} style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>{label}</Text>
            <Text style={styles.detail}>{value}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(getEditStudentRoute(studentDetails.id_number))
            }
          />
        </View>
        {studentDetails.status === "Disabled" ? null : (
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
        title="Confirm Deletion"
        message={`Are you sure you want to disable ${studentDetails.first_name} ${studentDetails.last_name}?`}
        type="warning"
        onClose={handleDisableModalClose}
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
      <StatusBar style="light" />
    </View>
  );
};

export default StudentDetails;

const styles = StyleSheet.create({
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
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
