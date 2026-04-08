import { useCallback, useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useFocusEffect } from "expo-router";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import { useAuth } from "../../../../context/AuthContext";
import { useEvents } from "../../../../context/EventsContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ROLE_LABELS = {
  1: "Student",
  2: "Officer",
  3: "Admin",
  4: "Super Admin",
};

const TimeRange = ({ label, timeIn, timeOut }) => {
  if ((!timeIn || timeIn === "N/A") && (!timeOut || timeOut === "N/A"))
    return null;
  return (
    <View style={styles.timeRange}>
      <Text style={styles.timeRangeLabel}>{label}</Text>
      <Text style={styles.timeRangeValue}>
        {timeIn !== "N/A" ? timeIn : "--"}
        <Text style={styles.timeRangeArrow}> › </Text>
        {timeOut !== "N/A" ? timeOut : "--"}
      </Text>
    </View>
  );
};

const EventCard = ({
  title,
  date,
  venue,
  am_in,
  am_out,
  pm_in,
  pm_out,
  description,
  isToday,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasAm = am_in !== "N/A" || am_out !== "N/A";
  const hasPm = pm_in !== "N/A" || pm_out !== "N/A";

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={toggle}
      activeOpacity={0.82}
    >
      <View style={[styles.eventAccent, isToday && styles.eventAccentToday]} />
      <View style={styles.eventCardContent}>
        <View style={styles.eventCardHeader}>
          <Text
            style={styles.eventTitle}
            numberOfLines={expanded ? undefined : 2}
          >
            {title}
          </Text>
          <View style={styles.eventBadges}>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
            <Image
              source={expanded ? icons.arrowUp : icons.arrowDown}
              style={styles.eventChevron}
            />
          </View>
        </View>

        <View style={styles.eventMetaRow}>
          <Image source={icons.calendar} style={styles.eventMetaIcon} />
          <Text style={styles.eventMetaText} numberOfLines={1}>
            {date}
          </Text>
        </View>

        <View style={styles.eventMetaRow}>
          <Image source={icons.location} style={styles.eventMetaIcon} />
          <Text
            style={styles.eventMetaText}
            numberOfLines={expanded ? undefined : 1}
          >
            {venue}
          </Text>
        </View>

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedDivider} />

            {(hasAm || hasPm) && (
              <View style={styles.scheduleBlock}>
                <Text style={styles.scheduleBlockLabel}>SCHEDULE</Text>
                <TimeRange label="Morning" timeIn={am_in} timeOut={am_out} />
                <TimeRange label="Afternoon" timeIn={pm_in} timeOut={pm_out} />
              </View>
            )}

            {description && description !== "N/A" && (
              <View style={styles.descriptionBlock}>
                <Text style={styles.scheduleBlockLabel}>DESCRIPTION</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const Home = () => {
  const { user } = useAuth();
  const { events, loading, fetchAndStoreEvents, lastEventUpdate } = useEvents();
  const lastFetchRef = useRef(0);

  const canViewEvents = (roleId) => [1, 2, 3, 4].includes(roleId);

  const smartFetch = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;
    await fetchAndStoreEvents();
  }, [fetchAndStoreEvents]);

  useFocusEffect(
    useCallback(() => {
      smartFetch();
    }, [smartFetch]),
  );
  const onRefresh = useCallback(() => {
    smartFetch();
  }, [smartFetch]);
  useEffect(() => {
    if (lastEventUpdate > 0) smartFetch();
  }, [lastEventUpdate, smartFetch]);

  const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== "string" || !timeString.trim())
      return "N/A";
    try {
      const trimmed = timeString.trim();
      if (/\b(AM|PM)\b/i.test(trimmed)) return trimmed.toUpperCase();
      const parts = trimmed.split(":");
      if (parts.length < 2) return "N/A";
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      )
        return "N/A";
      return `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
    } catch {
      return "N/A";
    }
  };

  const formatEventDates = (dates) => {
    try {
      const arr = Array.isArray(dates) ? dates : (dates?.split(",") ?? []);
      if (!arr.length) return "N/A";
      const parsed = arr.map((d) => new Date(d)).filter((d) => !isNaN(d));
      if (!parsed.length) return "N/A";
      const grouped = parsed.reduce((acc, date) => {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(date.getDate());
        acc[key].month = date.toLocaleString("en-US", { month: "long" });
        acc[key].year = date.getFullYear();
        return acc;
      }, {});
      return Object.values(grouped)
        .map(
          (g) => `${g.month} ${g.sort((a, b) => a - b).join(", ")}, ${g.year}`,
        )
        .join(" & ");
    } catch {
      return "N/A";
    }
  };

  const checkIsToday = (dates) => {
    const today = new Date().toDateString();
    const arr = Array.isArray(dates) ? dates : (dates?.split(",") ?? []);
    return arr.some((d) => new Date(d).toDateString() === today);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTodayLabel = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const roleLabel = ROLE_LABELS[user?.role_id] || "";
  const todayEventCount = events.filter((e) =>
    checkIsToday(e.event_dates),
  ).length;

  const renderContent = () => {
    if (loading && events.length === 0)
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading events...</Text>
        </View>
      );
    if (!canViewEvents(user?.role_id))
      return (
        <View style={styles.emptyState}>
          <Image source={icons.event} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Access</Text>
          <Text style={styles.emptySubtitle}>
            Your role does not have permission to view events.
          </Text>
        </View>
      );
    if ((user?.role_id === 1 || user?.role_id === 2) && !user?.block_id)
      return (
        <View style={styles.emptyState}>
          <Image source={icons.blocks} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Block Assigned</Text>
          <Text style={styles.emptySubtitle}>
            Please contact your administrator.
          </Text>
        </View>
      );
    if (events.length > 0)
      return events.map((event, index) => (
        <EventCard
          key={event.event_id || index}
          title={event.event_name || "Untitled Event"}
          date={formatEventDates(event.event_dates)}
          venue={event.venue || "No venue specified"}
          am_in={formatTime(event.am_in)}
          am_out={formatTime(event.am_out)}
          pm_in={formatTime(event.pm_in)}
          pm_out={formatTime(event.pm_out)}
          description={event.description}
          isToday={checkIsToday(event.event_dates)}
        />
      ));
    return (
      <View style={styles.emptyState}>
        <Image source={icons.calendarStar} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Upcoming Events</Text>
        <Text style={styles.emptySubtitle}>
          Pull down to refresh or check back later.
        </Text>
      </View>
    );
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}!
            </Text>
            <Text style={styles.headerDate}>{getTodayLabel()}</Text>
          </View>
          {roleLabel ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          ) : null}
        </View>

        {events.length > 0 && (
          <View style={styles.headerFooter}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{events.length}</Text>
              <Text style={styles.headerStatLabel}>
                {events.length === 1 ? "event" : "events"} coming up
              </Text>
            </View>
            {todayEventCount > 0 && <View style={styles.headerStatDivider} />}
            {todayEventCount > 0 && (
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{todayEventCount}</Text>
                <Text style={styles.headerStatLabel}>
                  {todayEventCount === 1 ? "event" : "events"} today
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
  );
};

export default Home;

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
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextBlock: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  greeting: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  headerDate: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.65,
    marginTop: 3,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
  },
  roleBadgeText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
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

  sectionHeader: {
    width: "100%",
    marginBottom: theme.spacing.small,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
    letterSpacing: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  eventCard: {
    flexDirection: "row",
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
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  eventAccent: {
    width: 4,
    backgroundColor: theme.colors.primary,
    opacity: 0.4,
  },
  eventAccentToday: {
    opacity: 1,
  },
  eventCardContent: {
    flex: 1,
    padding: theme.spacing.medium,
    gap: 6,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.small,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    flex: 1,
  },
  eventBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xsmall,
    flexShrink: 0,
  },
  todayBadge: {
    backgroundColor: theme.colors.green,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: "#fff",
    letterSpacing: 0.5,
  },
  eventChevron: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
    opacity: 0.5,
    marginTop: 4,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eventMetaIcon: {
    width: 12,
    height: 12,
    tintColor: theme.colors.primary,
    opacity: 0.55,
    flexShrink: 0,
  },
  eventMetaText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.75,
    flex: 1,
  },

  expandedSection: {
    gap: theme.spacing.small,
    marginTop: theme.spacing.xsmall,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: "rgba(37,85,134,0.08)",
  },
  scheduleBlock: {
    gap: 6,
  },
  scheduleBlockLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.45,
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeRange: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeRangeLabel: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.75,
    width: 70,
  },
  timeRangeValue: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.9,
  },
  timeRangeArrow: {
    color: theme.colors.primary,
    opacity: 0.4,
  },
  descriptionBlock: {
    gap: 4,
  },
  descriptionText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.75,
    lineHeight: 18,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xlarge,
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
  },
  emptySubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
    paddingHorizontal: theme.spacing.large,
  },
});
