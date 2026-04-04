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
import { fetchUserById, disableUser, enableUser } from "../../../../services/api/users";
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

const StudentDetails = () => {
  const { id: id_number } = useLocalSearchParams();
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    try {
      if (!id_number) throw new Error("Invalid student ID");
      const data = await fetchUserById(id_number);
      if (!data) throw new Error("Student details not found");
      setStudentDetails(data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setIsLoading(true); fetchData(); }, [id_number]));

  const handleConfirmToggle = async () => {
    if (!studentDetails) return;
    const isDisabled = studentDetails.status === "Disabled";
    try {
      if (isDisabled) {
        await enableUser(studentDetails.id_number);
      } else {
        await disableUser(studentDetails.id_number);
      }
      setIsToggleModalVisible(false);
      setSuccessMessage(`Student ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error("Error toggling student:", error);
    }
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  if (!studentDetails)
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Student not found.</Text>
      </View>
    );

  const isDisabled = studentDetails.status === "Disabled";
  const fullName = `${studentDetails.first_name || ""} ${studentDetails.middle_name ? studentDetails.middle_name + " " : ""}${studentDetails.last_name || ""}${studentDetails.suffix ? ", " + studentDetails.suffix : ""}`;

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={isDisabled ? "Enable Student" : "Disable Student"}
        message={`Are you sure you want to ${isDisabled ? "enable" : "disable"} ${studentDetails.first_name} ${studentDetails.last_name}?`}
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

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{fullName}</Text>
        <Text style={styles.headerSubtitle}>
          {[studentDetails.id_number, studentDetails.block_name].filter(Boolean).join("  ·  ")}
        </Text>
        <View style={[styles.statusBadge, isDisabled && styles.statusBadgeDisabled]}>
          <Text style={[styles.statusText, isDisabled && styles.statusTextDisabled]}>
            {studentDetails.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Row label="ID Number" value={studentDetails.id_number} />
          <Row label="Role" value={studentDetails.role_id === 1 ? "Student" : "Officer"} />
          <Row label="Block" value={studentDetails.block_name} />
          <Row label="First Name" value={studentDetails.first_name} />
          <Row label="Middle Name" value={studentDetails.middle_name} />
          <Row label="Last Name" value={studentDetails.last_name} />
          <Row label="Suffix" value={studentDetails.suffix} />
          <Row label="Email" value={studentDetails.email} />
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>{studentDetails.status}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() => router.push(`/userManagement/students/EditStudent?id=${studentDetails.id_number}`)}
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

export default StudentDetails;

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
