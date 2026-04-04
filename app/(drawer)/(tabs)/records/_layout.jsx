import { Stack } from "expo-router";
import theme from "../../../../constants/theme";

const RecordsLayout = () => (
  <Stack>
    <Stack.Screen
      name="index"
      options={{
        headerShown: true,
        headerTitle: "",
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
    <Stack.Screen
      name="Attendance"
      options={{
        headerShown: true,
        headerTitle: "",
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
  </Stack>
);

export default RecordsLayout;
