import { useState, useCallback } from "react";
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
import { fetchEventNames, disableEventName } from "../../../../services/api/events";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function EventNamesScreen() {
  const [eventNames, setEventNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [eventNameToToggle, setEventNameToToggle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEventNames = async (search = "") => {
    try {
      const fetchedEventNames = await fetchEventNames(search, 1, 100);
      setEventNames(Array.isArray(fetchedEventNames) ? fetchedEventNames : []);
    } catch {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadEventNames(searchQuery);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadEventNames(searchQuery); }, []));

  const filteredEventNames = eventNames.filter((e) => {
    const name = e.label?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  const activeCount = eventNames.filter((e) => e.status === "Active").length;
  const disabledCount = eventNames.filter((e) => e.status === "Disabled").length;

  const handleTogglePress = (eventName) => {
    if (!eventName?.label) return;
    setEventNameToToggle(eventName);
    setIsToggleModalVisible(true);
  };

  const handleToggleModalClose = () => {
    setIsToggleModalVisible(false);
    setEventNameToToggle(null);
  };

  const handleConfirmToggle = async () => {
    if (!eventNameToToggle) return;
    const isDisabled = eventNameToToggle.status === "Disabled";
    try {
      if (!isDisabled) {
        await disableEventName(eventNameToToggle.value);
      }
      setEventNames((prev) =>
        prev.map((e) =>
          e.value === eventNameToToggle.value
            ? { ...e, status: isDisabled ? "Active" : "Disabled" }
            : e
        )
      );
      handleToggleModalClose();
      setSuccessMessage(`Event name ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch {}
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={eventNameToToggle?.status === "Disabled" ? "Enable Event Name" : "Disable Event Name"}
        message={`Are you sure you want to ${eventNameToToggle?.status === "Disabled" ? "enable" : "disable"} ${eventNameToToggle?.label}?`}
        type="warning"
        onClose={handleToggleModalClose}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={eventNameToToggle?.status === "Disabled" ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>EVENT NAMES</Text>
        <Text style={styles.headerSubtitle}>Manage event categories</Text>
        {eventNames.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar
          placeholder="Search event names..."
          onSearch={(query) => {
            setSearchQuery(query);
            loadEventNames(query);
          }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredEventNames.length > 0 ? (
          filteredEventNames.map((eventName) => {
            const isDisabled = eventName.status === "Disabled";
            return (
              <TouchableOpacity
                key={eventName.value}
                style={styles.card}
                onPress={() =>
                  router.push(`/eventManagement/eventnames/EventNameDetails?id=${eventName.value}`)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {eventName.label}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {eventName.status}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push(`/eventManagement/eventnames/EditEventName?id=${eventName.value}`)}
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(eventName)}
                  >
                    <Image source={isDisabled ? icons.check : icons.disabled} style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.event} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No event names found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add an event name to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD EVENT NAME"
          onPress={() => router.push("/eventManagement/eventnames/AddEventName")}
        />
      </View>
      <View style={styles.tabSpacer} />
    </View>
  );
}

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
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
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
  cardLeftDisabled: {
    backgroundColor: "rgba(0,0,0,0.15)",
    opacity: 1,
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: theme.spacing.xsmall,
  },
  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
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
  buttonContainer: {
    width: "100%",
    paddingVertical: theme.spacing.small,
  },
  tabSpacer: {
    height: 80,
  },
});
