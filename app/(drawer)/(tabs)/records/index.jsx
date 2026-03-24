import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import moment from "moment";
import CustomSearch from "../../../../components/CustomSearch";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { router } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";
import { getStoredUser } from "../../../../database/queries";
import {
  fetchUserOngoingEvents,
  fetchUserPastEvents,
  fetchAllPastEvents,
  fetchAllOngoingEvents,
} from "../../../../services/api/records";

const Records = () => {
  const { user } = useAuth();
  const { loading: eventsLoading, lastEventUpdate } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [studentId, setStudentId] = useState(null);

  const canViewRecords = (userRoleId) => {
    return [1, 2, 3].includes(userRoleId);
  };

  const fetchRecordsData = useCallback(async () => {
    if (!user || !canViewRecords(user.role_id)) {
      setOngoingEvents([]);
      setPastEvents([]);
      return;
    }
    try {
      setLoading(true);
      let ongoingEventsData = [];
      let pastEventsData = [];
      let userIdNumber = null;

      if (user.role_id === 1 || user.role_id === 2) {
        const storedUser = await getStoredUser();
        if (!storedUser || !storedUser.id_number) {
          return;
        }
        userIdNumber = storedUser.id_number;
        setStudentId(userIdNumber);
        const [ongoingResponse, pastResponse] = await Promise.all([
          fetchUserOngoingEvents(userIdNumber),
          fetchUserPastEvents(userIdNumber),
        ]);
        ongoingEventsData = ongoingResponse?.events || [];
        pastEventsData = pastResponse?.events || [];
      } else if (user.role_id === 3) {
        const [ongoingResponse, pastResponse] = await Promise.all([
          fetchAllOngoingEvents(),
          fetchAllPastEvents(),
        ]);
        ongoingEventsData = ongoingResponse?.events || [];
        pastEventsData = pastResponse?.events || [];
      }

      const processEvents = (events) => {
        return events.map((event) => ({
          event_id: event.event_id,
          event_name: event.event_name,
          event_dates: processEventDates(event.event_dates),
        }));
      };

      const processedOngoing = processEvents(ongoingEventsData);
      const processedPast = processEvents(pastEventsData);

      setOngoingEvents(processedOngoing);
      setPastEvents(processedPast);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.role_id, user?.id_number]);

  const processEventDates = (eventDates) => {
    if (!eventDates) return [];

    let dates = [];

    if (typeof eventDates === "string") {
      dates = eventDates
        .split(",")
        .map((date) => date.trim())
        .filter(Boolean);
    } else if (Array.isArray(eventDates)) {
      dates = eventDates.filter(Boolean);
    } else {
      dates = [eventDates].filter(Boolean);
    }

    return dates
      .map((date) => {
        const parsedDate = moment(date);
        return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;
      })
      .filter(Boolean);
  };

  useEffect(() => {
    if (user) {
      fetchRecordsData();
    }
  }, [user, fetchRecordsData]);

  useEffect(() => {
    if (lastEventUpdate > 0) {
      setTimeout(() => {
        fetchRecordsData();
      }, 1000);
    }
  }, [lastEventUpdate, fetchRecordsData]);

  const { filteredOngoing, filteredPast } = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredOngoing: ongoingEvents,
        filteredPast: pastEvents,
      };
    }
    const searchLower = searchTerm.toLowerCase();
    return {
      filteredOngoing: ongoingEvents.filter((event) =>
        event.event_name.toLowerCase().includes(searchLower)
      ),
      filteredPast: pastEvents.filter((event) =>
        event.event_name.toLowerCase().includes(searchLower)
      ),
    };
  }, [ongoingEvents, pastEvents, searchTerm]);

  const onRefresh = useCallback(async () => {
    if (loading) return;
    await fetchRecordsData();
  }, [loading, fetchRecordsData]);

  const formatEventDates = useCallback((eventDates) => {
    if (!Array.isArray(eventDates) || eventDates.length === 0) {
      return "No dates available";
    }

    const validDates = eventDates
      .map((date) => moment(date))
      .filter((momentDate) => momentDate.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());

    if (validDates.length === 0) {
      return "No dates available";
    }

    if (validDates.length === 1) {
      return validDates[0].format("MMM DD, YYYY");
    }

    let isConsecutive = true;
    for (let i = 1; i < validDates.length; i++) {
      const diff = validDates[i].diff(validDates[i - 1], "days");
      if (diff !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive) {
      const startDate = validDates[0];
      const endDate = validDates[validDates.length - 1];

      if (
        startDate.year() === endDate.year() &&
        startDate.month() === endDate.month()
      ) {
        return `${startDate.format("MMM DD")}-${endDate.format("DD, YYYY")}`;
      } else {
        return `${startDate.format("MMM DD")} - ${endDate.format(
          "MMM DD, YYYY"
        )}`;
      }
    }

    const datesToShow = validDates.slice(0, 3);
    const formatted = datesToShow
      .map((date) => date.format("MMM DD, YYYY"))
      .join(", ");

    if (validDates.length > 3) {
      return `${formatted}... (+${validDates.length - 3} more)`;
    }

    return formatted;
  }, []);

  const handleEventPress = useCallback(
    (eventId) => {
      if (user?.role_id === 1 || user?.role_id === 2) {
        router.push(
          `/records/Attendance?eventId=${eventId}&studentId=${studentId}`
        );
      } else if (user?.role_id === 3) {
        router.push(`/records/BlockList?eventId=${eventId}`);
      }
    },
    [user?.role_id, studentId]
  );

  const renderEventSection = useCallback(
    (title, events) => {
      if (events.length === 0) return null;
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {events.map((event, index) => (
            <TouchableOpacity
              key={`${event.event_id}-${index}`}
              style={styles.eventContainer}
              onPress={() => handleEventPress(event.event_id)}
            >
              <Text style={styles.eventTitle}>{event.event_name}</Text>
              <Text style={styles.eventDate}>
                {formatEventDates(event.event_dates)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    },
    [handleEventPress, formatEventDates]
  );

  const renderContent = useCallback(() => {
    if (loading && ongoingEvents.length === 0 && pastEvents.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      );
    }
    if (!canViewRecords(user?.role_id)) {
      return (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>
            Your role does not have permission to view records.
          </Text>
        </View>
      );
    }
    const hasEvents = filteredOngoing.length > 0 || filteredPast.length > 0;
    if (!hasEvents) {
      return (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>
            {searchTerm.trim()
              ? "No records found matching your search."
              : "No records available."}
          </Text>
        </View>
      );
    }
    return (
      <>
        {renderEventSection("Ongoing Events", filteredOngoing)}
        {renderEventSection("Past Events", filteredPast)}
      </>
    );
  }, [
    loading,
    ongoingEvents.length,
    pastEvents.length,
    canViewRecords,
    user?.role_id,
    filteredOngoing,
    filteredPast,
    searchTerm,
    renderEventSection,
  ]);

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.searchContainer}>
        <CustomSearch placeholder="Search records" onSearch={setSearchTerm} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollviewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || eventsLoading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default Records;

const styles = StyleSheet.create({
  searchContainer: {
    width: "90%",
    marginTop: 30,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    marginBottom: 20,
  },
  scrollviewContent: {
    alignItems: "center",
    flexGrow: 1,
  },
  sectionContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.large,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.title,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  eventContainer: {
    borderWidth: 2,
    width: "90%",
    minHeight: 50,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.medium,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.small,
  },
  eventTitle: {
    color: theme.colors.primary,
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.large,
  },
  eventDate: {
    fontSize: theme.fontSizes.small,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    marginTop: 2,
  },
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.large,
    paddingHorizontal: theme.spacing.medium,
  },
  noEventsText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.large,
  },
  loadingText: {
    fontSize: theme.fontSizes.large,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
  },
});
