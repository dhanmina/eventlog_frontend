import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { getRoleID } from "../../../../database/queries";
import theme from "../../../../constants/theme";

const RecordsLayout = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const fetchedRoleId = await getRoleID();
        setRoleId(fetchedRoleId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleId();
  }, []);

  if (loading) {
    return null;
  }

  const showHeader = roleId !== 4;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
          title: "",
        }}
      />
      <Stack.Screen
        name="Attendance"
        options={{
          headerTitle: "Attendance",
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
        }}
      />
      <Stack.Screen
        name="BlockList"
        options={{
          headerTitle: "List of Blocks",
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
        }}
      />
      <Stack.Screen
        name="StudentsList"
        options={{
          headerTitle: "List of Students",
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
        }}
      />
    </Stack>
  );
};

export default RecordsLayout;
