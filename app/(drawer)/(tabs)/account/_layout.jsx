import { Stack } from "expo-router";
import { useEffect, useState } from "react";

import theme from "../../../../constants/theme";
import { getRoleID } from "../../../../database/queries";

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
};

const accountStackScreens = [
  { name: "AddEvent", headerTitle: "Add Event" },
  { name: "EditEvent", headerTitle: "Edit Event" },
  { name: "EventsList", headerTitle: "Editable Events" },
];

const AccountLayout = () => {
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const fetchRoleId = async () => {
      const id = await getRoleID();
      setRoleId(id);
    };

    fetchRoleId();
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...sharedHeaderOptions,
          headerShown: roleId !== 4,
          title: "Account",
        }}
      />
      {accountStackScreens.map(({ name, headerTitle }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            ...sharedHeaderOptions,
            headerTitle,
          }}
        />
      ))}
    </Stack>
  );
};

export default AccountLayout;
