import { Stack } from "expo-router";

const hiddenHeaderOptions = {
  headerShown: false,
};

const SignupLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={hiddenHeaderOptions} />
    </Stack>
  );
};

export default SignupLayout;
