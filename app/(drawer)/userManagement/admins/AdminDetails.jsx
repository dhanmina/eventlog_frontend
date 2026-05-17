import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { fetchAdminById, disableAdmin } from "../../../../services/api";
import { getStoredUser } from "../../../../database/queries";

const getEditAdminRoute = (idNumber) =>
  `/userManagement/admins/EditAdmin?id_number=${idNumber}`;

const AdminDetails = () => {
  const { id_number } = useLocalSearchParams();
  const [adminDetails, setAdminDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisableConfirmationVisible, setIsDisableConfirmationVisible] =
    useState(false);
  const [isDisableSuccessVisible, setIsDisableSuccessVisible] = useState(false);
  const [isOwnAccountDisableVisible, setIsOwnAccountDisableVisible] =
    useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const fetchAdminDetails = useCallback(async () => {
    try {
      if (!id_number) throw new Error("Invalid admin ID");

      const adminData = await fetchAdminById(id_number);
      if (!adminData) throw new Error("Admin details not found");

      setAdminDetails(adminData);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id_number]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      const fetchScreenData = async () => {
        try {
          const user = await getStoredUser();
          setCurrentUser(user);
        } catch (error) {
          console.error("Error fetching current user:", error);
        }

        await fetchAdminDetails();
      };

      fetchScreenData();
    }, [fetchAdminDetails])
  );

  const handleDisablePress = () => {
    if (currentUser?.id_number === adminDetails.id_number) {
      setIsOwnAccountDisableVisible(true);
      return;
    }
    setIsDisableConfirmationVisible(true);
  };

  const handleConfirmDisable = async () => {
    try {
      await disableAdmin(adminDetails.id_number);
      setIsDisableConfirmationVisible(false);
      setIsDisableSuccessVisible(true);
    } catch (error) {
      console.error("Error disabling admin:", error);
    }
  };

  const handleDisableSuccessClose = () => {
    setIsDisableSuccessVisible(false);
    fetchAdminDetails();
  };

  const handleOwnAccountDisableClose = () => {
    setIsOwnAccountDisableVisible(false);
  };

  const handleDisableConfirmationClose = () => {
    setIsDisableConfirmationVisible(false);
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!adminDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Admin details not found.</Text>
      </View>
    );
  }

  const adminDetailRows = [
    ["ID Number:", adminDetails.id_number],
    ["First Name:", adminDetails.first_name],
    ["Middle Name:", adminDetails.middle_name || "-"],
    ["Last Name:", adminDetails.last_name],
    ["Suffix:", adminDetails.suffix || "-"],
    ["Email Address:", adminDetails.email],
    ["Role:", adminDetails.role_name || "-"],
    ["Status:", adminDetails.status],
  ];

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Admin Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        {adminDetailRows.map(([label, value]) => (
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
              router.push(getEditAdminRoute(adminDetails.id_number))
            }
          />
        </View>
        {adminDetails.status !== "Disabled" &&
          currentUser?.id_number !== adminDetails.id_number && (
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
        visible={isDisableConfirmationVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${adminDetails.first_name} ${adminDetails.last_name}?`}
        type="warning"
        onClose={handleDisableConfirmationClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isDisableSuccessVisible}
        type="success"
        title="Admin Disabled"
        message={`${adminDetails.first_name} ${adminDetails.last_name} has been disabled successfully.`}
        cancelTitle="CLOSE"
        onClose={handleDisableSuccessClose}
      />

      <CustomModal
        visible={isOwnAccountDisableVisible}
        title="Action Not Allowed"
        message="You cannot disable your own account."
        type="warning"
        cancelTitle="CLOSE"
        onClose={handleOwnAccountDisableClose}
      />

      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default AdminDetails;

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.medium,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  detailsWrapper: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.medium,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
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
