import React, { useState } from "react";
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
import {
  fetchEventNames,
  disableEventName,
} from "../../../../services/api/events";
import { router, useFocusEffect } from "expo-router";
import images from "../../../../constants/images";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function EventNamesScreen() {
  const [eventNames, setEventNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [eventNameToDisable, setEventNameToDisable] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEventNames = async (search = "") => {
    try {
      const fetchedEventNames = await fetchEventNames(search, 1, 100);

      setEventNames(Array.isArray(fetchedEventNames) ? fetchedEventNames : []);
    } catch (err) {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadEventNames(searchQuery);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEventNames(searchQuery);
    }, []),
  );

  const filteredEventNames = Array.isArray(eventNames) ? eventNames : [];

  const handleDisablePress = (eventName) => {
    if (!eventName || !eventName.label) return;
    setEventNameToDisable(eventName);
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
    setEventNameToDisable(null);
  };

  const handleConfirmDisable = async () => {
    if (!eventNameToDisable) return;
    try {
      await disableEventName(eventNameToDisable.value);
      setEventNames((prevEventNames) =>
        prevEventNames.map((eventName) =>
          eventName.value === eventNameToDisable.value
            ? { ...eventName, status: "Disabled" }
            : eventName,
        ),
      );
      handleDisableModalClose();
      setIsSuccessModalVisible(true);
    } catch (error) {}
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>EVENT NAMES</Text>
      <View style={{ paddingHorizontal: theme.spacing.medium, width: "100%" }}>
        <SearchBar
          placeholder="Search event names..."
          onSearch={(query) => {
            setSearchQuery(query);
            loadEventNames(query);
          }}
        />
      </View>
      <ScrollView
        style={{ flex: 1, width: "100%", marginBottom: 70 }}
        contentContainerStyle={[styles.scrollview, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {filteredEventNames.length > 0 ? (
          filteredEventNames.map((eventName) => (
            <TouchableOpacity
              key={eventName.value}
              style={styles.eventNameContainer}
              onPress={() =>
                router.push(
                  `/eventManagement/eventnames/EventNameDetails?id=${eventName.value}`,
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {eventName.label}
                </Text>
                <Text style={styles.status} numberOfLines={1}>
                  {eventName.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (eventName.value) {
                      router.push(
                        `/eventManagement/eventnames/EditEventName?id=${eventName.value}`,
                      );
                    }
                  }}
                >
                  <Image source={images.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(eventName)}
                  disabled={eventName.status === "Disabled"}
                  style={{
                    opacity: eventName.status === "Disabled" ? 0.5 : 1,
                  }}
                >
                  <Image source={images.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No event names found</Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD EVENT NAME"
          onPress={() =>
            router.push("/eventManagement/eventnames/AddEventName")
          }
        />
      </View>

      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${eventNameToDisable?.label}?`}
        type="warning"
        onClose={handleDisableModalClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Event name disabled successfully!"
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
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
  eventNameContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  scrollview: {
    padding: theme.spacing.medium,
    flexGrow: 1,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    marginLeft: theme.spacing.small,
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
    position: "absolute",
    bottom: theme.spacing.medium,
    alignSelf: "center",
    width: "80%",
    padding: theme.spacing.medium,
    marginBottom: 80,
  },
});
