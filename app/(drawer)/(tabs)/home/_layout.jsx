import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import theme from "../../../../constants/theme";
import { getStoredUser } from "../../../../database/queries";

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
};

const HomeLayout = () => {
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getStoredUser();
      setRoleId(user?.role_id || null);
    };
    fetchUser();
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...sharedHeaderOptions,
          headerShown: roleId !== 4,
          title: "Home",
        }}
      />
      <Stack.Screen
        name="Welcome"
        options={{
          ...sharedHeaderOptions,
          title: "Welcome",
        }}
      />
    </Stack>
  );
};

export default HomeLayout;
