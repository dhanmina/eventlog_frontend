import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import TabsComponent from "../../../../components/TabsComponent";
import { StatusBar } from "expo-status-bar";
import { fetchEvents, deleteEvent } from "../../../../services/api";
import { router, useFocusEffect } from "expo-router";
import images from "../../../../constants/images";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

const EVENT_ROUTES = {
  add: "/eventManagement/events/AddEvent",
  details: (eventId) => `/eventManagement/events/EventDetails?id=${eventId}`,
  edit: (eventId) => `/eventManagement/events/EditEvent?id=${eventId}`,
  pending: "/eventManagement/events/PendingEvents",
};

const isArchivedEvent = (event) => event.status === "Archived";
const isVisibleEvent = (event) => event.status !== "Deleted";
const isApprovedOrArchivedEvent = (event) =>
  event.status === "Approved" || event.status === "Archived";
const isPendingEvent = (event) => event.status === "Pending";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetchEvents();
      if (!response?.events) return;
      const fetchedEvents = Array.isArray(response.events)
        ? response.events
        : [];
      const filteredEvents = fetchedEvents.filter(isVisibleEvent);
      setEvents(filteredEvents);
    } catch (err) {}
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearchQuery = searchQuery.toLowerCase();

    return events.filter((event) => {
      const eventName = event.event_name?.toLowerCase() || "";
      const venue = event.venue?.toLowerCase() || "";

      return (
        eventName.includes(normalizedSearchQuery) ||
        venue.includes(normalizedSearchQuery)
      );
    });
  }, [events, searchQuery]);

  const approvedOrArchivedEvents = useMemo(
    () => filteredEvents.filter(isApprovedOrArchivedEvent),
    [filteredEvents]
  );

  const pendingEventsCount = useMemo(
    () => events.filter(isPendingEvent).length,
    [events]
  );

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
            ? { ...event, status: "deleted" }
            : event
        )
      );
      handleDeleteModalClose();
      setIsSuccessModalVisible(true);
    } catch (error) {}
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>EVENTS</Text>

      <View style={styles.searchContainer}>
        <SearchBar placeholder="Search events..." onSearch={setSearchQuery} />
      </View>

      {pendingEventsCount > 0 && (
        <TouchableOpacity
          style={styles.pendingButton}
          onPress={() => router.push(EVENT_ROUTES.pending)}
        >
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>
              {pendingEventsCount} PENDING EVENT
              {pendingEventsCount > 1 ? "S" : ""}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {approvedOrArchivedEvents.length > 0 ? (
          approvedOrArchivedEvents.map((event) => (
            <TouchableOpacity
              key={event.event_id}
              style={styles.eventContainer}
              onPress={() =>
                router.push(EVENT_ROUTES.details(event.event_id))
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
                  onPress={() =>
                    router.push(EVENT_ROUTES.edit(event.event_id))
                  }
                  disabled={isArchivedEvent(event)}
                  style={[
                    styles.iconButton,
                    isArchivedEvent(event) && styles.disabledIconButton,
                  ]}
                >
                  <Image source={images.edit} style={styles.icon} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeletePress(event)}
                  disabled={isArchivedEvent(event)}
                  style={[
                    styles.iconButton,
                    isArchivedEvent(event) && styles.disabledIconButton,
                  ]}
                >
                  <Image source={images.trash} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : pendingEventsCount === 0 ? (
          <Text style={styles.noResults}>No events found</Text>
        ) : null}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD EVENT"
          onPress={() => router.push(EVENT_ROUTES.add)}
        />
      </View>

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
      <TabsComponent />
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
  searchContainer: {
    paddingHorizontal: theme.spacing.medium,
    width: "100%",
  },
  pendingButton: {
    width: "100%",
  },
  scrollviewContainer: {
    flex: 1,
    width: "100%",
    marginBottom: 70,
  },
  pendingContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.medium,
    marginTop: theme.spacing.medium,
  },
  pendingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.primary,
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
    paddingBottom: 80,
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
  iconButton: {
    opacity: 1,
  },
  disabledIconButton: {
    opacity: 0.5,
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
  buttonContainer: {
    position: "absolute",
    bottom: theme.spacing.medium,
    alignSelf: "center",
    width: "80%",
    padding: theme.spacing.medium,
    marginBottom: 80,
  },
});
