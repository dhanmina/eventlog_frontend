import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { getStoredUser } from "../../../../database/queries";
import CryptoES from "crypto-es";
import { QR_SECRET_KEY } from "../../../../config/config";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import images from "../../../../constants/images";
import icons from "../../../../constants/icons";

const Generate = () => {
  const { user: authUser } = useAuth();
  const { events, fetchAndStoreEvents, lastEventUpdate } = useEvents();
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [itemWidth, setItemWidth] = useState(0);
  const lastFetchRef = useRef(0);
  const flatListRef = useRef(null);

  const fetchUserData = async () => {
    const userData = await getStoredUser();
    setUser(userData);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setGenerated(false);
  }, [currentIndex]);

  useEffect(() => {
    if (events.length === 0) {
      setCurrentIndex(0);
      setGenerated(false);
    } else if (currentIndex >= events.length) {
      setCurrentIndex(events.length - 1);
      setGenerated(false);
    }
  }, [events]);

  const smartFetch = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;
    fetchAndStoreEvents();
  }, [fetchAndStoreEvents]);

  useEffect(() => {
    smartFetch();
  }, [smartFetch]);
  useFocusEffect(useCallback(() => smartFetch(), [smartFetch]));
  useEffect(() => {
    if (lastEventUpdate > 0) smartFetch();
  }, [lastEventUpdate, smartFetch]);

  const currentEvent = events[currentIndex] || null;

  const scrollTo = (index) => {
    if (flatListRef.current && itemWidth > 0) {
      flatListRef.current.scrollToOffset({
        offset: index * itemWidth,
        animated: true,
      });
    }
  };

  const prevEvent = () => {
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      setCurrentIndex(next);
      scrollTo(next);
    }
  };

  const nextEvent = () => {
    if (currentIndex < events.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollTo(next);
    }
  };

  const handleScrollEnd = (e) => {
    if (itemWidth > 0) {
      const index = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
      setCurrentIndex(index);
    }
  };

  const handleGenerate = () => {
    if (currentEvent && user) setGenerated(true);
  };

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
    if (!currentEvent || !user) return "INVALID";
    const eventDateId = getEventDateId(currentEvent);
    const rawValue = `eventlog-${eventDateId}-${user?.id_number}`;
    return encryptQRValue(rawValue) || "INVALID";
  };

  const fullName = user
    ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ""} ${user.last_name}${user.suffix ? ` ${user.suffix}` : ""}`
    : "";

  const roleLabels = {
    1: "STUDENT",
    2: "OFFICER",
    3: "ADMIN",
    4: "SUPER ADMIN",
  };
  const roleLabel = roleLabels[authUser?.role_id] || "";

  const canGenerate = !!currentEvent && !!user;

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderTop}>
            <Text style={styles.ticketBrand}>EVENTLOG</Text>
            {roleLabel ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.carousel}>
            <TouchableOpacity
              onPress={prevEvent}
              disabled={currentIndex === 0 || events.length === 0}
              style={styles.carouselArrowBtn}
            >
              <Image
                source={icons.arrowLeft}
                style={[
                  styles.carouselArrow,
                  (currentIndex === 0 || events.length === 0) &&
                    styles.arrowDisabled,
                ]}
              />
            </TouchableOpacity>

            <View
              style={styles.carouselTrack}
              onLayout={(e) => setItemWidth(e.nativeEvent.layout.width)}
            >
              {itemWidth > 0 && (
                <FlatList
                  ref={flatListRef}
                  data={
                    events.length > 0
                      ? events
                      : [
                          {
                            event_id: "empty",
                            event_name: "No events available",
                          },
                        ]
                  }
                  horizontal
                  pagingEnabled
                  scrollEnabled={events.length > 1}
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  onMomentumScrollEnd={handleScrollEnd}
                  getItemLayout={(_, index) => ({
                    length: itemWidth,
                    offset: itemWidth * index,
                    index,
                  })}
                  keyExtractor={(item) => String(item.event_id)}
                  renderItem={({ item }) => (
                    <View style={[styles.carouselItem, { width: itemWidth }]}>
                      <Text style={styles.ticketEventName} numberOfLines={2}>
                        {item.event_name}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={nextEvent}
              disabled={
                currentIndex === events.length - 1 || events.length === 0
              }
              style={styles.carouselArrowBtn}
            >
              <Image
                source={icons.arrowRight}
                style={[
                  styles.carouselArrow,
                  (currentIndex === events.length - 1 || events.length === 0) &&
                    styles.arrowDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>

          {events.length > 1 && (
            <Text style={styles.eventCounter}>
              {currentIndex + 1} of {events.length}
            </Text>
          )}

          {user ? <Text style={styles.ticketUserName}>{fullName}</Text> : null}
        </View>

        <View style={styles.ticketTear}>
          <View style={styles.tearCircleLeft} />
          <View style={styles.tearLine} />
          <View style={styles.tearCircleRight} />
        </View>

        <View style={styles.ticketBody}>
          {generated && currentEvent && user ? (
            <TouchableOpacity
              onPress={() => setGenerated(false)}
              activeOpacity={0.9}
            >
              <View style={styles.qrFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <QRCode
                  value={generateQRValue()}
                  backgroundColor={theme.colors.secondary}
                  color={theme.colors.primary}
                  size={190}
                />
                <View style={styles.logoOverlay}>
                  <View style={styles.logoBackground}>
                    <Image source={images.logo} style={styles.logo} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.qrFrame, !canGenerate && styles.qrFrameDisabled]}
              onPress={handleGenerate}
              disabled={!canGenerate}
              activeOpacity={0.7}
            >
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <View style={styles.logoOverlay}>
                <View style={styles.logoBackground}>
                  <Image source={images.logo} style={styles.logoLarge} />
                </View>
              </View>
              <Text style={styles.placeholderText}>
                {canGenerate ? "TAP TO GENERATE" : "NO EVENTS AVAILABLE"}
              </Text>
            </TouchableOpacity>
          )}

          {user ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{user.id_number}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{user.course_code}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{user.block_name}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.note}>
        Approach the officer in-charge to have your QR code scanned.
      </Text>

      <StatusBar style="light" />
    </View>
  );
};

export default Generate;

const styles = StyleSheet.create({
  ticketCard: {
    width: "100%",
    borderRadius: theme.borderRadius.large,
    marginBottom: theme.spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  ticketHeader: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
  },
  ticketHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  ticketBrand: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.6,
    letterSpacing: 2,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  carousel: {
    flexDirection: "row",
    alignItems: "center",
  },
  carouselArrowBtn: {
    padding: theme.spacing.xsmall,
  },
  carouselArrow: {
    width: 20,
    height: 20,
    tintColor: theme.colors.secondary,
  },
  arrowDisabled: {
    opacity: 0.25,
  },
  carouselTrack: {
    flex: 1,
    overflow: "hidden",
  },
  carouselItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xsmall,
  },
  ticketEventName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  eventCounter: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.5,
    textAlign: "center",
    marginTop: theme.spacing.xsmall,
  },
  ticketUserName: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.75,
    marginTop: theme.spacing.xsmall,
  },
  ticketTear: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
  },
  tearCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.secondary,
    marginLeft: -10,
  },
  tearCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.secondary,
    marginRight: -10,
  },
  tearLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderStyle: "dashed",
    marginHorizontal: theme.spacing.small,
  },
  ticketBody: {
    backgroundColor: theme.colors.secondary,
    borderBottomLeftRadius: theme.borderRadius.large,
    borderBottomRightRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    alignItems: "center",
    gap: theme.spacing.medium,
  },
  qrFrame: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrameDisabled: {
    opacity: 0.3,
  },
  corner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: theme.colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  logoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBackground: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 999,
    padding: 4,
  },
  logo: { width: 44, height: 44, resizeMode: "contain" },
  logoLarge: { width: 80, height: 80, resizeMode: "contain" },
  placeholderText: {
    position: "absolute",
    bottom: theme.spacing.medium,
    left: 0,
    right: 0,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    textAlign: "center",
    opacity: 0.6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.4,
  },
  metaText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },
  note: {
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: theme.spacing.medium,
  },
});
