import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { fetchAdminById, disableAdmin, enableAdmin } from "../../../../services/api/admins";
import { getStoredUser } from "../../../../database/queries";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || "—"}</Text>
  </View>
);

const AdminDetails = () => {
  const { id_number } = useLocalSearchParams();
  const [adminDetails, setAdminDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isOwnAccountModalVisible, setIsOwnAccountModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      if (!id_number) throw new Error("Invalid admin ID");
      const data = await fetchAdminById(id_number);
      if (!data) throw new Error("Admin details not found");
      setAdminDetails(data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        const user = await getStoredUser();
        setCurrentUser(user);
        await fetchData();
      };
      loadData();
    }, [id_number])
  );

  const handleTogglePress = () => {
    if (currentUser?.id_number === adminDetails.id_number) {
      setIsOwnAccountModalVisible(true);
      return;
    }
    setIsToggleModalVisible(true);
  };

  const handleConfirmToggle = async () => {
    if (!adminDetails) return;
    const isDisabled = adminDetails.status === "Disabled";
    try {
      if (isDisabled) {
        await enableAdmin(adminDetails.id_number);
      } else {
        await disableAdmin(adminDetails.id_number);
      }
      setIsToggleModalVisible(false);
      setSuccessMessage(`${adminDetails.first_name} ${adminDetails.last_name} has been ${isDisabled ? "enabled" : "disabled"} successfully.`);
      setIsSuccessModalVisible(true);
    } catch {}
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  if (!adminDetails)
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Admin not found.</Text>
      </View>
    );

  const isDisabled = adminDetails.status === "Disabled";
  const fullName = `${adminDetails.first_name || ""} ${adminDetails.middle_name ? adminDetails.middle_name + " " : ""}${adminDetails.last_name || ""}${adminDetails.suffix ? ", " + adminDetails.suffix : ""}`;
  const isOwnAccount = currentUser?.id_number === adminDetails.id_number;

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={isDisabled ? "Enable Admin" : "Disable Admin"}
        message={`Are you sure you want to ${isDisabled ? "enable" : "disable"} ${adminDetails.first_name} ${adminDetails.last_name}?`}
        type="warning"
        onClose={() => setIsToggleModalVisible(false)}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={isDisabled ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => {
          setIsSuccessModalVisible(false);
          fetchData();
        }}
        cancelTitle="CLOSE"
      />
      <CustomModal
        visible={isOwnAccountModalVisible}
        title="Action Not Allowed"
        message="You cannot disable your own account."
        type="warning"
        onClose={() => setIsOwnAccountModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{fullName}</Text>
        <Text style={styles.headerSubtitle}>
          {[adminDetails.id_number, adminDetails.role_name].filter(Boolean).join("  ·  ")}
        </Text>
        <View style={[styles.statusBadge, isDisabled && styles.statusBadgeDisabled]}>
          <Text style={[styles.statusText, isDisabled && styles.statusTextDisabled]}>
            {adminDetails.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Row label="ID Number" value={adminDetails.id_number} />
          <Row label="First Name" value={adminDetails.first_name} />
          <Row label="Middle Name" value={adminDetails.middle_name} />
          <Row label="Last Name" value={adminDetails.last_name} />
          <Row label="Suffix" value={adminDetails.suffix} />
          <Row label="Email" value={adminDetails.email} />
          <Row label="Role" value={adminDetails.role_name} />
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>{adminDetails.status}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() => router.push(`/userManagement/admins/EditAdmin?id_number=${adminDetails.id_number}`)}
          />
        </View>
        {!isOwnAccount && (
          <View style={styles.button}>
            <CustomButton
              title={isDisabled ? "ENABLE" : "DISABLE"}
              type="secondary"
              onPress={handleTogglePress}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default AdminDetails;

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    gap: 4,
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
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xsmall,
    backgroundColor: "rgba(251,241,229,0.2)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  statusBadgeDisabled: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  statusText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
  },
  statusTextDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  detailsWrapper: {
    flexGrow: 1,
    paddingVertical: theme.spacing.small,
  },
  infoCard: {
    width: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
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
  row: {
    flexDirection: "row",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37,85,134,0.07)",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    width: "40%",
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },
  rowValue: {
    flex: 1,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.small,
    paddingTop: theme.spacing.medium,
    paddingBottom: 80 + theme.spacing.medium,
    width: "100%",
  },
  button: {
    flex: 1,
  },
  errorText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
    textAlign: "center",
  },
});
