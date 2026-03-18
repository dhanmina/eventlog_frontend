import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { fetchEventNameById, disableEventName } from "../../../../services/api/events";
import { useLocalSearchParams } from "expo-router";

const EventNameDetails = () => {
  const { id: eventNameId } = useLocalSearchParams();
  const [eventNameDetails, setEventNameDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabledModalVisible, setIsDisabledModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const fetchEventNameDetails = async () => {
    try {
      if (!eventNameId) throw new Error("Invalid event name ID");

      const eventNameData = await fetchEventNameById(eventNameId);

      if (!eventNameData || !eventNameData.data) {
        throw new Error("Event name details not found");
      }

      setEventNameDetails(eventNameData.data);
    } catch (error) {
      console.error(error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchEventNameDetails();
    }, [eventNameId])
  );

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!eventNameDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>Event name details not found.</Text>
      </View>
    );
  }

  const handleDisablePress = () => {
    setIsDisabledModalVisible(true);
  };

  const handleConfirmDisable = async () => {
    try {
      await disableEventName(eventNameDetails.id);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error(error.message || error);
    } finally {
      setIsDisabledModalVisible(false);
    }
  };

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Event Name Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Event Name:</Text>
          <Text style={styles.detail}>{eventNameDetails.name}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Status:</Text>
          <Text style={styles.detail}>{eventNameDetails.status || "-"}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(
                `/eventManagement/eventnames/EditEventName?id=${eventNameDetails.id}`
              )
            }
          />
        </View>
        {eventNameDetails.status === "Disabled" ? null : (
          <View style={styles.button}>
            <CustomButton
              title="DISABLE"
              type="secondary"
              onPress={handleDisablePress}
            />
          </View>
        )}
      </View>

      <CustomModal
        visible={isDisabledModalVisible}
        title="Confirm Deletion"
        message={`Are you sure you want to disable ${eventNameDetails.name}?`}
        type="warning"
        onClose={() => setIsDisableModalVisible(false)}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={`${eventNameDetails.name} has been disabled successfully.`}
        type="success"
        onClose={() => {
          setIsSuccessModalVisible(false);
        }}
        cancelTitle="Close"
      />

      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default EventNameDetails;

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.medium,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  detailsWrapper: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  button: {
    marginHorizontal: theme.spacing.small,
    flex: 1,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
  },
  detailTitle: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    width: "40%",
    flexShrink: 1,
  },
  detail: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    width: "60%",
    flexShrink: 1,
  },
  loadingText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.Regular,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
  errorText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.Regular,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
});
