import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import TabsComponent from "../../../../components/TabsComponent";
import { StatusBar } from "expo-status-bar";
import { fetchAdmins, disableAdmin } from "../../../../services/api/admins";
import { router, useFocusEffect } from "expo-router";
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
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [adminToDisable, setAdminToDisable] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAdmins();
    }, [])
  );

  const refreshData = async () => {
    setRefreshing(true);
    await loadAdmins();
    setRefreshing(false);
  };

  const lowerCaseQuery = searchQuery.toLowerCase();
  const filteredAdmins = admins.filter(
    (admin) =>
      admin.first_name.toLowerCase().includes(lowerCaseQuery) ||
      admin.last_name.toLowerCase().includes(lowerCaseQuery)
  );

  const handleDisablePress = (admin) => {
    if (admin.id_number === currentAdminId) {
      setIsDisableModalVisible(false);
      setAdminToDisable(null);
      setIsSuccessModalVisible(false);
      setModalMessage("You cannot disable your own account.");
      setModalType("error");
      setIsModalVisible(true);
      return;
    }

    setAdminToDisable(admin);
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
    setAdminToDisable(null);
  };

  const handleConfirmDisable = async () => {
    if (!adminToDisable) return;

    if (adminToDisable.id_number === currentAdminId) {
      setIsDisableModalVisible(false);
      setAdminToDisable(null);
      setIsSuccessModalVisible(false);
      setModalMessage("You cannot disable your own account.");
      setModalType("error");
      setIsModalVisible(true);
      return;
    }

    try {
      await disableAdmin(adminToDisable.id_number);
      await loadAdmins();
      setIsDisableModalVisible(false);
      setTimeout(() => setIsSuccessModalVisible(true), 300);
    } catch (error) {
      console.error("Error disabling admin:", error);
    }
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <Text style={styles.headerText}>ADMINS</Text>
      <View style={{ width: "100%" }}>
        <SearchBar placeholder="Search admins..." onSearch={setSearchQuery} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <TouchableOpacity
              key={admin.id_number}
              style={styles.adminContainer}
              onPress={() =>
                router.push(
                  `/userManagement/admins/AdminDetails?id_number=${admin.id_number}`
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {admin.first_name} {admin.last_name}
                </Text>
                <Text style={styles.status} numberOfLines={1}>
                  {admin.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    router.push(
                      `/userManagement/admins/EditAdmin?id_number=${admin.id_number}`
                    )
                  }
                >
                  <Image source={icons.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { opacity: admin.status === "Disabled" ? 0.3 : 1 }]}
                  onPress={() => handleDisablePress(admin)}
                  disabled={admin.status === "Disabled"}
                >
                  <Image source={icons.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No admins found</Text>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD ADMIN"
          onPress={() => router.push("/userManagement/admins/AddAdmin")}
        />
      </View>
      <View style={styles.tabSpacer} />
      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${adminToDisable?.first_name} ${adminToDisable?.last_name}?`}
        type="warning"
        onClose={handleDisableModalClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Admin disabled successfully!"
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <CustomModal
        visible={isModalVisible}
        title="Action Not Allowed"
        message={modalMessage}
        type={modalType}
        onClose={() => setIsModalVisible(false)}
        cancelTitle="CLOSE"
      />
      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    marginTop: theme.spacing.small,
  },
  scrollview: {
    paddingBottom: 200,
    flexGrow: 1,
  },
  adminContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    marginRight: theme.spacing.small,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
    flexShrink: 1,
  },
  status: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    flexShrink: 1,
  },
  noResults: {
    textAlign: "center",
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    marginTop: theme.spacing.medium,
  },
  buttonContainer: {
    alignSelf: "center",
    width: "80%",
    paddingVertical: theme.spacing.small,
  },
  tabSpacer: {
    height: 110,
  },
});
