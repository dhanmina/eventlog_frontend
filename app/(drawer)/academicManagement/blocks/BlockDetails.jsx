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
import { fetchBlockById, disableBlock, enableBlock } from "../../../../services/api/blocks";
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

const BlockDetails = () => {
  const { id: block_id } = useLocalSearchParams();
  const [blockDetails, setBlockDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchBlockDetails = async () => {
    try {
      if (!block_id) throw new Error("Invalid block ID");
      const blockData = await fetchBlockById(block_id);
      if (!blockData || Object.keys(blockData).length === 0)
        throw new Error("Block details not found");
      setBlockDetails(blockData);
    } catch (error) {
      console.error(error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchBlockDetails();
    }, [block_id])
  );

  const handleConfirmToggle = async () => {
    const isDisabled = blockDetails.status === "Disabled";
    try {
      if (isDisabled) {
        await enableBlock(blockDetails.block_id);
      } else {
        await disableBlock(blockDetails.block_id);
      }
      setIsToggleModalVisible(false);
      setSuccessMessage(`Block ${isDisabled ? "enabled" : "disabled"} successfully!`);
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

  if (!blockDetails)
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Block not found.</Text>
      </View>
    );

  const isDisabled = blockDetails.status === "Disabled";

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={isDisabled ? "Enable Block" : "Disable Block"}
        message={`Are you sure you want to ${isDisabled ? "enable" : "disable"} ${blockDetails.course_code} ${blockDetails.block_name}?`}
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
          fetchBlockDetails();
        }}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>
          {`${blockDetails.course_code || ""} ${blockDetails.block_name || ""}`.trim()}
        </Text>
        <Text style={styles.headerSubtitle}>
          {[blockDetails.course_name, blockDetails.year_level_name]
            .filter(Boolean)
            .join("  ·  ")}
        </Text>
        <View style={[styles.statusBadge, isDisabled && styles.statusBadgeDisabled]}>
          <Text style={[styles.statusText, isDisabled && styles.statusTextDisabled]}>
            {blockDetails.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Row label="Block Name" value={blockDetails.block_name} />
          <Row label="Course" value={`${blockDetails.course_code} — ${blockDetails.course_name}`} />
          <Row label="Year Level" value={blockDetails.year_level_name} />
          <Row label="Department" value={blockDetails.department_name} />
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>{blockDetails.status}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(`/academicManagement/blocks/EditBlock?id=${blockDetails.block_id}`)
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

export default BlockDetails;

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
