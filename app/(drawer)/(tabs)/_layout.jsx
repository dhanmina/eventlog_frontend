import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, Image, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

import { getRoleID } from "../../../database/queries";

import images from "../../../constants/images";
import icons from "../../../constants/icons";
import theme from "../../../constants/theme";

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
          <View style={styles.tabItem}>
            <Image source={icons.home} style={styles.tabIcon} />
            <Text style={styles.tabText}>Home</Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="center"
          style={styles.logoContainer}
          href="/(tabs)/center"
        >
          <Image source={images.logo} style={styles.logoImage} />
        </TabTrigger>

        <TabTrigger name="QR Code" href={getQRRoute()}>
          <View style={styles.tabItem}>
            <Image source={icons.scanner} style={styles.tabIcon} />
            <Text style={styles.tabText}>QR Code</Text>
          </View>
        </TabTrigger>
      </TabList>
    </Tabs>
  ) : (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="Home" href="/(tabs)/home">
          <View style={styles.tabItem}>
            <Image source={icons.home} style={styles.tabIcon} />
            <Text style={styles.tabText}>Home</Text>
          </View>
        </TabTrigger>

        <TabTrigger name="QR Code" href={getQRRoute()}>
          <View style={styles.tabItem}>
            <Image source={icons.scanner} style={styles.tabIcon} />
            <Text style={styles.tabText}>QR Code</Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="center"
          style={styles.logoContainer}
          href="/(tabs)/center"
        >
          <Image source={images.logo} style={styles.logoImage} />
        </TabTrigger>

        <TabTrigger name="records" href="/(tabs)/records">
          <View style={styles.tabItem}>
            <Image source={icons.calendar} style={styles.tabIcon} />
            <Text style={styles.tabText}>Records</Text>
          </View>
        </TabTrigger>

        <TabTrigger name="Account" href="/(tabs)/account">
          <View style={styles.tabItem}>
            <Image source={icons.user} style={styles.tabIcon} />
            <Text style={styles.tabText}>Account</Text>
          </View>
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
