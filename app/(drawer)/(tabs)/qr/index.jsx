import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { getStoredUser } from "../../../../database/queries";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

import CustomButton from "../../../../components/CustomButton";

const QR_ROUTES = {
  generate: "/qr/Generate",
  scan: "/qr/Scan",
};

const getRedirectRoute = (roleId) => {
  if (roleId === 1) return QR_ROUTES.generate;
  if (roleId === 3 || roleId === 4) return QR_ROUTES.scan;
  return null;
};

const QRCode = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getStoredUser();
        if (user && user.role_id) {
          setRoleId(user.role_id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const redirectRoute = getRedirectRoute(roleId);
    if (redirectRoute) router.replace(redirectRoute);
  }, [roleId]);

  const goToGenerate = () => {
    router.push(QR_ROUTES.generate);
  };

  const goToScan = () => {
    router.push(QR_ROUTES.scan);
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.secondaryContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.secondaryContainer}>
      {roleId === 2 && (
        <View style={styles.buttonWrapper}>
          <View>
            <CustomButton
              onPress={goToGenerate}
              title="Generate"
            />
          </View>
          <View style={styles.scanContainer}>
            <CustomButton
              onPress={goToScan}
              title="Scan"
              type="secondary"
            />
          </View>
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default QRCode;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
  },
  buttonWrapper: {
    width: "70%",
    alignSelf: "center",
    marginTop: theme.spacing.large,
  },
  scanContainer: {
    marginTop: theme.spacing.medium,
  },
});
