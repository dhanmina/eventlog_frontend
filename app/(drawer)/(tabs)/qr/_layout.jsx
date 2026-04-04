import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { getRoleID } from "../../../../database/queries";
import theme from "../../../../constants/theme";

const QRLayout = () => {
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
          headerTitle: "",
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
          title: "QR Code",
        }}
      />
      <Stack.Screen
        name="Generate"
        options={{
          headerTitle: "Generate QR Code",
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
        }}
      />
      <Stack.Screen
        name="Scan"
        options={{
          headerTitle: "Scan QR Code",
          headerShown: showHeader,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
        }}
      />
    </Stack>
  );
};

export default QRLayout;
