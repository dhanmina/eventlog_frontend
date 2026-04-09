import React, { useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CollapsibleDropdown from "../../../../components/CollapsibleDropdown";
import { SafeAreaView } from "react-native-safe-area-context";
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
    [loading, fetchAndStoreEvents]
  );

  useFocusEffect(
    useCallback(() => {
      smartFetch("Focus");
    }, [smartFetch])
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

  return (
    <SafeAreaView style={globalStyles.secondaryContainer}>
      <View>
        <View style={styles.headerContainer}>
          <Text style={styles.textHeader}>EVENTLOG</Text>
          <Text style={styles.title}>LIST OF EVENTS</Text>
          <View style={styles.line}></View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/home/Welcome")}
          style={styles.welcomeWrapper}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME EVENTLOG USERS!</Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          style={{ marginBottom: 20 }}
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
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  textHeader: {
    fontSize: theme.fontSizes.display,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    textAlign: "center",
  },
  title: {
    fontSize: theme.fontSizes.huge,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
    textAlign: "center",
  },
  line: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    width: "100%",
  },
  welcomeContainer: {
    height: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.large,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  welcomeText: {
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    textAlign: "center",
  },
  scrollview: {
    marginTop: 20,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.medium,
    alignItems: "center",
  },
  noEventText: {
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    marginTop: 20,
    paddingHorizontal: theme.spacing.medium,
  },
  headerContainer: {
    marginTop: 20,
    paddingHorizontal: theme.spacing.medium,
  },
  welcomeWrapper: {
    paddingHorizontal: theme.spacing.medium,
  },
});
