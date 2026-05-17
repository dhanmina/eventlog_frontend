import { Stack } from "expo-router";
import theme from "../../../constants/theme";

const STACK_SCREEN_OPTIONS = {
  headerShadowVisible: false,
  headerTintColor: theme.colors.primary,
  headerStyle: {
    backgroundColor: theme.colors.secondary,
  },
  title: "",
};

const USER_MANAGEMENT_SCREENS = [
  "admins/index",
  "admins/AdminDetails",
  "admins/EditAdmin",
  "admins/AddAdmin",
  "roles/index",
  "students/index",
  "students/AddStudent",
  "students/EditStudent",
  "students/StudentDetails",
];

const UserManagementLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: "" }} />
      {USER_MANAGEMENT_SCREENS.map((screenName) => (
        <Stack.Screen
          key={screenName}
          name={screenName}
          options={STACK_SCREEN_OPTIONS}
        />
      ))}
    </Stack>
  );
};

export default UserManagementLayout;
