import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import {
  fetchEventById,
  deleteEvent,
  approveEvent,
} from "../../../../services/api";
import { getStoredUser } from "../../../../database/queries";

const getEditEventRoute = (eventId) =>
  `/eventManagement/events/EditEvent?id=${eventId}`;

const EventDetails = () => {
  const { id: eventId } = useLocalSearchParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    const fetchStoredUser = async () => {
      try {
        const user = await getStoredUser();
        setStoredUser(user);
      } catch (error) {}
    };
    fetchStoredUser();
  }, []);

  const fetchEventDetails = useCallback(async () => {
    try {
      if (!eventId) throw new Error("Invalid event ID");
      const eventData = await fetchEventById(eventId);
      if (!eventData) throw new Error("Event details not found");
      setEventDetails(eventData);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchEventDetails();
    }, [fetchEventDetails])
  );

  const handleDeletePress = () => {
    setIsDeleteModalVisible(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalVisible(false);
  };

  const handleApprovePress = () => {
    setIsApproveModalVisible(true);
  };

  const handleApproveModalClose = () => {
    setIsApproveModalVisible(false);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
  };

  const navigateBackAfterSuccess = () => {
    setTimeout(() => {
      setIsSuccessModalVisible(false);
      router.back();
    }, 2000);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteEvent(eventDetails.event_id);
      handleDeleteModalClose();
      setSuccessMessage(
        `${eventDetails.event_name} has been successfully deleted.`
      );
      setIsSuccessModalVisible(true);
      navigateBackAfterSuccess();
    } catch (error) {}
  };

  const handleConfirmApprove = async () => {
    try {
      await approveEvent(eventDetails.event_id, storedUser.id_number);
      handleApproveModalClose();
      setSuccessMessage(
        `${eventDetails.event_name} has been successfully approved.`
      );
      setIsSuccessModalVisible(true);
      navigateBackAfterSuccess();
    } catch (error) {}
  };

  const formatColumnData = (data, separator = ",") => {
    if (!data) return <Text style={styles.columnItem}>-</Text>;
    const items = data.split(separator).map((item) => item.trim());
    return items.map((item, index) => (
      <Text key={index} style={styles.columnItem}>
        {item}
      </Text>
    ));
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!eventDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Event details not found.</Text>
      </View>
    );
  }

  const eventDetailRows = [
    { label: "Event Name:", value: eventDetails.event_name || "-" },
    { label: "Description:", value: eventDetails.description || "-" },
    { label: "Venue:", value: eventDetails.venue || "-" },
    { label: "Created By:", value: eventDetails.created_by || "-" },
  ];

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Event Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        {eventDetailRows.map((row) => (
          <View key={row.label} style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>{row.label}</Text>
            <Text style={styles.detail}>{row.value}</Text>
          </View>
        ))}
        {eventDetails.status !== "Pending" && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>Approved By:</Text>
            <Text style={styles.detail}>{eventDetails.approved_by || "-"}</Text>
          </View>
        )}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Event Dates:</Text>
          <View style={styles.columnContainer}>
            {formatColumnData(eventDetails.event_dates)}
          </View>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Event Blocks:</Text>
          <View style={styles.columnContainer}>
            {formatColumnData(eventDetails.block_names)}
          </View>
        </View>
        {eventDetails.am_in && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>AM In:</Text>
            <Text style={styles.detail}>{eventDetails.am_in}</Text>
          </View>
        )}
        {eventDetails.am_out && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>AM Out:</Text>
            <Text style={styles.detail}>{eventDetails.am_out}</Text>
          </View>
        )}
        {eventDetails.pm_in && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>PM In:</Text>
            <Text style={styles.detail}>{eventDetails.pm_in}</Text>
          </View>
        )}
        {eventDetails.pm_out && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>PM Out:</Text>
            <Text style={styles.detail}>{eventDetails.pm_out}</Text>
          </View>
        )}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Scan Personnel:</Text>
          <Text style={styles.detail}>
            {eventDetails.scan_personnel || "-"}
          </Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Status:</Text>
          <Text style={styles.detail}>{eventDetails.status || "-"}</Text>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        {eventDetails.status !== "Archived" && (
          <>
            {eventDetails.status === "Pending" && storedUser?.role_id === 4 ? (
              <View style={styles.button}>
                <CustomButton title="APPROVE" onPress={handleApprovePress} />
              </View>
            ) : (
              <View style={styles.button}>
                <CustomButton
                  title="EDIT"
                  onPress={() =>
                    router.push(getEditEventRoute(eventDetails.event_id))
                  }
                />
              </View>
            )}
            {eventDetails.status !== "deleted" && (
              <View style={styles.button}>
                <CustomButton
                  title="DELETE"
                  type="secondary"
                  onPress={handleDeletePress}
                />
              </View>
            )}
          </>
        )}
      </View>
      <CustomModal
        visible={isApproveModalVisible}
        title="Confirm Approval"
        message={`Are you sure you want to approve ${eventDetails.event_name}?`}
        type="warning"
        onClose={handleApproveModalClose}
        onConfirm={handleConfirmApprove}
        cancelTitle="Cancel"
        confirmTitle="Approve"
      />
      <CustomModal
        visible={isDeleteModalVisible}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${eventDetails.event_name}?`}
        type="warning"
        onClose={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        cancelTitle="Cancel"
        confirmTitle="Delete"
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={handleSuccessModalClose}
        cancelTitle="CLOSE"
        hideButtons={true}
      />
      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default EventDetails;


const styles = StyleSheet.create({
  headerContainer: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  title: {
    fontSize: theme.fontSizes.huge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
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
    marginBottom: theme.spacing.medium,
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
  columnContainer: {
    flexDirection: "column",
    width: "60%",
  },
  columnItem: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
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
