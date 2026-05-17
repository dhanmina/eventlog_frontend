import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, Image, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

import { getRoleID } from "../../../database/queries";

import images from "../../../constants/images";
import theme from "../../../constants/theme";

const QR_ROUTES_BY_ROLE = {
  1: "/qr/Generate",
  2: "/(tabs)/qr",
  3: "/qr/Scan",
  4: "/qr/Scan",
};

const getQRRoute = (roleId) => {
  if (roleId === null) return "/qr";
  return QR_ROUTES_BY_ROLE[roleId] || "/(tabs)/qr";
};

const tabItems = {
  home: {
    name: "Home",
    href: "/(tabs)/home",
    icon: images.home,
    label: "Home",
  },
  qr: {
    name: "QR Code",
    getHref: getQRRoute,
    icon: images.scanner,
    label: "QR Code",
  },
  records: {
    name: "records",
    href: "/(tabs)/records",
    icon: images.calendar,
    label: "Records",
  },
  account: {
    name: "Account",
    href: "/(tabs)/account",
    icon: images.user,
    label: "Account",
  },
};

const standardTabOrder = ["home", "qr", "center", "records", "account"];
const superAdminTabOrder = ["home", "center", "qr"];

const TabIconItem = ({ icon, label }) => (
  <View style={styles.tabItem}>
    <Image source={icon} style={styles.tabIcon} />
    <Text style={styles.tabText}>{label}</Text>
  </View>
);

const TabsLayout = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const tabOrder = roleId === 4 ? superAdminTabOrder : standardTabOrder;

  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        {tabOrder.map((tabKey) => {
          if (tabKey === "center") {
            return (
              <TabTrigger
                key={tabKey}
                name="center"
                style={styles.logoContainer}
                href="/(tabs)/center"
              >
                <Image source={images.logo} style={styles.logoImage} />
              </TabTrigger>
            );
          }

          const tab = tabItems[tabKey];
          return (
            <TabTrigger
              key={tabKey}
              name={tab.name}
              href={tab.getHref ? tab.getHref(roleId) : tab.href}
            >
              <TabIconItem icon={tab.icon} label={tab.label} />
            </TabTrigger>
          );
        })}
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
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.secondary,
  },
  tabText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.extraSmall,
    paddingTop: 4,
  },
  logoContainer: {
    position: "relative",
    bottom: 20,
    transform: [{ translateY: 0 }],
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
});

export default TabsLayout;
