import { Stack } from "expo-router";
import theme from "../../../../constants/theme";

const HomeLayout = () => (
  <Stack>
    <Stack.Screen
      name="index"
      options={{
        headerShown: false,
        headerTitle: "",
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.secondary,
      }}
    />
  </Stack>
);

export default HomeLayout;
