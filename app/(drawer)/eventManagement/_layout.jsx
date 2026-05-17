import { Stack } from "expo-router";

import theme from "../../../constants/theme";

const SCREEN_OPTIONS = {
  headerShadowVisible: false,
  headerTintColor: theme.colors.primary,
  headerStyle: {
    backgroundColor: theme.colors.secondary,
  },
  title: "",
};

const EVENT_MANAGEMENT_SCREENS = [
  "events/index",
  "events/PendingEvents",
  "events/AddEvent",
  "events/EditEvent",
  "events/EventDetails",
  "eventnames/index",
  "eventnames/AddEventName",
  "eventnames/EventNameDetails",
  "eventnames/EditEventName",
  "records/index",
  "records/BlockList",
  "records/StudentsList",
  "records/Attendance",
];

const EventManagementLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: "" }} />

      {EVENT_MANAGEMENT_SCREENS.map((screenName) => (
        <Stack.Screen
          key={screenName}
          name={screenName}
          options={SCREEN_OPTIONS}
        />
      ))}
    </Stack>
  );
};

export default EventManagementLayout;
