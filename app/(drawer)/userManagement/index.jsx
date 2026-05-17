import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import TabsComponent from "../../../components/TabsComponent";
import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";

const USER_MANAGEMENT_LINKS = [
  {
    title: "Admins",
    route: "/userManagement/admins",
    accessibilityLabel: "Navigate to Admins",
  },
  {
    title: "Roles",
    route: "/userManagement/roles",
    accessibilityLabel: "Navigate to Roles",
  },
  {
    title: "Students",
    route: "/userManagement/students",
    accessibilityLabel: "Navigate to Students",
  },
];

const UserManagementScreen = () => {
  return (
    <View style={globalStyles.secondaryContainerSA}>
      <Text style={styles.title}>User Management</Text>

      {USER_MANAGEMENT_LINKS.map(({ title, route, accessibilityLabel }) => (
        <TouchableOpacity
          key={route}
          style={styles.screenWrapper}
          onPress={() => {
            router.push(route);
          }}
          accessibilityLabel={accessibilityLabel}
        >
          <View>
            <Text style={styles.screenTitle}>{title}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TabsComponent />

      <StatusBar style="auto" />
    </View>
  );
};

export default UserManagementScreen;

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
