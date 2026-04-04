import { Stack } from "expo-router";

import theme from "../../../constants/theme";

const AcademicManagementLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: "" }} />
      <Stack.Screen
        name="blocks/index"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="blocks/AddBlock"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="blocks/BlockDetails"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="blocks/EditBlock"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />

      <Stack.Screen
        name="courses/index"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="courses/AddCourse"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="courses/CourseDetails"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="courses/EditCourse"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />

      <Stack.Screen
        name="departments/index"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="departments/AddDepartment"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="departments/DepartmentDetails"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />
      <Stack.Screen
        name="departments/EditDepartment"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          title: "",
        }}
      />

      <Stack.Screen
        name="schoolyears/index"
        options={{
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          headerTitle: "",
        }}
      />
    </Stack>
  );
};

export default AcademicManagementLayout;
