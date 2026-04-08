import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { fetchAdmins, updateAdminStatus } from "../../../../services/api/admins";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { getStoredUser } from "../../../../database/queries";

export default function AdminsScreen() {
  const [admins, setAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [isOwnAccountModalVisible, setIsOwnAccountModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const user = await getStoredUser();
      setCurrentAdminId(user?.id_number);
    };
    fetchCurrentAdmin();
  }, []);

  const loadAdmins = async () => {
    try {
      const fetchedAdmins = await fetchAdmins();
      setAdmins(fetchedAdmins);
    } catch {}
  };

  useFocusEffect(useCallback(() => { loadAdmins(); }, []));

  const refreshData = async () => {
    setRefreshing(true);
    await loadAdmins();
    setRefreshing(false);
  };

  const filteredAdmins = admins.filter((admin) => {
    const fullName = `${admin.first_name || ""} ${admin.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || admin.id_number?.includes(searchQuery);
  });

  const activeCount = admins.filter((a) => a.status === "Active").length;
  const disabledCount = admins.filter((a) => a.status === "Disabled").length;

  const handleTogglePress = (admin) => {
    if (admin.id_number === currentAdminId) {
      setIsOwnAccountModalVisible(true);
      return;
    }
    setAdminToToggle(admin);
    setIsToggleModalVisible(true);
  };

  const handleToggleModalClose = () => {
    setIsToggleModalVisible(false);
    setAdminToToggle(null);
  };

  const handleConfirmToggle = async () => {
    if (!adminToToggle) return;
    const isDisabled = adminToToggle.status === "Disabled";
    try {
      await updateAdminStatus(adminToToggle.id_number, isDisabled ? "Active" : "Disabled");
      await loadAdmins();
      handleToggleModalClose();
      setSuccessMessage(`Admin ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch (error) {
      handleToggleModalClose();
      setErrorMessage(error?.response?.data?.message || error?.message || "Failed to update admin status.");
      setIsErrorModalVisible(true);
    }
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={adminToToggle?.status === "Disabled" ? "Enable Admin" : "Disable Admin"}
        message={`Are you sure you want to ${adminToToggle?.status === "Disabled" ? "enable" : "disable"} ${adminToToggle?.first_name} ${adminToToggle?.last_name}?`}
        type="warning"
        onClose={handleToggleModalClose}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={adminToToggle?.status === "Disabled" ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />
      <CustomModal
        visible={isOwnAccountModalVisible}
        title="Action Not Allowed"
        message="You cannot disable your own account."
        type="warning"
        onClose={() => setIsOwnAccountModalVisible(false)}
        cancelTitle="CLOSE"
      />
      <CustomModal
        visible={isErrorModalVisible}
        title="Error"
        message={errorMessage}
        type="error"
        onClose={() => setIsErrorModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>ADMINS</Text>
        <Text style={styles.headerSubtitle}>Manage administrator accounts</Text>
        {admins.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar placeholder="Search admins..." onSearch={setSearchQuery} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => {
            const isDisabled = admin.status === "Disabled";
            const fullName = `${admin.first_name || ""} ${admin.last_name || ""}`;
            return (
              <TouchableOpacity
                key={admin.id_number}
                style={styles.card}
                onPress={() => router.push(`/userManagement/admins/AdminDetails?id_number=${admin.id_number}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{fullName}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{admin.id_number}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push(`/userManagement/admins/EditAdmin?id_number=${admin.id_number}`)}
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(admin)}
                  >
                    <Image source={isDisabled ? icons.check : icons.disabled} style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.admin} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No admins found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add an admin to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton title="ADD ADMIN" onPress={() => router.push("/userManagement/admins/AddAdmin")} />
      </View>
      <View style={styles.tabSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
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
  headerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    marginTop: theme.spacing.small,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
  },
  headerStat: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  headerStatDivider: {
    color: theme.colors.secondary,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
    marginBottom: theme.spacing.small,
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
  cardLeft: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
  },
  cardLeftDisabled: {
    backgroundColor: "rgba(0,0,0,0.15)",
    opacity: 1,
  },
  cardBody: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    gap: 3,
  },
  cardName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  cardSub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: theme.spacing.xsmall,
  },
  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: theme.spacing.small,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    tintColor: theme.colors.primary,
    opacity: 0.2,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    opacity: 0.4,
  },
  emptySub: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.3,
  },
  buttonContainer: {
    width: "100%",
    paddingVertical: theme.spacing.small,
  },
  tabSpacer: {
    height: 80,
  },
});
