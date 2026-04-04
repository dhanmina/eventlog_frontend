import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { usePathname } from "expo-router";
import { View, Image, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

import { getRoleID } from "../../../database/queries";
import images from "../../../constants/images";
import icons from "../../../constants/icons";
import theme from "../../../constants/theme";

const TabItem = ({ icon, label, active }) => (
  <View style={styles.tabItem}>
    {active && <View style={styles.activeBar} />}
    <Image
      source={icon}
      style={[styles.tabIcon, !active && styles.tabIconInactive]}
    />
    <Text style={[styles.tabText, !active && styles.tabTextInactive]}>
      {label}
    </Text>
  </View>
);

const TabsLayout = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const fetchedRoleId = await getRoleID();
        setRoleId(fetchedRoleId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoleId();
  }, []);

  const isActive = (path) => pathname.startsWith(path);

  const getQRRoute = () => {
    if (roleId === null) return "/qr";
    if (roleId === 1) return "/qr/Generate";
    if (roleId === 2) return "/(tabs)/qr";
    if (roleId === 3 || roleId === 4) return "/qr/Scan";
    return "/(tabs)/qr";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return roleId === 4 ? (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="Home" href="/(tabs)/home">
          <TabItem icon={icons.home} label="Home" active={isActive("/home")} />
        </TabTrigger>

        <TabTrigger name="center" style={styles.logoContainer} href="/(tabs)/center">
          <Image
            source={images.logo}
            style={[styles.logoImage, isActive("/center") && styles.logoImageActive]}
          />
        </TabTrigger>

        <TabTrigger name="QR Code" href={getQRRoute()}>
          <TabItem icon={icons.scanner} label="QR" active={isActive("/qr")} />
        </TabTrigger>
      </TabList>
    </Tabs>
  ) : (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="Home" href="/(tabs)/home">
          <TabItem icon={icons.home} label="Home" active={isActive("/home")} />
        </TabTrigger>

        <TabTrigger name="QR Code" href={getQRRoute()}>
          <TabItem icon={icons.scanner} label="QR" active={isActive("/qr")} />
        </TabTrigger>

        <TabTrigger name="center" style={styles.logoContainer} href="/(tabs)/center">
          <Image
            source={images.logo}
            style={[styles.logoImage, isActive("/center") && styles.logoImageActive]}
          />
        </TabTrigger>

        <TabTrigger name="records" href="/(tabs)/records">
          <TabItem icon={icons.calendar} label="Records" active={isActive("/records")} />
        </TabTrigger>

        <TabTrigger name="Account" href="/(tabs)/account">
          <TabItem icon={icons.user} label="Account" active={isActive("/account")} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  loadingText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.secondary,
  },
  tabList: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    height: 80,
  },
  tabItem: {
    alignItems: "center",
    width: 60,
    paddingTop: 6,
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: theme.colors.secondary,
  },
  tabIcon: {
    width: 22,
    height: 22,
    tintColor: theme.colors.secondary,
  },
  tabIconInactive: {
    opacity: 0.4,
  },
  tabText: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    paddingTop: 4,
  },
  tabTextInactive: {
    opacity: 0.4,
  },
  logoContainer: {
    position: "relative",
    bottom: 20,
  },
  logoImage: {
    height: 90,
    width: 90,
    borderWidth: 6,
    borderColor: theme.colors.primary,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoImageActive: {
    borderColor: theme.colors.secondary,
    borderWidth: 3,
  },
});

export default TabsLayout;
