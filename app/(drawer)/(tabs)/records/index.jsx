import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Image,
} from "react-native";
import { useState, useCallback, useMemo, useEffect } from "react";
import moment from "moment";
import CustomSearch from "../../../../components/CustomSearch";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import { router } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";
import { getStoredUser } from "../../../../database/queries";
import {
  fetchUserOngoingEvents,
  fetchUserPastEvents,
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

  const canViewRecords = (roleId) => [1, 2].includes(roleId);

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

      const storedUser = await getStoredUser();
      if (!storedUser?.id_number) return;
      setStudentId(storedUser.id_number);
      const [ongoingRes, pastRes] = await Promise.all([
        fetchUserOngoingEvents(storedUser.id_number),
        fetchUserPastEvents(storedUser.id_number),
      ]);
      ongoingEventsData = ongoingRes?.events || [];
      pastEventsData = pastRes?.events || [];

      const processEvents = (events) =>
        events.map((event) => ({
          event_id: event.event_id,
          event_name: event.event_name,
          event_dates: processEventDates(event.event_dates),
        }));

      setOngoingEvents(processEvents(ongoingEventsData));
      setPastEvents(processEvents(pastEventsData));
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.role_id]);

  const processEventDates = (eventDates) => {
    if (!eventDates) return [];
    let dates = [];
    if (typeof eventDates === "string") {
      dates = eventDates.split(",").map((d) => d.trim()).filter(Boolean);
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
    if (lastEventUpdate > 0) setTimeout(() => fetchRecordsData(), 1000);
  }, [lastEventUpdate, fetchRecordsData]);

  const { filteredOngoing, filteredPast } = useMemo(() => {
    if (!searchTerm.trim()) return { filteredOngoing: ongoingEvents, filteredPast: pastEvents };
    const lower = searchTerm.toLowerCase();
    return {
      filteredOngoing: ongoingEvents.filter((e) => e.event_name.toLowerCase().includes(lower)),
      filteredPast: pastEvents.filter((e) => e.event_name.toLowerCase().includes(lower)),
    };
  }, [ongoingEvents, pastEvents, searchTerm]);

  const onRefresh = useCallback(async () => {
    if (loading) return;
    await fetchRecordsData();
  }, [loading, fetchRecordsData]);

  const formatEventDates = useCallback((eventDates) => {
    if (!Array.isArray(eventDates) || eventDates.length === 0) return "No dates";
    const validDates = eventDates
      .map((d) => moment(d))
      .filter((m) => m.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());
    if (validDates.length === 0) return "No dates";
    if (validDates.length === 1) return validDates[0].format("MMM DD, YYYY");

    let consecutive = true;
    for (let i = 1; i < validDates.length; i++) {
      if (validDates[i].diff(validDates[i - 1], "days") !== 1) { consecutive = false; break; }
    }
    if (consecutive) {
      const start = validDates[0];
      const end = validDates[validDates.length - 1];
      if (start.year() === end.year() && start.month() === end.month()) {
        return `${start.format("MMM DD")}-${end.format("DD, YYYY")}`;
      }
      return `${start.format("MMM DD")} - ${end.format("MMM DD, YYYY")}`;
    }
    const shown = validDates.slice(0, 3).map((d) => d.format("MMM DD, YYYY")).join(", ");
    return validDates.length > 3 ? `${shown} +${validDates.length - 3} more` : shown;
  }, []);

  const handleEventPress = useCallback((eventId) => {
    router.push(`/records/Attendance?eventId=${eventId}&studentId=${studentId}`);
  }, [studentId]);

  const activeList = activeTab === "Ongoing" ? filteredOngoing : filteredPast;
  const totalCount = ongoingEvents.length + pastEvents.length;
  const isOngoingTab = activeTab === "Ongoing";

  const renderEventCard = (event, index) => (
    <TouchableOpacity
      key={`${event.event_id}-${index}`}
      style={styles.eventCard}
      onPress={() => handleEventPress(event.event_id)}
      activeOpacity={0.78}
    >
      <View style={[styles.eventAccent, !isOngoingTab && styles.eventAccentPast]} />
      <View style={styles.eventCardContent}>
        <View style={styles.eventCardTop}>
          <View style={styles.eventCardLeft}>
            {isOngoingTab && (
              <View style={styles.ongoingBadge}>
                <Text style={styles.ongoingBadgeText}>ONGOING</Text>
              </View>
            )}
            <Text style={[styles.eventTitle, !isOngoingTab && styles.eventTitlePast]} numberOfLines={2}>
              {event.event_name}
            </Text>
          </View>
          <Image source={icons.arrowRight} style={[styles.chevronIcon, !isOngoingTab && styles.chevronIconPast]} />
        </View>
        <View style={styles.datePill}>
          <Image source={icons.calendar} style={styles.datePillIcon} />
          <Text style={[styles.datePillText, !isOngoingTab && styles.datePillTextPast]}>
            {formatEventDates(event.event_dates)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading && ongoingEvents.length === 0 && pastEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading records...</Text>
        </View>
      );
    }
    if (!canViewRecords(user?.role_id)) {
      return (
        <View style={styles.emptyState}>
          <Image source={icons.disabled} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Access</Text>
          <Text style={styles.emptySubtitle}>Your role does not have permission to view records.</Text>
        </View>
      );
    }
    if (activeList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Image
            source={searchTerm.trim() ? icons.search : icons.calendarStar}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>
            {searchTerm.trim() ? "No results" : "Nothing here yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchTerm.trim()
              ? "No records match your search."
              : isOngoingTab
                ? "No ongoing events with your attendance."
                : "No past event records found."}
          </Text>
        </View>
      );
    }
    return activeList.map((event, index) => renderEventCard(event, index));
  };

  return (
    <View style={globalStyles.secondaryContainer}>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
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
        {totalCount > 0 && (
          <View style={styles.headerFooter}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{ongoingEvents.length}</Text>
              <Text style={styles.headerStatLabel}>ongoing</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{pastEvents.length}</Text>
              <Text style={styles.headerStatLabel}>past</Text>
            </View>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={{ width: "100%" }}>
        <CustomSearch placeholder="Search records" onSearch={setSearchTerm} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const count = tab === "Ongoing" ? filteredOngoing.length : filteredPast.length;
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
  // Header
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
  headerTop: {
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
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.65,
    marginTop: 3,
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
  headerFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.medium,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
    gap: theme.spacing.medium,
  },
  headerStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  headerStatValue: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  headerStatLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  headerStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(251,241,229,0.25)",
  },

  // Tabs
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

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  // Event cards
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.small,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  eventAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
  },
  eventAccentPast: {
    opacity: 0.25,
  },
  eventCardContent: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
    gap: theme.spacing.xsmall,
  },
  eventCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.small,
  },
  eventCardLeft: {
    flex: 1,
    gap: 4,
  },
  ongoingBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  ongoingBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  eventTitlePast: {
    opacity: 0.55,
  },
  chevronIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
    opacity: 0.4,
    marginTop: 4,
    flexShrink: 0,
  },
  chevronIconPast: {
    opacity: 0.2,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(37,85,134,0.08)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 3,
    gap: 4,
  },
  datePillIcon: {
    width: 11,
    height: 11,
    tintColor: theme.colors.primary,
    opacity: 0.6,
  },
  datePillText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.85,
  },
  datePillTextPast: {
    opacity: 0.5,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.large,
    paddingTop: theme.spacing.xlarge,
    gap: theme.spacing.small,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    tintColor: theme.colors.primary,
    opacity: 0.2,
    marginBottom: theme.spacing.xsmall,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    opacity: 0.5,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
  },
});
