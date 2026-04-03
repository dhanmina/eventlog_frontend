import React, { useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CollapsibleDropdown from "../../../../components/CollapsibleDropdown";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";

const Home = () => {
  const { user } = useAuth();
  const { events, loading, fetchAndStoreEvents, lastEventUpdate } = useEvents();

  const lastFetchRef = useRef(0);

  const canViewEvents = (userRoleId) => [1, 2, 3, 4].includes(userRoleId);

  const smartFetch = useCallback(
    async (reason) => {
      const now = Date.now();
      if (now - lastFetchRef.current < 5000) {
        return;
      }
      lastFetchRef.current = now;
      if (loading) return;
      await fetchAndStoreEvents();
    },
    [loading, fetchAndStoreEvents],
  );

  useFocusEffect(
    useCallback(() => {
      smartFetch("Focus");
    }, [smartFetch]),
  );

  const onRefresh = useCallback(() => {
    smartFetch("Manual refresh");
  }, [smartFetch]);

  useEffect(() => {
    if (lastEventUpdate > 0) {
      smartFetch("EventsContext notification");
    }
  }, [lastEventUpdate, smartFetch]);

  const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== "string" || !timeString.trim())
      return "N/A";
    try {
      const trimmedTime = timeString.trim();
      if (/\b(AM|PM)\b/i.test(trimmedTime)) return trimmedTime.toUpperCase();
      const timeParts = trimmedTime.split(":");
      if (timeParts.length < 2) return "N/A";
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      )
        return "N/A";
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch {
      return "N/A";
    }
  };

  const formatEventDates = (dates) => {
    try {
      const datesArray = Array.isArray(dates)
        ? dates
        : dates?.split(",")
          ? dates.split(",")
          : [];
      if (datesArray.length === 0) return "N/A";
      const parsedDates = datesArray
        .map((dateStr) => new Date(dateStr))
        .filter((d) => !isNaN(d));
      if (parsedDates.length === 0) return "N/A";

      const grouped = parsedDates.reduce((acc, date) => {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(date.getDate());
        acc[key].month = date.toLocaleString("en-US", { month: "long" });
        acc[key].year = date.getFullYear();
        return acc;
      }, {});

      const result = Object.values(grouped)
        .map((group) => {
          const days = group.sort((a, b) => a - b).join(", ");
          return `${group.month} ${days}, ${group.year}`;
        })
        .join(" & ");

      return result;
    } catch {
      return "N/A";
    }
  };

  const formatEventTimes = (event) => ({
    amIn: formatTime(event.am_in),
    amOut: formatTime(event.am_out),
    pmIn: formatTime(event.pm_in),
    pmOut: formatTime(event.pm_out),
  });

  const renderContent = () => {
    if (loading && events.length === 0)
      return <Text style={styles.noEventText}>Loading events...</Text>;
    if (!canViewEvents(user?.role_id))
      return (
        <Text style={styles.noEventText}>
          Your role does not have permission to view events.
        </Text>
      );
    if ((user?.role_id === 1 || user?.role_id === 2) && !user?.block_id)
      return (
        <Text style={styles.noEventText}>
          No block assigned. Please contact your administrator.
        </Text>
      );
    if (events.length > 0)
      return events.map((event, index) => {
        const eventTimes = formatEventTimes(event);
        return (
          <CollapsibleDropdown
            key={event.event_id || index}
            title={event.event_name || "Untitled Event"}
            date={formatEventDates(event.event_dates)}
            venue={event.venue || "No venue specified"}
            am_in={eventTimes.amIn}
            am_out={eventTimes.amOut}
            pm_in={eventTimes.pmIn}
            pm_out={eventTimes.pmOut}
            personnel={event.scan_personnel || "N/A"}
            description={event.description || "N/A"}
          />
        );
      });
    return (
      <Text style={styles.noEventText}>
        No approved upcoming or ongoing events found. Please check back later.
      </Text>
    );
  };

  const firstName = user?.full_name?.split(" ")[0] || "User";
  const roleLabels = { 1: "STUDENT", 2: "OFFICER", 3: "ADMIN", 4: "SUPER ADMIN" };
  const roleLabel = roleLabels[user?.role_id] || "";

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.greetingCard}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextBlock}>
            <Text style={styles.greetingHello}>Hello, {firstName}!</Text>
            <Text style={styles.greetingSubtitle}>Welcome to EVENTLOG</Text>
          </View>
          {roleLabel ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>
        {events.length > 0 && (
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{events.length}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  greetingCard: {
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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingTextBlock: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  greetingHello: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  greetingSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.75,
    marginTop: theme.spacing.xsmall,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.small,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.6,
  },
  eventCountBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xsmall,
  },
  eventCountText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  noEventText: {
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    marginTop: theme.spacing.large,
    paddingHorizontal: theme.spacing.medium,
  },
});
