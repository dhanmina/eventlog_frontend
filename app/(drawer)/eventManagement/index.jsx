import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";

import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import TabsComponent from "../../../components/TabsComponent";
import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";

const EVENT_MANAGEMENT_LINKS = [
  { title: "Events", route: "/eventManagement/events" },
  { title: "Event Names", route: "/eventManagement/eventnames" },
  { title: "Records", route: "/eventManagement/records" },
];

const EventManagement = () => {
  return (
    <View style={globalStyles.secondaryContainerSA}>
      <Text style={styles.title}>Event Management</Text>

      {EVENT_MANAGEMENT_LINKS.map((link) => (
        <TouchableOpacity
          key={link.route}
          style={styles.screenWrapper}
          onPress={() => router.push(link.route)}
        >
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>{link.title}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TabsComponent />

      <StatusBar style="auto" />
    </View>
  );
};

export default EventManagement;

const styles = StyleSheet.create({
  title: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  screenWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    width: "80%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 8,
  },
  screenTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.primary,
  },
});
