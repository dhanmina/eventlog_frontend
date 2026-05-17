import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { getRoleID } from "../../../../database/queries";
import theme from "../../../../constants/theme";

const baseHeaderOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
};

const recordsScreens = [
  { name: "index", title: "Records" },
  { name: "Attendance", headerTitle: "Attendance" },
  { name: "BlockList", headerTitle: "List of Blocks" },
  { name: "StudentsList", headerTitle: "List of Students" },
];

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
      {recordsScreens.map(({ name, title, headerTitle }) => (
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

export default RecordsLayout;
