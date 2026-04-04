import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
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

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      const response = await fetchEvents();
      if (!response?.events) return;
      const fetchedEvents = Array.isArray(response.events)
        ? response.events
        : [];
      const filteredEvents = fetchedEvents.filter(
        (event) => event.status !== "Deleted"
      );
      setEvents(filteredEvents);
    } catch {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadEvents(); }, []));

  const filteredEvents = events.filter((event) => {
    const eventName = event.event_name?.toLowerCase() || "";
    const venue = event.venue?.toLowerCase() || "";
    return (
      eventName.includes(searchQuery.toLowerCase()) ||
      venue.includes(searchQuery.toLowerCase())
    );
  });

  const approvedOrArchivedEvents = filteredEvents.filter(
    (event) =>
      event.status === "Approved" ||
      event.status === "Archived" ||
      event.status === "Pending"
  );

  const pendingEventsCount = events.filter(
    (event) => event.status === "Pending"
  ).length;
  const approvedCount = events.filter((e) => e.status === "Approved").length;
  const archivedCount = events.filter((e) => e.status === "Archived").length;

  const handleDeletePress = (event) => {
    setEventToDelete(event);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalVisible(false);
    setEventToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.event_id);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.event_id === eventToDelete.event_id
            ? { ...event, status: "Deleted" }
            : event
        )
      );
      handleDeleteModalClose();
      setIsSuccessModalVisible(true);
    } catch {}
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isDeleteModalVisible}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${eventToDelete?.event_name}?`}
        type="warning"
        onClose={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        cancelTitle="Cancel"
        confirmTitle="Delete"
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Event deleted successfully!"
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>EVENTS</Text>
        <Text style={styles.headerSubtitle}>Manage school events and activities</Text>
        {events.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{approvedCount} Approved</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{pendingEventsCount} Pending</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{archivedCount} Archived</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar placeholder="Search events..." onSearch={setSearchQuery} />
      </View>

      {pendingEventsCount > 0 && (
        <TouchableOpacity
          style={{ width: "100%", marginTop: theme.spacing.small }}
          onPress={() => router.push(`/eventManagement/events/PendingEvents`)}
        >
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>
              {pendingEventsCount} PENDING EVENT{pendingEventsCount > 1 ? "S" : ""}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {approvedOrArchivedEvents.length > 0 ? (
          approvedOrArchivedEvents.map((event) => (
            <TouchableOpacity
              key={event.event_id}
              style={styles.card}
              onPress={() =>
                router.push(`/eventManagement/events/EventDetails?id=${event.event_id}`)
              }
              activeOpacity={0.8}
            >
              <View style={[styles.cardLeft, event.status === "Archived" && styles.cardLeftDisabled]} />
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
                  onPress={() =>
                    router.push(`/eventManagement/events/EditEvent?id=${event.event_id}`)
                  }
                >
                  <Image source={icons.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDeletePress(event)}
                >
                  <Image source={icons.trash} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : pendingEventsCount === 0 ? (
          <View style={styles.emptyState}>
            <Image source={icons.event} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add an event to get started"}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD EVENT"
          onPress={() => router.push("/eventManagement/events/AddEvent")}
        />
      </View>
      <View style={styles.tabSpacer} />
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
  headerStatDivider: {
    color: theme.colors.secondary,
    opacity: 0.3,
  },
  pendingContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.small,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
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
  cardLeftDisabled: {
    backgroundColor: "rgba(0,0,0,0.15)",
    opacity: 1,
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
  buttonContainer: {
    width: "100%",
    paddingVertical: theme.spacing.small,
  },
  tabSpacer: {
    height: 80,
  },
});
