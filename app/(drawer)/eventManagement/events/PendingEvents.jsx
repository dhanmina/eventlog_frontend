import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import {
  fetchEvents,
  approveEvent,
  deleteEvent,
} from "../../../../services/api/events";
import { router } from "expo-router";
import icons from "../../../../constants/icons";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomModal from "../../../../components/CustomModal";
import { getStoredUser } from "../../../../database/queries";

export default function PendingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [isApproveSuccessModalVisible, setIsApproveSuccessModalVisible] =
    useState(false);
  const [isDeleteSuccessModalVisible, setIsDeleteSuccessModalVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingEvents = async () => {
    try {
      const response = await fetchEvents();
      const fetchedEvents = Array.isArray(response?.events)
        ? response.events
        : [];
      const filteredPendingEvents = fetchedEvents.filter(
        (event) => event.status === "Pending" && event.event_id
      );
      setEvents(filteredPendingEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingEvents();
  };

  useEffect(() => {
    const loadAdminId = async () => {
      try {
        const storedUser = await getStoredUser();
        console.log("STORED", storedUser);

        if (storedUser && storedUser.id_number) {
          setAdminId(storedUser.id_number);
        }
      } catch (error) {
        console.error("Error loading admin ID:", error);
      }
    };
    loadAdminId();
    loadPendingEvents();
  }, []);

  const handleOpenModal = (type, event) => {
    if (!event || !event.event_id) return;
    setModalType(type);
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleApproveEvent = async () => {
    if (!selectedEvent || !adminId) return;
    try {
      await approveEvent(selectedEvent.event_id, adminId);
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.event_id !== selectedEvent.event_id)
      );
      handleCloseModal();
      setIsApproveSuccessModalVisible(true);
    } catch (error) {
      console.error("Error approving event:", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      await deleteEvent(selectedEvent.event_id);
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.event_id !== selectedEvent.event_id)
      );
      handleCloseModal();
      setIsDeleteSuccessModalVisible(true);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
        <Text style={styles.loadingText}>Loading pending events...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>PENDING EVENTS</Text>
      <ScrollView
        style={{ flex: 1, width: "100%", marginBottom: 70 }}
        contentContainerStyle={[styles.scrollview, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {events.length > 0 ? (
          events.map((event) => (
            <TouchableOpacity
              key={event.event_id}
              style={styles.eventContainer}
              onPress={() =>
                router.push(
                  `/eventManagement/events/EventDetails?id=${event.event_id}`
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {event.event_name}
                </Text>
                <Text style={styles.status} numberOfLines={1}>
                  {event.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() => handleOpenModal("approve", event)}
                >
                  <Image source={icons.check} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenModal("delete", event)}
                >
                  <Image source={icons.trash} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No pending events found</Text>
        )}
      </ScrollView>
      <CustomModal
        visible={isModalVisible && modalType === "approve"}
        title="Confirm Approval"
        message={`Are you sure you want to approve "${selectedEvent?.event_name}"?`}
        type="warning"
        onClose={handleCloseModal}
        onConfirm={handleApproveEvent}
        cancelTitle="Cancel"
        confirmTitle="Approve"
      />
      <CustomModal
        visible={isModalVisible && modalType === "delete"}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${selectedEvent?.event_name}"?`}
        type="warning"
        onClose={handleCloseModal}
        onConfirm={handleDeleteEvent}
        cancelTitle="Cancel"
        confirmTitle="Delete"
      />
      <CustomModal
        visible={isApproveSuccessModalVisible}
        title="Success"
        message="Event approved successfully!"
        type="success"
        onClose={() => setIsApproveSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />
      <CustomModal
        visible={isDeleteSuccessModalVisible}
        title="Success"
        message="Event deleted successfully!"
        type="success"
        onClose={() => setIsDeleteSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />
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
  loadingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  eventContainer: {
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
  status: {
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
});
