import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import images from "../../../../constants/images";

import CustomSearch from "../../../../components/CustomSearch";
import { fetchEvents } from "../../../../services/api";

const getEventList = (response) => response.data || response.events || [];

const formatDates = (dates) => {
  if (!dates || dates.length === 0) return "No date";

  const parsedDates = dates.map((date) => new Date(date));
  parsedDates.sort((a, b) => a - b);

  const formattedDates = [];
  let currentYear = "";
  let currentMonth = "";
  let daysInMonth = [];

  parsedDates.forEach((date, index) => {
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
      date
    );
    const day = date.getDate();
    const year = date.getFullYear();

    if (year !== currentYear) {
      if (daysInMonth.length > 0) {
        formattedDates.push(
          `${currentMonth} ${daysInMonth.join(", ")} ${currentYear}`
        );
        daysInMonth = [];
      }
      currentYear = year;
      currentMonth = month;
    }

    if (month !== currentMonth) {
      if (daysInMonth.length > 0) {
        formattedDates.push(
          `${currentMonth} ${daysInMonth.join(", ")} ${currentYear}`
        );
      }
      currentMonth = month;
      daysInMonth = [];
    }

    daysInMonth.push(day);

    if (index === parsedDates.length - 1) {
      formattedDates.push(
        `${currentMonth} ${daysInMonth.join(", ")} ${currentYear}`
      );
    }
  });

  return formattedDates.join(", ");
};

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchEventsData = async () => {
      setLoading(true);
      try {
        const res = await fetchEvents({ search: searchQuery });
        if (res.success) {
          setEvents(getEventList(res));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsData();
  }, [searchQuery]);

  const handleEventPress = (eventId) => {
    router.replace(`/account/EditEvent?id=${eventId}`);
  };

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={globalStyles.secondaryContainer}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerContainer}>
            <Text style={styles.textHeader}>EVENTLOG</Text>
            <Text style={styles.title}>LIST OF EVENTS</Text>
            <View style={styles.line}></View>
            <CustomSearch onSearch={setSearchQuery} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventContainer}
                onPress={() => handleEventPress(event.id)}
              >
                <View>
                  <Text style={styles.eventTitle}>{event.name}</Text>
                  <Text style={styles.eventDate}>
                    {formatDates(event.dates)}
                  </Text>
                </View>
                <Image source={images.arrowRight} style={styles.icon} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events found.</Text>
          )}
        </ScrollView>

        <StatusBar style="light" />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default EventsList;

const styles = StyleSheet.create({
  textHeader: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.display,
  },
  title: {
    fontSize: theme.fontSizes.huge,
    fontFamily: "SquadaOne",
    color: theme.colors.primary,
  },
  line: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    width: "100%",
    height: 2,
    marginBottom: theme.spacing.medium,
  },
  headerContainer: {
    alignItems: "center",
    paddingLeft: theme.spacing.large,
    paddingRight: theme.spacing.large,
    width: "100%",
  },
  headerWrapper: {
    width: "100%",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    padding: theme.spacing.large,
    alignItems: "center",
    width: "100%",
  },
  eventContainer: {
    height: 60,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
  },
  eventDate: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.primary,
  },
  noEventsText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
  },
});
