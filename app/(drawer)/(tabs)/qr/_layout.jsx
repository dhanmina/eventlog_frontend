import { Stack } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import theme from "../../../../constants/theme";

const QRLayout = () => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="Generate"
        options={{
          headerShown: true,
          headerTitle: "",
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
          headerStatusBarHeight: 0,
        }}
      />
      <Stack.Screen
        name="Scan"
        options={{
          headerShown: roleId !== 4,
          headerTitle: "",
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.secondary,
          headerStatusBarHeight: 0,
        }}
      />
    </Stack>
  );
};

export default QRLayout;
