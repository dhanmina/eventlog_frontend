import { Stack } from "expo-router";
import theme from "../../../../constants/theme";

const QRLayout = () => (
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
      name="Generate"
      options={{
        headerShown: true,
        headerTitle: "",
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
    <Stack.Screen
      name="Scan"
      options={{
        headerShown: true,
        headerTitle: "",
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
  </Stack>
);

export default QRLayout;
