import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { fetchDepartmentById, disableDepartment, enableDepartment } from "../../../../services/api/departments";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

const Row = ({ label, value, last }) => (
  <View style={[styles.row, last && styles.rowLast]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || "—"}</Text>
  </View>
);

const DepartmentDetails = () => {
  const { id: department_id } = useLocalSearchParams();
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDetails = async () => {
    try {
      if (!department_id) throw new Error("Invalid department ID");
      const data = await fetchDepartmentById(department_id);
      if (!data || Object.keys(data).length === 0) throw new Error("Department not found");
      setDetails(data);
    } catch (error) {
      console.error(error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchDetails();
    }, [department_id])
  );

  const handleConfirmToggle = async () => {
    const isDisabled = details.status === "Disabled";
    try {
      if (isDisabled) {
        await enableDepartment(details.department_id);
      } else {
        await disableDepartment(details.department_id);
      }
      setIsToggleModalVisible(false);
      setSuccessMessage(`Department ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error(error.message || error);
    }
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  if (!details)
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Department not found.</Text>
      </View>
    );

  const isDisabled = details.status === "Disabled";

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={isDisabled ? "Enable Department" : "Disable Department"}
        message={`Are you sure you want to ${isDisabled ? "enable" : "disable"} ${details.department_name}?`}
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
          fetchDetails();
        }}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{details.department_name}</Text>
        <Text style={styles.headerSubtitle}>{details.department_code}</Text>
        <View style={[styles.statusBadge, isDisabled && styles.statusBadgeDisabled]}>
          <Text style={[styles.statusText, isDisabled && styles.statusTextDisabled]}>
            {details.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Row label="Department Name" value={details.department_name} />
          <Row label="Department Code" value={details.department_code} />
          <Row label="Status" value={details.status} last />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(`/academicManagement/departments/EditDepartment?id=${details.department_id}`)
            }
          />
        </View>
        <View style={styles.button}>
          <CustomButton
            title={isDisabled ? "ENABLE" : "DISABLE"}
            type="secondary"
            onPress={() => setIsToggleModalVisible(true)}
          />
        </View>
      </View>
    </View>
  );
};

export default DepartmentDetails;

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
