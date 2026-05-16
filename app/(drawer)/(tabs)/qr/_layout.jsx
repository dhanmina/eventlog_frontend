import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { getRoleID } from "../../../../database/queries";
import theme from "../../../../constants/theme";

const baseHeaderOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
};

const qrScreens = [
  { name: "index", title: "QR Code" },
  { name: "Generate", headerTitle: "Generate QR Code" },
  { name: "Scan", headerTitle: "Scan QR Code" },
];

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
      {qrScreens.map(({ name, title, headerTitle }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            ...baseHeaderOptions,
            headerShown: showHeader,
            title,
            headerTitle,
          }}
        />
      ))}
    </Stack>
  );
};

export default QRLayout;
