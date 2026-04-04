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
import { fetchEventById, deleteEvent, approveEvent } from "../../../../services/api/events";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import { getStoredUser } from "../../../../database/queries";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || "—"}</Text>
  </View>
);

const EventDetails = () => {
  const { id: eventId } = useLocalSearchParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [storedUser, setStoredUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const user = await getStoredUser();
          setStoredUser(user);
          if (!eventId) throw new Error("Invalid event ID");
          const eventData = await fetchEventById(eventId);
          if (!eventData) throw new Error("Event details not found");
          setEventDetails(eventData);
        } catch (error) {
          console.error("[EventDetails] Failed to fetch event details:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [eventId])
  );

  const handleConfirmDelete = async () => {
    try {
      await deleteEvent(eventDetails.event_id);
      setIsDeleteModalVisible(false);
      setSuccessMessage(`${eventDetails.event_name} has been successfully deleted.`);
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        router.back();
      }, 2000);
    } catch (error) {}
  };

  const handleConfirmApprove = async () => {
    if (!storedUser) return;
    try {
      await approveEvent(eventDetails.event_id, storedUser.id_number);
      setIsApproveModalVisible(false);
      setSuccessMessage(`${eventDetails.event_name} has been successfully approved.`);
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        router.back();
      }, 2000);
    } catch (error) {}
  };

  const formatColumnData = (data, separator = ",") => {
    if (!data) return "-";
    const items = data.split(separator).map((item) => item.trim());
    return items.join(", ");
  };

  if (isLoading)
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  if (!eventDetails)
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Event not found.</Text>
      </View>
    );

  const isArchived = eventDetails.status === "Archived";
  const isPending = eventDetails.status === "Pending";
  const canApprove = isPending && storedUser?.role_id === 4;

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isApproveModalVisible}
        title="Confirm Approval"
        message={`Are you sure you want to approve ${eventDetails.event_name}?`}
        type="warning"
        onClose={() => setIsApproveModalVisible(false)}
        onConfirm={handleConfirmApprove}
        cancelTitle="Cancel"
        confirmTitle="Approve"
      />
      <CustomModal
        visible={isDeleteModalVisible}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${eventDetails.event_name}?`}
        type="warning"
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        cancelTitle="Cancel"
        confirmTitle="Delete"
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
        hideButtons={true}
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{eventDetails.event_name || ""}</Text>
        <Text style={styles.headerSubtitle}>
          {[eventDetails.venue, eventDetails.status].filter(Boolean).join("  ·  ")}
        </Text>
        <View style={[styles.statusBadge, isArchived && styles.statusBadgeArchived]}>
          <Text style={[styles.statusText, isArchived && styles.statusTextArchived]}>
            {eventDetails.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailsWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Row label="Event Name" value={eventDetails.event_name} />
          <Row label="Description" value={eventDetails.description} />
          <Row label="Venue" value={eventDetails.venue} />
          <Row label="Event Dates" value={formatColumnData(eventDetails.event_dates)} />
          <Row label="Event Blocks" value={formatColumnData(eventDetails.block_names)} />
          {eventDetails.am_in && <Row label="AM In" value={eventDetails.am_in} />}
          {eventDetails.am_out && <Row label="AM Out" value={eventDetails.am_out} />}
          {eventDetails.pm_in && <Row label="PM In" value={eventDetails.pm_in} />}
          {eventDetails.pm_out && <Row label="PM Out" value={eventDetails.pm_out} />}
          <Row label="Created By" value={eventDetails.created_by} />
          {eventDetails.status !== "Pending" && (
            <Row label="Approved By" value={eventDetails.approved_by} />
          )}
          <Row label="Scan Personnel" value={eventDetails.scan_personnel} />
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>{eventDetails.status}</Text>
          </View>
        </View>
      </ScrollView>

      {!isArchived && (
        <View style={styles.buttonContainer}>
          {canApprove ? (
            <View style={styles.button}>
              <CustomButton title="APPROVE" onPress={() => setIsApproveModalVisible(true)} />
            </View>
          ) : (
            <View style={styles.button}>
              <CustomButton
                title="EDIT"
                onPress={() => router.push(`/eventManagement/events/EditEvent?id=${eventDetails.event_id}`)}
              />
            </View>
          )}
          <View style={styles.button}>
            <CustomButton
              title="DELETE"
              type="secondary"
              onPress={() => setIsDeleteModalVisible(true)}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default EventDetails;

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
  statusBadgeArchived: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  statusText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
  },
  statusTextArchived: {
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
