import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import { StatusBar } from "expo-status-bar";
import { fetchRoles } from "../../../../services/api/roles";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import TabsComponent from "../../../../components/TabsComponent";

export default function RolesScreen() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const fetchedRoles = await fetchRoles();
        setRoles(fetchedRoles);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };

    loadRoles();
  }, []);

  return (
    <View style={[globalStyles.secondaryContainer, { paddingBottom: 80 }]}>
      <Text style={styles.headerText}>ROLES</Text>
      <View style={styles.listContainer}>
        {roles.length > 0 ? (
          roles.map((role) => (
            <View key={role.role_id} style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role.role_id}</Text>
              </View>
              <Text style={styles.roleName}>{role.role_name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noResults}>No roles found</Text>
        )}
      </View>

      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  listContainer: {
    width: "100%",
  },
  roleContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    marginBottom: theme.spacing.small,
    gap: theme.spacing.small,
  },
  roleBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  roleBadgeText: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
  roleName: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
  },
  noResults: {
    textAlign: "center",
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    marginTop: theme.spacing.medium,
  },
});
