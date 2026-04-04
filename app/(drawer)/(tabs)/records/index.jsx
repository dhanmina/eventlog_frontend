import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useState, useCallback, useMemo, useEffect } from "react";
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

const TABS = ["Ongoing", "Past"];

const Records = () => {
  const { user } = useAuth();
  const { loading: eventsLoading, lastEventUpdate } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("Ongoing");

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

      setOngoingEvents(processEvents(ongoingEventsData));
      setPastEvents(processEvents(pastEventsData));
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
        .map((d) => d.trim())
        .filter(Boolean);
    } else if (Array.isArray(eventDates)) {
      dates = eventDates.filter(Boolean);
    } else {
      dates = [eventDates].filter(Boolean);
    }
    return dates
      .map((date) => {
        const parsed = moment(date);
        return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
      })
      .filter(Boolean);
  };

  useEffect(() => {
    if (user) fetchRecordsData();
  }, [user, fetchRecordsData]);

  useEffect(() => {
    if (lastEventUpdate > 0) {
      setTimeout(() => fetchRecordsData(), 1000);
    }
  }, [lastEventUpdate, fetchRecordsData]);

  const { filteredOngoing, filteredPast } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { filteredOngoing: ongoingEvents, filteredPast: pastEvents };
    }
    const lower = searchTerm.toLowerCase();
    return {
      filteredOngoing: ongoingEvents.filter((e) =>
        e.event_name.toLowerCase().includes(lower),
      ),
      filteredPast: pastEvents.filter((e) =>
        e.event_name.toLowerCase().includes(lower),
      ),
    };
  }, [ongoingEvents, pastEvents, searchTerm]);

  const onRefresh = useCallback(async () => {
    if (loading) return;
    await fetchRecordsData();
  }, [loading, fetchRecordsData]);

  const formatEventDates = useCallback((eventDates) => {
    if (!Array.isArray(eventDates) || eventDates.length === 0) {
      return "No dates";
    }
    const validDates = eventDates
      .map((d) => moment(d))
      .filter((m) => m.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());
    if (validDates.length === 0) return "No dates";
    if (validDates.length === 1) return validDates[0].format("MMM DD, YYYY");

    let consecutive = true;
    for (let i = 1; i < validDates.length; i++) {
      if (validDates[i].diff(validDates[i - 1], "days") !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) {
      const start = validDates[0];
      const end = validDates[validDates.length - 1];
      if (start.year() === end.year() && start.month() === end.month()) {
        return `${start.format("MMM DD")}-${end.format("DD, YYYY")}`;
      }
      return `${start.format("MMM DD")} - ${end.format("MMM DD, YYYY")}`;
    }
    const shown = validDates
      .slice(0, 3)
      .map((d) => d.format("MMM DD, YYYY"))
      .join(", ");
    return validDates.length > 3
      ? `${shown} +${validDates.length - 3} more`
      : shown;
  }, []);

  const handleEventPress = useCallback(
    (eventId) => {
      if (user?.role_id === 1 || user?.role_id === 2) {
        router.push(
          `/records/Attendance?eventId=${eventId}&studentId=${studentId}`,
        );
      } else if (user?.role_id === 3) {
        router.push(`/records/BlockList?eventId=${eventId}`);
      }
    },
    [user?.role_id, studentId],
  );

  const activeList = activeTab === "Ongoing" ? filteredOngoing : filteredPast;
  const totalCount = ongoingEvents.length + pastEvents.length;

  const renderEventCard = (event, index, isOngoing) => (
    <TouchableOpacity
      key={`${event.event_id}-${index}`}
      style={styles.eventCard}
      onPress={() => handleEventPress(event.event_id)}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.eventAccent,
          isOngoing ? styles.eventAccentOngoing : styles.eventAccentPast,
        ]}
      />
      <View style={styles.eventCardContent}>
        {isOngoing && (
          <View style={styles.ongoingBadge}>
            <Text style={styles.ongoingBadgeText}>ONGOING</Text>
          </View>
        )}
        <Text
          style={[styles.eventTitle, !isOngoing && styles.eventTitlePast]}
          numberOfLines={2}
        >
          {event.event_name}
        </Text>
        <View style={styles.datePill}>
          <Text
            style={[styles.datePillText, !isOngoing && styles.datePillTextPast]}
          >
            {formatEventDates(event.event_dates)}
          </Text>
        </View>
      </View>
      <Text style={[styles.chevron, !isOngoing && styles.chevronPast]}>›</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading && ongoingEvents.length === 0 && pastEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading records...</Text>
        </View>
      );
    }
    if (!canViewRecords(user?.role_id)) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Your role does not have permission to view records.
          </Text>
        </View>
      );
    }
    if (activeList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchTerm.trim() ? "No results" : "Nothing here yet"}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchTerm.trim()
              ? "No records match your search."
              : activeTab === "Ongoing"
                ? "No ongoing events with your attendance."
                : "No past event records found."}
          </Text>
        </View>
      );
    }
    return activeList.map((event, index) =>
      renderEventCard(event, index, activeTab === "Ongoing"),
    );
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>MY RECORDS</Text>
            <Text style={styles.headerSub}>Event attendance history</Text>
          </View>
          {totalCount > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ width: "100%" }}>
        <CustomSearch placeholder="Search records" onSearch={setSearchTerm} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const count =
            tab === "Ongoing" ? filteredOngoing.length : filteredPast.length;
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab}
              </Text>
              {count > 0 && (
                <View
                  style={[styles.tabBadge, active && styles.tabBadgeActive]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      active && styles.tabBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={globalStyles.scrollView}
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
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  headerSub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.75,
    marginTop: theme.spacing.xsmall,
  },
  totalBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: theme.borderRadius.large,
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.small,
  },
  totalBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
  tabBar: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "rgba(37,85,134,0.08)",
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xsmall,
    marginTop: theme.spacing.small,
    marginBottom: theme.spacing.small,
    gap: theme.spacing.xsmall,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.xsmall,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  tabLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  tabLabelActive: {
    color: theme.colors.secondary,
    opacity: 1,
  },
  tabBadge: {
    backgroundColor: "rgba(37,85,134,0.12)",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xsmall,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(251,241,229,0.25)",
  },
  tabBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
  },
  tabBadgeTextActive: {
    color: theme.colors.secondary,
  },
  scrollviewContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.small,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.12)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  eventAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  eventAccentOngoing: {
    backgroundColor: theme.colors.primary,
  },
  eventAccentPast: {
    backgroundColor: theme.colors.primary,
    opacity: 0.25,
  },
  eventCardContent: {
    flex: 1,
    paddingVertical: theme.spacing.small + 2,
    paddingHorizontal: theme.spacing.small,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xsmall,
  },
  eventTitlePast: {
    opacity: 0.6,
  },
  ongoingBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.xsmall + 2,
    paddingVertical: 2,
    marginBottom: theme.spacing.xsmall,
  },
  ongoingBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  datePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(37,85,134,0.1)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  datePillText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
  },
  datePillTextPast: {
    opacity: 0.6,
  },
  chevron: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: 28,
    color: theme.colors.primary,
    opacity: 0.35,
    paddingRight: theme.spacing.small,
    lineHeight: 32,
  },
  chevronPast: {
    opacity: 0.18,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.large,
    paddingTop: theme.spacing.xlarge,
  },
  emptyStateTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xsmall,
    textAlign: "center",
  },
  emptyStateText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
    textAlign: "center",
  },
});
