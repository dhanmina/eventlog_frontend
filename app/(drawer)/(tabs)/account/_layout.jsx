import { Stack } from "expo-router";
import theme from "../../../../constants/theme";

const AccountLayout = () => (
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
  </Stack>
);

export default AccountLayout;
