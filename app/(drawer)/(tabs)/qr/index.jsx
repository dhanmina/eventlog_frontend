import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { getStoredUser } from "../../../../database/queries";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

import CustomButton from "../../../../components/CustomButton";

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
    if (roleId === 1) {
      router.replace("/qr/Generate");
    } else if (roleId === 3 || roleId === 4) {
      router.replace("/qr/Scan");
    }
  }, [roleId]);

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
              onPress={() => {
                router.push("/qr/Generate");
              }}
              title="Generate"
            />
          </View>
          <View style={styles.scanContainer}>
            <CustomButton
              onPress={() => {
                router.push("/qr/Scan");
              }}
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
