import { StyleSheet, View, Image, Text } from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import CustomDropdown from "../../../../components/CustomDropdown";
import { getStoredUser } from "../../../../database/queries";
import CryptoES from "crypto-es";
import { QR_SECRET_KEY } from "../../../../config/config";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import images from "../../../../constants/images";

const Generate = () => {
  const { user: authUser } = useAuth();
  const { events, fetchAndStoreEvents, lastEventUpdate } = useEvents();
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const prevEventsLength = useRef(events.length);
  const lastFetchRef = useRef(0);

  const fetchUserData = async () => {
    const userData = await getStoredUser();
    setUser(userData);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const currentLength = events.length;
    if (selectedEvent && currentLength !== prevEventsLength.current) {
      const isSelectedEventStillValid = events.some(
        (event) => event.event_id === selectedEvent.event_id
      );
      if (!isSelectedEventStillValid) setSelectedEvent(null);
    }
    prevEventsLength.current = currentLength;
  }, [events, selectedEvent]);

  const smartFetch = useCallback(
    (reason) => {
      const now = Date.now();
      if (now - lastFetchRef.current < 3000) return;
      lastFetchRef.current = now;
      fetchAndStoreEvents();
    },
    [fetchAndStoreEvents]
  );

  useEffect(() => {
    smartFetch("Mount");
  }, [smartFetch]);

  useFocusEffect(useCallback(() => smartFetch("Focus"), [smartFetch]));

  useEffect(() => {
    if (lastEventUpdate > 0) smartFetch("EventsContext notification");
  }, [lastEventUpdate, smartFetch]);

  const handleEventSelect = (event) => setSelectedEvent(event);

  const encryptQRValue = (value) => {
    if (!value) return null;
    return CryptoES.AES.encrypt(value, QR_SECRET_KEY).toString();
  };

  const getEventDateId = (event) => {
    if (
      !event ||
      !Array.isArray(event.event_dates) ||
      !Array.isArray(event.event_date_ids)
    )
      return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < event.event_dates.length; i++) {
      const eventDate = new Date(event.event_dates[i]);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate.getTime() === today.getTime())
        return event.event_date_ids[i];
    }

    return event.event_date_ids[0];
  };

  const generateQRValue = () => {
    if (!selectedEvent || !user) return "INVALID";
    const eventDateId = getEventDateId(selectedEvent);
    const rawValue = `eventlog-${eventDateId}-${user?.id_number}`;
    return encryptQRValue(rawValue) || "INVALID";
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.qrCodeContainer}>
        {selectedEvent && user && (
          <QRCode
            value={generateQRValue()}
            backgroundColor={theme.colors.secondary}
            size={200}
          />
        )}
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoBackground,
              !selectedEvent && styles.logoBackgroundNoEvent,
            ]}
          >
            <Image
              source={images.logo}
              style={!selectedEvent ? styles.logoLarger : styles.logo}
            />
          </View>
        </View>
      </View>

      <View style={styles.dropdownContainer}>
        <CustomDropdown
          key={`dropdown-${events.length}-${events
            .map((e) => e.event_id)
            .join("-")}`}
          display="sharp"
          fontFamily={theme.fontFamily.SquadaOne}
          placeholder="SELECT EVENT"
          placeholderFontSize={theme.fontSizes.large}
          placeholderColor={theme.colors.primary}
          selectedEventColor={theme.colors.primary}
          selectedEventFont={theme.fontFamily.SquadaOne}
          selectedEventFontSize={theme.fontSizes.large}
          data={events.map((event) => ({
            label: event.event_name,
            value: event.event_id,
          }))}
          value={selectedEvent?.event_id || null}
          onSelect={(selectedItem) => {
            if (!selectedItem || selectedItem.value === selectedEvent?.event_id)
              handleEventSelect(null);
            else
              handleEventSelect(
                events.find((event) => event.event_id === selectedItem.value)
              );
          }}
        />
      </View>

      {user && (
        <View style={styles.userDetailsContainer}>
          <Text style={styles.userDetails}>
            {`${user.first_name} ${
              user.middle_name ? user.middle_name + " " : ""
            }${user.last_name}${user.suffix ? ` ${user.suffix}` : ""}`}
          </Text>
          <Text style={styles.userDetails}>ID: {user.id_number}</Text>
          <Text style={styles.userDetails}>Course: {user.course_code}</Text>
          <Text style={styles.userDetails}>Block: {user.block_name}</Text>
        </View>
      )}

      <View style={styles.noteContainer}>
        <Text style={styles.note}>
          NOTE: The instructors or officers in-charged will scan your QR Code.
          Approach them immediately.
        </Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
};

export default Generate;

const styles = StyleSheet.create({
  qrCodeContainer: {
    position: "relative",
    width: 220,
    height: 220,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  logoBackground: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 50,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  logo: { width: 50, height: 50, resizeMode: "contain" },
  logoBackgroundNoEvent: { backgroundColor: theme.colors.primary, padding: 4 },
  logoLarger: { width: 90, height: 90, resizeMode: "contain" },
  dropdownContainer: { width: "80%", marginTop: theme.spacing.large },
  userDetails: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
    padding: theme.spacing.xsmall,
  },
  userDetailsContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    width: "80%",
    padding: theme.spacing.small,
    borderColor: theme.colors.primary,
  },
  noteContainer: {
    width: "80%",
    marginTop: theme.spacing.large,
    padding: theme.spacing.small,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  note: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
  },
});
