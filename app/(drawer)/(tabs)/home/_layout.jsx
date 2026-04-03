import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import theme from "../../../../constants/theme";
import { getRoleID } from "../../../../database/queries";

const HomeLayout = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const id = await getRoleID();
        setRoleId(id);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: roleId !== 4,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
          title: "Home",
        }}
      />
    </Stack>
  );
};

export default HomeLayout;
