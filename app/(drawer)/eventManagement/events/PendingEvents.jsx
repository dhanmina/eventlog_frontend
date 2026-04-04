import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { fetchEvents, deleteEvent } from "../../../../services/api/events";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function PendingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [isApproveSuccessModalVisible, setIsApproveSuccessModalVisible] = useState(false);
  const [isDeleteSuccessModalVisible, setIsDeleteSuccessModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingEvents = async () => {
    try {
      const response = await fetchEvents();
      const fetchedEvents = Array.isArray(response?.events) ? response.events : [];
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

  useFocusEffect(
    useCallback(() => {
      const loadAdminId = async () => {
        try {
          const { getStoredUser } = await import("../../../../database/queries");
          const storedUser = await getStoredUser();
          if (storedUser && storedUser.id_number) {
            setAdminId(storedUser.id_number);
          }
        } catch (error) {
          console.error("[PendingEvents] Error loading admin ID:", error);
        }
      };
      loadAdminId();
      loadPendingEvents();
    }, [])
  );

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
      await deleteEvent(selectedEvent.event_id);
      const { approveEvent } = await import("../../../../services/api/events");
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
      <View style={globalStyles.secondaryContainer}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>PENDING EVENTS</Text>
          <Text style={styles.headerSubtitle}>Events awaiting approval</Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
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

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>PENDING EVENTS</Text>
        <Text style={styles.headerSubtitle}>Events awaiting approval</Text>
        {events.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{events.length} pending</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {events.length > 0 ? (
          events.map((event) => (
            <TouchableOpacity
              key={event.event_id}
              style={styles.card}
              onPress={() =>
                router.push(`/eventManagement/events/EventDetails?id=${event.event_id}`)
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {event.event_name}
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {event.venue || ""}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleOpenModal("approve", event)}
                >
                  <Image source={icons.check} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleOpenModal("delete", event)}
                >
                  <Image source={icons.trash} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.check} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No pending events</Text>
            <Text style={styles.emptySub}>All caught up!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
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
    marginTop: 3,
  },
  headerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    marginTop: theme.spacing.small,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
  },
  headerStat: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
    marginBottom: theme.spacing.small,
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
  cardLeft: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
  },
  cardBody: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    gap: 3,
  },
  cardName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  cardSub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: theme.spacing.xsmall,
  },
  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: theme.spacing.small,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    tintColor: theme.colors.primary,
    opacity: 0.2,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    opacity: 0.4,
  },
  emptySub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.3,
  },
});
