import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import useUserAccount from "../../../../hooks/useUserAccount";

const ROLE_LABELS = {
  1: "Student",
  2: "Officer",
  3: "Admin",
  4: "Super Admin",
};

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Image source={icon} style={styles.infoIcon} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

const Account = () => {
  const { user, handleLogout } = useUserAccount();

  const fullName = [
    user?.first_name,
    user?.middle_name,
    user?.last_name,
    user?.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join("");

  const roleLabel = ROLE_LABELS[user?.role_id] || "User";

  return (
    <View style={globalStyles.secondaryContainer}>
      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitials}>{initials || "?"}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {fullName || "N/A"}
              </Text>
              <Text style={styles.profileId}>{user?.id_number || ""}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE</Text>
          <View style={styles.card}>
            <InfoRow
              icon={icons.idBadge}
              label="ID Number"
              value={user?.id_number}
            />
            {user?.block_name && (
              <InfoRow
                icon={icons.blocks}
                label="Block"
                value={user?.block_name}
              />
            )}
            {user?.department_name && (
              <InfoRow
                icon={icons.department}
                label="Department"
                value={user?.department_name}
              />
            )}
            <InfoRow icon={icons.email} label="Email" value={user?.email} />
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT US</Text>
          <View style={styles.card}>
            <View style={styles.contactHeader}>
              <View style={styles.infoIconWrap}>
                <Image source={icons.school} style={styles.infoIcon} />
              </View>
              <View style={styles.contactHeaderText}>
                <Text style={styles.schoolName}>
                  UNIVERSITY OF CAGAYAN VALLEY
                </Text>
                <Text style={styles.deptName}>
                  College of Information Technology
                </Text>
              </View>
            </View>
            <View style={styles.contactDivider} />
            <InfoRow
              icon={icons.location}
              label="Address"
              value="VHNP Building 4th Floor - New Site Campus, Balzain, Tuguegarao City, Cagayan"
            />
            <InfoRow
              icon={icons.email2}
              label="Email"
              value="cit_eventlogsupport@gmail.com"
            />
            <InfoRow
              icon={icons.facebook}
              label="Facebook"
              value="CITofficial.UCV"
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <CustomButton title="LOG OUT" onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  // Header card — matches Home/Records pattern
  headerCard: {
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(251,241,229,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(251,241,229,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.medium,
    flexShrink: 0,
  },
  avatarInitials: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  headerInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
  profileId: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.6,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
    marginLeft: theme.spacing.small,
  },
  roleText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.medium,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.5,
    marginBottom: theme.spacing.small,
    marginLeft: theme.spacing.xsmall,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.12)",
    overflow: "hidden",
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

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37,85,134,0.08)",
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "rgba(37,85,134,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.medium,
    flexShrink: 0,
  },
  infoIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    opacity: 0.8,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.45,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },

  // Contact
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.medium,
    gap: theme.spacing.medium,
  },
  contactHeaderText: {
    flex: 1,
  },
  schoolName: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },
  deptName: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.6,
    marginTop: 2,
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(37,85,134,0.08)",
  },

  // Logout
  logoutContainer: {
    marginTop: theme.spacing.small,
  },
});
