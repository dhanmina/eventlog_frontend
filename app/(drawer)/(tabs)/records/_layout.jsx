import { Stack } from "expo-router";
import theme from "../../../../constants/theme";

const RecordsLayout = () => (
  <Stack>
    <Stack.Screen
      name="index"
      options={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
        title: "",
      }}
    />
    <Stack.Screen
      name="Attendance"
      options={{
        headerTitle: "Attendance",
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
  </Stack>
);

export default RecordsLayout;
