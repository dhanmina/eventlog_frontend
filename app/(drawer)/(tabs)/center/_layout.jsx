import { Stack } from "expo-router";

import theme from "../../../../constants/theme";

const tutorialScreenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.secondary,
  title: "Tutorial",
};

const CenterLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={tutorialScreenOptions}
      />
    </Stack>
  );
};

export default CenterLayout;
