import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { getStoredUser } from "../../../../database/queries";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";

const QRCode = () => {
  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getStoredUser();
        if (user?.role_id) setRoleId(user.role_id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (roleId === 1) router.replace("/qr/Generate");
    else if (roleId === 3 || roleId === 4) router.replace("/qr/Scan");
  }, [roleId]);

  if (loading || roleId !== 2) return <View style={globalStyles.secondaryContainer} />;

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>QR CODE</Text>
        <Text style={styles.headerSubtitle}>Generate your QR or scan an attendee</Text>
      </View>

      <View style={styles.optionsWrapper}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/qr/Generate")}
          activeOpacity={0.85}
        >
          <View style={styles.optionIconWrap}>
            <Image source={icons.student} style={styles.optionIcon} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Generate</Text>
            <Text style={styles.optionDesc}>Show your QR code to be scanned at an event</Text>
          </View>
          <Image source={icons.arrowRight} style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/qr/Scan")}
          activeOpacity={0.85}
        >
          <View style={styles.optionIconWrap}>
            <Image source={icons.scanner} style={styles.optionIcon} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Scan</Text>
            <Text style={styles.optionDesc}>Scan an attendee's QR code to log attendance</Text>
          </View>
          <Image source={icons.arrowRight} style={styles.chevron} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRCode;

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  headerTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  headerSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.55,
    marginTop: 3,
  },

  optionsWrapper: {
    width: "100%",
    gap: theme.spacing.small,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.12)",
    padding: theme.spacing.medium,
    gap: theme.spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "rgba(37,85,134,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionIcon: {
    width: 22,
    height: 22,
    tintColor: theme.colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  optionDesc: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  chevron: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    opacity: 0.3,
    flexShrink: 0,
  },
});
