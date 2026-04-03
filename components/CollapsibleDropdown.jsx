import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Collapsible from "react-native-collapsible";
import theme from "../constants/theme";
import icons from "../constants/icons";

const CollapsibleDropdown = ({
  title,
  date,
  venue,
  am_in,
  am_out,
  pm_in,
  pm_out,
  personnel,
  description,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        <View style={styles.accentBar} />
        <View style={styles.buttonContent}>
          <View style={styles.buttonText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <Image
            source={isCollapsed ? icons.arrowDown : icons.arrowUp}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      <Collapsible collapsed={isCollapsed}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.contentTitle}>VENUE:</Text>
            <Text style={styles.details}>{venue}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.contentTitle}>DESCRIPTION:</Text>
            <Text style={styles.details}>{description}</Text>
          </View>

          <View style={styles.timeContainer}>
            <View style={styles.contentContainer}>
              <Text style={styles.contentTitle}>TIME IN:</Text>
              <View style={styles.time}>
                <Text style={styles.timeOfDay}>Morning: </Text>
                <Text style={styles.detailsTime}>{am_in}</Text>
              </View>
              <View style={styles.time}>
                <Text style={styles.timeOfDay}>Afternoon: </Text>
                <Text style={styles.detailsTime}>{pm_in}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.contentContainer}>
              <Text style={styles.contentTitle}>TIME OUT:</Text>
              <View style={styles.time}>
                <Text style={styles.timeOfDay}>Morning: </Text>
                <Text style={styles.detailsTime}>{am_out}</Text>
              </View>
              <View style={styles.time}>
                <Text style={styles.timeOfDay}>Afternoon: </Text>
                <Text style={styles.detailsTime}>{pm_out}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.contentTitle}>SCAN PERSONNEL:</Text>
            <Text style={styles.details}>{personnel}</Text>
          </View>
        </View>
      </Collapsible>
    </View>
  );
};

export default CollapsibleDropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.small,
    width: "100%",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.small,
    paddingLeft: theme.spacing.small,
    paddingRight: theme.spacing.medium,
    flexDirection: "row",
    alignItems: "center",
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginRight: theme.spacing.small,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonText: {
    flex: 1,
  },
  chevron: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
    marginLeft: theme.spacing.small,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
  },
  date: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  content: {
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.secondary,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    gap: theme.spacing.medium,
  },
  section: {},
  contentTitle: {
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.xsmall,
  },
  details: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contentContainer: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.primary,
    opacity: 0.5,
    marginHorizontal: theme.spacing.small,
  },
  time: {
    flexDirection: "row",
    marginTop: theme.spacing.xsmall,
    flexWrap: "wrap",
  },
  timeOfDay: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.ArialBold,
  },
  detailsTime: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
  },
});
