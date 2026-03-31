import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";

import theme from "../../constants/theme";
import globalStyles from "../../constants/globalStyles";
import WebHeader from "../../components/WebHeader";
import CustomSearch from "../../components/CustomSearch";
import icons from "../../constants/icons";
import { router } from "expo-router";
import {
  fetchAllPastEvents,
  fetchAllOngoingEvents,
} from "../../services/api/records";
import moment from "moment";

import ArialFont from "../../assets/fonts/Arial.ttf";
import ArialBoldFont from "../../assets/fonts/ArialBold.ttf";
import ArialItalicFont from "../../assets/fonts/ArialItalic.ttf";
import SquadaOneFont from "../../assets/fonts/SquadaOne.ttf";

const Web = () => {
  const [fontsLoaded, fontError] = useFonts({
    Arial: require("../../assets/fonts/Arial.ttf"),
    ArialBold: require("../../assets/fonts/ArialBold.ttf"),
    ArialItalic: require("../../assets/fonts/ArialItalic.ttf"),
    SquadaOne: require("../../assets/fonts/SquadaOne.ttf"),
  });

  const [fontsReady, setFontsReady] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [filteredOngoingEvents, setFilteredOngoingEvents] = useState([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [originalOngoing, setOriginalOngoing] = useState([]);
  const [originalPast, setOriginalPast] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: 'Arial';
          src: url('${ArialFont}') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'ArialBold';
          src: url('${ArialBoldFont}') format('truetype');
          font-display: swap;
          font-weight: bold;
        }
        @font-face {
          font-family: 'ArialItalic';
          src: url('${ArialItalicFont}') format('truetype');
          font-display: swap;
          font-style: italic;
        }
        @font-face {
          font-family: 'SquadaOne';
          src: url('${SquadaOneFont}') format('truetype');
          font-display: swap;
        }
      `;

      const existingStyle = document.getElementById("web-custom-fonts");
      if (!existingStyle) {
        style.id = "web-custom-fonts";
        document.head.appendChild(style);
      }

      if (document.fonts) {
        Promise.all([
          document.fonts.load("16px Arial"),
          document.fonts.load("16px ArialBold"),
          document.fonts.load("16px ArialItalic"),
          document.fonts.load("16px SquadaOne"),
        ])
          .then(() => {
            setFontsReady(true);
          })
          .catch((error) => {
            setFontsReady(true);
          });
      } else {
        setTimeout(() => {
          setFontsReady(true);
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" && fontsLoaded && !fontError) {
      setFontsReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const ongoingApiResponse = await fetchAllOngoingEvents();
        const pastApiResponse = await fetchAllPastEvents();
        const ongoingEvents = ongoingApiResponse?.events || [];
        const pastEvents = pastApiResponse?.events || [];

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

        const allEvents = Object.values(groupedEvents);
        const ongoingList = Object.values(groupedEvents).filter((event) =>
          ongoingEvents.some((e) => e.event_id === event.event_id)
        );
        const pastList = Object.values(groupedEvents).filter((event) =>
          pastEvents.some((e) => e.event_id === event.event_id)
        );

        setAllEvents(allEvents);
        setOriginalOngoing(ongoingList);
        setOriginalPast(pastList);
        setFilteredOngoingEvents(ongoingList);
        setFilteredPastEvents(pastList);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (fontsReady) {
      fetchData();
    }
  }, [fontsReady]);

  useEffect(() => {
    try {
      if (!searchTerm.trim()) {
        setFilteredOngoingEvents(originalOngoing);
        setFilteredPastEvents(originalPast);
      } else {
        const searchLower = searchTerm.toLowerCase();

        const filteredOngoing = originalOngoing.filter((event) =>
          event.event_name.toLowerCase().includes(searchLower)
        );

        const filteredPast = originalPast.filter((event) =>
          event.event_name.toLowerCase().includes(searchLower)
        );

        setFilteredOngoingEvents(filteredOngoing);
        setFilteredPastEvents(filteredPast);
      }
    } catch (error) {
      setFilteredOngoingEvents(originalOngoing);
      setFilteredPastEvents(originalPast);
    }
  }, [searchTerm, originalOngoing, originalPast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const ongoingApiResponse = await fetchAllOngoingEvents();
      const pastApiResponse = await fetchAllPastEvents();
      const ongoingEvents = ongoingApiResponse?.events || [];
      const pastEvents = pastApiResponse?.events || [];

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

      const allEvents = Object.values(groupedEvents);
      const ongoingList = Object.values(groupedEvents).filter((event) =>
        ongoingEvents.some((e) => e.event_id === event.event_id)
      );
      const pastList = Object.values(groupedEvents).filter((event) =>
        pastEvents.some((e) => e.event_id === event.event_id)
      );

      setAllEvents(allEvents);
      setOriginalOngoing(ongoingList);
      setOriginalPast(pastList);
      setFilteredOngoingEvents(ongoingList);
      setFilteredPastEvents(pastList);

      setSearchTerm("");
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEventPress = (eventId) => {
    router.push({
      pathname: "web/Records",
      params: {
        eventId: eventId,
      },
    });
  };

  if (!fontsReady || loading) {
    return (
      <View
        style={[
          globalStyles.secondaryContainer,
          { padding: 0, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={{
            fontFamily:
              Platform.OS === "web" ? "system-ui, sans-serif" : "system",
            fontSize: 18,
            color: theme.colors.primary,
            marginBottom: 10,
          }}
        >
          {!fontsReady ? "Loading..." : "Loading events..."}
        </Text>
        {Platform.OS === "web" && !fontsReady && (
          <Text
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 14,
              color: "#666",
              textAlign: "center",
            }}
          >
            Preparing fonts for web interface
          </Text>
        )}
      </View>
    );
  }

  const hasEvents =
    filteredOngoingEvents.length > 0 || filteredPastEvents.length > 0;

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { padding: 0, justifyContent: "flex-start" },
      ]}
    >
      <WebHeader title="ATTENDANCE RECORD" />
      <View style={styles.searchContainer}>
        <CustomSearch
          placeholder="Search records"
          onSearch={(text) => setSearchTerm(text)}
        />
      </View>

      <View style={styles.scrollViewContainer}>
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {filteredOngoingEvents.length > 0 && (
            <>
              <Text style={[styles.title, { marginTop: theme.spacing.large }]}>
                ONGOING EVENTS
              </Text>
              <View style={styles.eventWrapper}>
                {filteredOngoingEvents.map((event, index) => (
                  <TouchableOpacity
                    key={`ongoing-${event.event_id}-${index}`}
                    style={styles.eventContainer}
                    onPress={() => handleEventPress(event.event_id)}
                  >
                    <Image source={icons.calendar} style={styles.icon} />
                    <View style={styles.eventTextContainer}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.event_name}
                      </Text>
                      <Text style={styles.dateTitle} numberOfLines={1}>
                        {Array.isArray(event.event_dates) &&
                        event.event_dates.length > 0
                          ? event.event_dates
                              .map((date) =>
                                moment(date).format("MMM DD, YYYY")
                              )
                              .join(", ")
                          : "No dates available"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {filteredPastEvents.length > 0 && (
            <>
              <Text style={[styles.title, { marginTop: theme.spacing.xlarge }]}>
                PAST EVENTS
              </Text>
              <View style={styles.eventWrapper}>
                {filteredPastEvents.map((event, index) => (
                  <TouchableOpacity
                    key={`past-${event.event_id}-${index}`}
                    style={styles.eventContainer}
                    onPress={() => handleEventPress(event.event_id)}
                  >
                    <Image source={icons.calendar} style={styles.icon} />
                    <View style={styles.eventTextContainer}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.event_name}
                      </Text>
                      <Text style={styles.dateTitle} numberOfLines={1}>
                        {Array.isArray(event.event_dates) &&
                        event.event_dates.length > 0
                          ? event.event_dates
                              .map((date) =>
                                moment(date).format("MMM DD, YYYY")
                              )
                              .join(", ")
                          : "No dates available"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {!hasEvents && (
            <View style={styles.noEventsContainer}>
              <Text style={styles.noEventsText}>
                {searchTerm.trim()
                  ? `No events found for "${searchTerm}"`
                  : "No events available."}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default Web;

const styles = StyleSheet.create({
  searchContainer: {
    width: "90%",
    paddingTop: 40,
  },
  scrollViewContainer: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollViewStyle: {
    width: "100%",
  },
  title: {
    fontSize: theme.fontSizes.display,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    textAlign: "center",
    width: "100%",
  },
  eventContainer: {
    borderWidth: 2,
    width: "45%",
    minHeight: 60,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    marginHorizontal: "2.5%",
  },
  icon: {
    height: 32,
    width: 32,
    tintColor: theme.colors.primary,
    marginRight: theme.spacing.small,
  },
  eventTextContainer: {
    flex: 1,
    paddingLeft: theme.spacing.small,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontWeight: "bold",
  },
  eventWrapper: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  scrollView: {
    alignItems: "center",
    width: "100%",
    paddingBottom: theme.spacing.xlarge,
  },
  dateTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    marginTop: 2,
  },
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xlarge,
  },
  noEventsText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
});
