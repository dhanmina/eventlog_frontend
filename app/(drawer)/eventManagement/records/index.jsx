import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { getRoleID } from "../../../../database/queries";
import {
  fetchAllPastEvents,
  fetchAllOngoingEvents,
} from "../../../../services/api/attendance";
import moment from "moment";
import CustomSearch from "../../../../components/CustomSearch";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { router } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";

const Records = () => {
  const [roleId, setRoleId] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [filteredOngoingEvents, setFilteredOngoingEvents] = useState([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [originalOngoing, setOriginalOngoing] = useState([]);
  const [originalPast, setOriginalPast] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatEventDates = useCallback((eventDates) => {
    if (!Array.isArray(eventDates) || eventDates.length === 0) {
      return "No dates available";
    }

    const sortedDates = eventDates
      .filter((date) => date && date.trim())
      .sort((a, b) => moment(a).valueOf() - moment(b).valueOf());

    if (sortedDates.length === 0) {
      return "No dates available";
    }

    if (sortedDates.length === 1) {
      return moment(sortedDates[0]).format("MMM DD, YYYY");
    }

    const momentDates = sortedDates.map((date) => moment(date));
    let isConsecutive = true;

    for (let i = 1; i < momentDates.length; i++) {
      const diff = momentDates[i].diff(momentDates[i - 1], "days");
      if (diff !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive && sortedDates.length === 2) {
      const startDate = momentDates[0];
      const endDate = momentDates[1];

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

    if (isConsecutive && sortedDates.length > 2) {
      const startDate = momentDates[0];
      const endDate = momentDates[momentDates.length - 1];

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

    return sortedDates
      .map((date) => moment(date).format("MMM DD, YYYY"))
      .join(", ");
  }, []);

  const processEvents = useCallback((events) => {
    return events.map((event) => ({
      event_id: event.event_id,
      event_name: event.event_name,
      event_dates:
        typeof event.event_dates === "string"
          ? event.event_dates.split(",").map((date) => date.trim())
          : Array.isArray(event.event_dates)
          ? event.event_dates
          : [event.event_dates].filter(Boolean),
    }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let ongoingEvents = [];
      let pastEvents = [];

      if (roleId === 4) {
        const ongoingApiResponse = await fetchAllOngoingEvents();
        const pastApiResponse = await fetchAllPastEvents();
        ongoingEvents = ongoingApiResponse?.events || [];
        pastEvents = pastApiResponse?.events || [];
      }

      let processedOngoing = [];
      let processedPast = [];

      if (
        ongoingEvents.length > 0 &&
        typeof ongoingEvents[0].event_dates === "string"
      ) {
        processedOngoing = processEvents(ongoingEvents);
        processedPast = processEvents(pastEvents);
      } else {
        const groupedEvents = {};
        [...ongoingEvents, ...pastEvents].forEach((record) => {
          const { event_id, event_name, event_date } = record;
          if (!groupedEvents[event_id]) {
            groupedEvents[event_id] = {
              event_id,
              event_name,
              event_dates: [],
            };
          }
          groupedEvents[event_id].event_dates.push(event_date);
        });

        const allGroupedEvents = Object.values(groupedEvents);
        processedOngoing = allGroupedEvents.filter((event) =>
          ongoingEvents.some((e) => e.event_id === event.event_id)
        );
        processedPast = allGroupedEvents.filter((event) =>
          pastEvents.some((e) => e.event_id === event.event_id)
        );
      }

      const allEvents = [...processedOngoing, ...processedPast];

      setAllEvents(allEvents);
      setOriginalOngoing(processedOngoing);
      setOriginalPast(processedPast);
      setFilteredOngoingEvents(processedOngoing);
      setFilteredPastEvents(processedPast);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [roleId, processEvents]);

  useEffect(() => {
    const fetchRoleId = async () => {
      const roleId = await getRoleID();
      if (!roleId) return;
      setRoleId(roleId);
    };
    fetchRoleId();
  }, []);

  useEffect(() => {
    if (roleId !== null) {
      fetchData();
    }
  }, [roleId, fetchData]);

  useEffect(() => {
    try {
      if (!searchTerm.trim()) {
        setFilteredOngoingEvents(originalOngoing);
        setFilteredPastEvents(originalPast);
      } else {
        const filteredEvents = allEvents.filter((event) =>
          event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOngoingEvents(
          filteredEvents.filter((event) =>
            originalOngoing.some((e) => e.event_id === event.event_id)
          )
        );
        setFilteredPastEvents(
          filteredEvents.filter((event) =>
            originalPast.some((e) => e.event_id === event.event_id)
          )
        );
      }
    } catch (error) {
      console.error("Error filtering events:", error);
    }
  }, [searchTerm, allEvents, originalOngoing, originalPast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const hasEvents =
    filteredOngoingEvents.length > 0 || filteredPastEvents.length > 0;

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.searchContainer}>
        <CustomSearch
          placeholder="Search records"
          onSearch={(text) => setSearchTerm(text)}
        />
      </View>
      <ScrollView
        style={{ flex: 1, width: "100%", marginBottom: 20 }}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredOngoingEvents.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ongoing Events</Text>
            {filteredOngoingEvents.map((event, index) => (
              <TouchableOpacity
                key={`ongoing-${event.event_id}-${index}`}
                style={styles.eventContainer}
                onPress={() =>
                  router.push(
                    `eventManagement/records/BlockList?eventId=${event.event_id}`
                  )
                }
              >
                <Text style={styles.eventTitle}>{event.event_name}</Text>
                <Text style={styles.eventDate}>
                  {formatEventDates(event.event_dates)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {filteredPastEvents.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {filteredPastEvents.map((event, index) => (
              <TouchableOpacity
                key={`past-${event.event_id}-${index}`}
                style={styles.eventContainer}
                onPress={() =>
                  router.push(
                    `eventManagement/records/BlockList?eventId=${event.event_id}`
                  )
                }
              >
                <Text style={styles.eventTitle}>{event.event_name}</Text>
                <Text style={styles.eventDate}>
                  {formatEventDates(event.event_dates)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!hasEvents && (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>
              {searchTerm.trim()
                ? "No records found matching your search."
                : "No events available."}
            </Text>
          </View>
        )}
      </ScrollView>

      <TabsComponent />
    </View>
  );
};

export default Records;

const styles = StyleSheet.create({
  searchContainer: {
    width: "90%",
    marginTop: 30,
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
  scrollview: {
    alignItems: "center",
    flexGrow: 1,
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
  loadingText: {
    fontSize: theme.fontSizes.large,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
  },
});
