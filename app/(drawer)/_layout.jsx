import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { getRoleID } from "../../database/queries";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import icons from "../../constants/icons";
import theme from "../../constants/theme";

const screenWidth = Dimensions.get("window").width;

// ─── Persistent bottom tab bar ───────────────────────────────────────────────

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

const PersistentTabBar = ({ roleId, pathname }) => {
  const isActive = (path) => pathname.startsWith(path);

  const getQRRoute = () => {
    if (roleId === 1) return "/qr/Generate";
    if (roleId === 2) return "/(tabs)/qr";
    return "/qr/Scan";
  };

  if (roleId === 3 || roleId === 4) {
    return (
      <View style={styles.tabList}>
        <TouchableOpacity onPress={() => router.navigate("/(tabs)/home")}>
          <TabItem icon={icons.home} label="Home" active={isActive("/home")} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate(getQRRoute())}>
          <TabItem icon={icons.scanner} label="QR" active={isActive("/qr")} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/(tabs)/account")}>
          <TabItem
            icon={icons.user}
            label="Account"
            active={isActive("/account")}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.tabList}>
      <TouchableOpacity onPress={() => router.navigate("/(tabs)/home")}>
        <TabItem icon={icons.home} label="Home" active={isActive("/home")} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate(getQRRoute())}>
        <TabItem icon={icons.scanner} label="QR" active={isActive("/qr")} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate("/(tabs)/records")}>
        <TabItem
          icon={icons.calendar}
          label="Records"
          active={isActive("/records")}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate("/(tabs)/account")}>
        <TabItem
          icon={icons.user}
          label="Account"
          active={isActive("/account")}
        />
      </TouchableOpacity>
    </View>
  );
};

// ─── Sidebar drawer content ───────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "User Management",
    icon: icons.role,
    route: "/(drawer)/userManagement",
    match: "/userManagement",
  },
  {
    label: "Academic Management",
    icon: icons.school,
    route: "/(drawer)/academicManagement",
    match: "/academicManagement",
  },
  {
    label: "Event Management",
    icon: icons.calendarStar,
    route: "/(drawer)/eventManagement",
    match: "/eventManagement",
  },
];

const NavItem = ({ item, pathname }) => {
  const isActive = pathname.includes(item.match);
  return (
    <TouchableOpacity
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={() => router.push(item.route)}
      activeOpacity={0.75}
    >
      <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
        <Image
          source={item.icon}
          style={[styles.navIcon, isActive && styles.navIconActive]}
        />
      </View>
      <Text
        style={[styles.navLabel, isActive && styles.navLabelActive]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <Image
        source={icons.arrowRight}
        style={[styles.navChevron, isActive && styles.navChevronActive]}
      />
    </TouchableOpacity>
  );
};

const CustomDrawerContent = (props) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");
  const initials =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join("") || "SA";

  return (
    <DrawerContentScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.drawerContent}
    >
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>{initials}</Text>
        </View>
        <View style={styles.drawerHeaderInfo}>
          <Text style={styles.drawerUserName} numberOfLines={1}>
            {fullName || "Super Admin"}
          </Text>
          <View style={styles.drawerRoleBadge}>
            <Text style={styles.drawerRoleText}>Super Admin</Text>
          </View>
        </View>
      </View>

      <View style={styles.drawerNav}>
        <Text style={styles.navSectionLabel}>MANAGE</Text>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} />
        ))}
      </View>
    </DrawerContentScrollView>
  );
};

// ─── Drawer layout ────────────────────────────────────────────────────────────

export default function DrawerLayout() {
  const pathname = usePathname();
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

  if (roleId === null) return null;

  if (roleId !== 4) {
    return (
      <>
        <Drawer
          drawerContent={() => <View style={styles.noAccessContainer} />}
          screenOptions={{
            drawerPosition: "locked-closed",
            swipeEnabled: false,
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
        </Drawer>
        <PersistentTabBar roleId={roleId} pathname={pathname} />
      </>
    );
  }

  return (
    <>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <DrawerToggleButton tintColor={theme.colors.secondary} />
          ),
          drawerStyle: {
            backgroundColor: theme.colors.secondary,
            width: screenWidth * 0.8,
            elevation: 1000,
            zIndex: 1000,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            headerTitle: "",
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.secondary,
          }}
        />
        <Drawer.Screen
          name="userManagement"
          options={{
            headerTitle: "User Management",
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.secondary,
          }}
        />
        <Drawer.Screen
          name="academicManagement"
          options={{
            headerTitle: "Academic Management",
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.secondary,
          }}
        />
        <Drawer.Screen
          name="eventManagement"
          options={{
            headerTitle: "Event Management",
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.secondary,
          }}
        />
      </Drawer>
      <PersistentTabBar roleId={roleId} pathname={pathname} />
    </>
  );
}

const styles = StyleSheet.create({
  noAccessContainer: {
    flex: 1,
  },

  // ── Drawer sidebar ──────────────────────────────────────────────────────────
  drawerContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },

  // Header card — matches screen header card pattern
  drawerHeader: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    marginHorizontal: theme.spacing.small,
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(251,241,229,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(251,241,229,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  drawerAvatarText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  drawerHeaderInfo: {
    flex: 1,
    gap: 5,
  },
  drawerUserName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  drawerRoleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(251,241,229,0.18)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(251,241,229,0.25)",
  },
  drawerRoleText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.85,
  },

  // ── Nav items ───────────────────────────────────────────────────────────────
  drawerNav: {
    paddingHorizontal: theme.spacing.small,
  },
  navSectionLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: 10,
    color: theme.colors.primary,
    opacity: 0.3,
    letterSpacing: 1.8,
    paddingHorizontal: theme.spacing.small,
    paddingBottom: theme.spacing.small,
    paddingTop: theme.spacing.xsmall,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.large,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.medium,
    marginBottom: 6,
    gap: theme.spacing.medium,
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "rgba(37,85,134,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  navIconWrapActive: {
    backgroundColor: "rgba(251,241,229,0.15)",
  },
  navIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
    opacity: 0.7,
  },
  navIconActive: {
    tintColor: theme.colors.secondary,
    opacity: 1,
  },
  navLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.7,
  },
  navLabelActive: {
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.secondary,
    opacity: 1,
  },
  navChevron: {
    width: 13,
    height: 13,
    tintColor: theme.colors.primary,
    opacity: 0.35,
  },
  navChevronActive: {
    tintColor: theme.colors.secondary,
    opacity: 0.5,
  },

  // ── Persistent tab bar ──────────────────────────────────────────────────────
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
    width: 64,
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
});
