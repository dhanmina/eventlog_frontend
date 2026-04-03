import { Stack } from "expo-router";
import theme from "../../../constants/theme";

const authScreenOptions = {
  headerShown: true,
  headerTitle: "",
  headerBackTitleVisible: false,
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
};

const LoginLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: "" }} />
      <Stack.Screen name="ForgotPassword" options={authScreenOptions} />
      <Stack.Screen name="VerifyCode" options={authScreenOptions} />
      <Stack.Screen name="NewPassword" options={authScreenOptions} />
    </Stack>
  );
};

export default LoginLayout;
