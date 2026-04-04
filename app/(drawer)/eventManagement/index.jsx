import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import { router } from "expo-router";
import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import icons from "../../../constants/icons";

const ITEMS = [
  {
    label: "Event Names",
    desc: "Manage reusable event name templates",
    icon: icons.event,
    route: "/eventManagement/eventnames",
  },
  {
    label: "Events",
    desc: "Create and manage school events",
    icon: icons.calendarStar,
    route: "/eventManagement/events",
  },
  {
    label: "Records",
    desc: "View and export attendance records",
    icon: icons.present,
    route: "/eventManagement/records",
  },
];

const EventManagement = () => (
  <View style={[globalStyles.secondaryContainer, styles.root]}>
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>EVENT MANAGEMENT</Text>
      <Text style={styles.headerSubtitle}>Manage events and attendance records</Text>
    </View>

    <View style={styles.optionsWrapper}>
      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.optionCard}
          onPress={() => router.push(item.route)}
          activeOpacity={0.85}
        >
          <View style={styles.optionIconWrap}>
            <Image source={item.icon} style={styles.optionIcon} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{item.label}</Text>
            <Text style={styles.optionDesc}>{item.desc}</Text>
          </View>
          <Image source={icons.arrowRight} style={styles.chevron} />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default EventManagement;

const styles = StyleSheet.create({
  root: {
    justifyContent: "flex-start",
    paddingTop: theme.spacing.medium,
    paddingBottom: 80,
  },
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
  optionsWrapper: {
    width: "100%",
    gap: theme.spacing.small,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.12)",
    padding: theme.spacing.medium,
    gap: theme.spacing.medium,
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
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "rgba(37,85,134,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionIcon: {
    width: 22,
    height: 22,
    tintColor: theme.colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  optionDesc: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  chevron: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    opacity: 0.3,
    flexShrink: 0,
  },
});
