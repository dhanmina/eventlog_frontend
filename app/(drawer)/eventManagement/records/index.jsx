import { useState, useEffect, useCallback } from "react";
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
import moment from "moment";
import CustomSearch from "../../../../components/CustomSearch";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import { fetchAllPastEvents, fetchAllOngoingEvents } from "../../../../services/api/records";
import { getRoleID } from "../../../../database/queries";

const Records = () => {
  const [roleId, setRoleId] = useState(null);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatEventDates = useCallback((eventDates) => {
    if (!Array.isArray(eventDates) || eventDates.length === 0) return "No dates available";
    const sortedDates = eventDates.filter((date) => date && date.trim()).sort((a, b) => moment(a).valueOf() - moment(b).valueOf());
    if (sortedDates.length === 0) return "No dates available";
    if (sortedDates.length === 1) return moment(sortedDates[0]).format("MMM DD, YYYY");

    const momentDates = sortedDates.map((date) => moment(date));
    let isConsecutive = true;
    for (let i = 1; i < momentDates.length; i++) {
      if (momentDates[i].diff(momentDates[i - 1], "days") !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive) {
      const start = momentDates[0];
      const end = momentDates[momentDates.length - 1];
      if (start.year() === end.year() && start.month() === end.month()) {
        return `${start.format("MMM DD")}-${end.format("DD, YYYY")}`;
      }
      return `${start.format("MMM DD")} - ${end.format("MMM DD, YYYY")}`;
    }

    return sortedDates.map((date) => moment(date).format("MMM DD, YYYY")).join(", ");
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let ongoing = [];
      let past = [];

      if (roleId === 4) {
        const [ongoingApiResponse, pastApiResponse] = await Promise.all([
          fetchAllOngoingEvents(),
          fetchAllPastEvents(),
        ]);
        ongoing = ongoingApiResponse?.events || [];
        past = pastApiResponse?.events || [];
      }

      const processEvents = (events) =>
        events.map((event) => ({
          event_id: event.event_id,
          event_name: event.event_name,
          event_dates:
            typeof event.event_dates === "string"
              ? event.event_dates.split(",").map((date) => date.trim())
              : Array.isArray(event.event_dates)
              ? event.event_dates
              : [event.event_dates].filter(Boolean),
        }));

      setOngoingEvents(processEvents(ongoing));
      setPastEvents(processEvents(past));
    } catch {}
    setLoading(false);
  }, [roleId]);

  useEffect(() => {
    const loadRole = async () => {
      const id = await getRoleID();
      if (id) setRoleId(id);
    };
    loadRole();
  }, []);

  useEffect(() => {
    if (roleId !== null) fetchData();
  }, [roleId, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredOngoing = ongoingEvents.filter((e) =>
    e.event_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPast = pastEvents.filter((e) =>
    e.event_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasEvents = filteredOngoing.length > 0 || filteredPast.length > 0;

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>EVENT RECORDS</Text>
          <Text style={styles.headerSubtitle}>View past and ongoing events</Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>EVENT RECORDS</Text>
        <Text style={styles.headerSubtitle}>View past and ongoing events</Text>
        {ongoingEvents.length + pastEvents.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{ongoingEvents.length} Ongoing</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{pastEvents.length} Past</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%", marginBottom: theme.spacing.small }}>
        <CustomSearch placeholder="Search records" onSearch={(text) => setSearchTerm(text)} />
      </View>

      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredOngoing.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ongoing Events</Text>
            {filteredOngoing.map((event, index) => (
              <TouchableOpacity
                key={`ongoing-${event.event_id}-${index}`}
                style={styles.card}
                onPress={() => router.push(`eventManagement/records/BlockList?eventId=${event.event_id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{event.event_name}</Text>
                  <Text style={styles.cardSub}>{formatEventDates(event.event_dates)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {filteredPast.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {filteredPast.map((event, index) => (
              <TouchableOpacity
                key={`past-${event.event_id}-${index}`}
                style={styles.card}
                onPress={() => router.push(`eventManagement/records/BlockList?eventId=${event.event_id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, styles.cardLeftPast]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{event.event_name}</Text>
                  <Text style={styles.cardSub}>{formatEventDates(event.event_dates)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!hasEvents && (
          <View style={styles.emptyState}>
            <Image source={icons.calendar} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySub}>
              {searchTerm ? "Try a different search term" : "Event records will appear here"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Records;

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
  scrollview: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
  sectionContainer: {
    width: "100%",
    marginBottom: theme.spacing.medium,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
    paddingHorizontal: theme.spacing.xsmall,
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
  cardLeftPast: {
    opacity: 0.4,
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
