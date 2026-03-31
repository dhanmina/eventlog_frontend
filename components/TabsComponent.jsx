import { Link, useRouter } from "expo-router";
import { View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import images from "../constants/images";
import icons from "../constants/icons";
import theme from "../constants/theme";
import { getRoleID } from "../database/queries";
import { useState, useEffect } from "react";

export default function TabsComponent() {
  const router = useRouter();
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const fetchedRoleId = await getRoleID();
        setRoleId(fetchedRoleId);
      } catch (error) {
        console.error("Error fetching role ID:", error);
      }
    };
    fetchRoleId();
  }, []);

  return roleId !== 4 ? (
    <View style={styles.tabList}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/home")}
      >
        <Image source={icons.home} style={styles.tabIcon} />
        <Text style={styles.tabText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/qr")}
      >
        <Image source={icons.scanner} style={styles.tabIcon} />
        <Text style={styles.tabText}>QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        name="center"
        style={styles.logoContainer}
        onPress={() => router.push("/(drawer)/center")}
      >
        <Image source={images.logo} style={styles.logoImage} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/Records")}
      >
        <Image source={icons.calendar} style={styles.tabIcon} />
        <Text style={styles.tabText}>Records</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/Accounts")}
      >
        <Image source={icons.user} style={styles.tabIcon} />
        <Text style={styles.tabText}>Account</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.tabList}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/home")}
      >
        <Image source={icons.home} style={styles.tabIcon} />
        <Text style={styles.tabText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        name="center"
        style={styles.logoContainer}
        onPress={() => router.push("/(drawer)/center")}
      >
        <Image source={images.logo} style={styles.logoImage} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(drawer)/(tabs)/qr")}
      >
        <Image source={icons.scanner} style={styles.tabIcon} />
        <Text style={styles.tabText}>QR Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
