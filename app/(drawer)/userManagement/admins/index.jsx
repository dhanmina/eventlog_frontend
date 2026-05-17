import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchAdmins, disableAdmin } from "../../../../services/api";
import { router, useFocusEffect } from "expo-router";
import images from "../../../../constants/images";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { getStoredUser } from "../../../../database/queries";

const ADMIN_ROUTES = {
  add: "/userManagement/admins/AddAdmin",
  details: (idNumber) =>
    `/userManagement/admins/AdminDetails?id_number=${idNumber}`,
  edit: (idNumber) => `/userManagement/admins/EditAdmin?id_number=${idNumber}`,
};

const OWN_ACCOUNT_DISABLE_MODAL = {
  message: "You cannot disable your own account.",
  type: "error",
};

const isAdminDisabled = (admin) => admin.status === "Disabled";

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

  const loadAdmins = useCallback(async () => {
    try {
      const fetchedAdmins = await fetchAdmins();
      setAdmins(fetchedAdmins);
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdmins();
    }, [loadAdmins])
  );

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadAdmins();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    return admins.filter(
      (admin) =>
        admin.first_name.toLowerCase().includes(lowerCaseQuery) ||
        admin.last_name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [admins, searchQuery]);

  const showOwnAccountDisableModal = () => {
    setIsDisableModalVisible(false);
    setAdminToDisable(null);
    setIsSuccessModalVisible(false);
    setModalMessage(OWN_ACCOUNT_DISABLE_MODAL.message);
    setModalType(OWN_ACCOUNT_DISABLE_MODAL.type);
    setIsModalVisible(true);
  };

  const closeActionModal = () => {
    setIsModalVisible(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
  };

  const getDisabledButtonStyle = (admin) =>
    isAdminDisabled(admin) ? styles.disabledButton : null;

  const handleDisablePress = (admin) => {
    if (admin.id_number === currentAdminId) {
      showOwnAccountDisableModal();
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
      showOwnAccountDisableModal();
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
      <View style={styles.searchContainer}>
        <SearchBar placeholder="Search admins..." onSearch={setSearchQuery} />
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <TouchableOpacity
              key={admin.id_number}
              style={styles.adminContainer}
              onPress={() => router.push(ADMIN_ROUTES.details(admin.id_number))}
            >
              <View>
                <Text style={styles.name}>
                  {admin.first_name} {admin.last_name}
                </Text>
                <Text style={styles.status}>{admin.status}</Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(ADMIN_ROUTES.edit(admin.id_number))
                  }
                >
                  <Image source={images.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(admin)}
                  disabled={isAdminDisabled(admin)}
                  style={getDisabledButtonStyle(admin)}
                >
                  <Image source={images.disabled} style={styles.icon} />
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
          onPress={() => router.push(ADMIN_ROUTES.add)}
        />
      </View>
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
        onClose={closeSuccessModal}
        cancelTitle="CLOSE"
      />

      <CustomModal
        visible={isModalVisible}
        title="Action Not Allowed"
        message={modalMessage}
        type={modalType}
        onClose={closeActionModal}
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
  adminContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  scrollview: {
    padding: theme.spacing.medium,
    flexGrow: 1,
  },
  scrollviewContainer: {
    flex: 1,
    width: "100%",
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.medium,
    width: "100%",
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    marginLeft: theme.spacing.small,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  name: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
  },
  status: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
  },
  noResults: {
    textAlign: "center",
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    marginTop: theme.spacing.medium,
  },
  buttonContainer: {
    position: "absolute",
    bottom: "15%",
    width: "80%",
    padding: theme.spacing.medium,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
