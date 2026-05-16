import { Stack } from "expo-router";
import theme from "../../../constants/theme";

const hiddenHeaderOptions = {
  headerShown: false,
};

const recoveryHeaderOptions = {
  headerShown: true,
  headerTitle: "",
  headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: theme.colors.secondary,
};

const recoveryScreens = ["ForgotPassword", "NewPassword", "VerifyCode"];

const LoginLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={hiddenHeaderOptions} />
      {recoveryScreens.map((screenName) => (
        <Stack.Screen key={screenName} name={screenName} options={recoveryHeaderOptions} />
      ))}
    </Stack>
  );
};

export default LoginLayout;
