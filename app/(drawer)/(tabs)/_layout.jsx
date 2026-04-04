import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import theme from "../../../constants/theme";

const TabsLayout = () => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.primary }]}
      edges={roleId === 4 ? [] : ["top"]}
    >
      <Tabs>
        <TabSlot />
        <TabList style={styles.hidden}>
          <TabTrigger name="home" href="/(tabs)/home">
            <View />
          </TabTrigger>
          <TabTrigger name="qr" href="/(tabs)/qr">
            <View />
          </TabTrigger>
          <TabTrigger name="records" href="/(tabs)/records">
            <View />
          </TabTrigger>
          <TabTrigger name="account" href="/(tabs)/account">
            <View />
          </TabTrigger>
          <TabTrigger name="center" href="/(tabs)/center">
            <View />
          </TabTrigger>
        </TabList>
      </Tabs>
    </SafeAreaView>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    height: 0,
    overflow: "hidden",
  },
});
