import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";

import TabsComponent from "../../../../components/TabsComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import { fetchBlockById, disableBlock } from "../../../../services/api/blocks";
import { useLocalSearchParams } from "expo-router";

const BlockDetails = () => {
  const { id: block_id } = useLocalSearchParams();
  const [blockDetails, setBlockDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const fetchBlockDetails = async () => {
    try {
      if (!block_id) throw new Error("Invalid block ID");

      const blockData = await fetchBlockById(block_id);
      if (!blockData || Object.keys(blockData).length === 0) {
        throw new Error("Block details not found");
      }

      setBlockDetails(blockData);
    } catch (error) {
      console.error(error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchBlockDetails();
    }, [block_id])
  );

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!blockDetails) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.errorText}>
          Block details not found. Please check the block ID.
        </Text>
      </View>
    );
  }

  const handleDisablePress = () => setIsDisableModalVisible(true);

  const handleConfirmDisable = async () => {
    try {
      await disableBlock(blockDetails.block_id);
      setIsDisableModalVisible(false);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error(error.message || error);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    fetchBlockDetails();
  };

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        { paddingTop: 0, paddingBottom: 110 },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Block Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailsWrapper}>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Block Name:</Text>
          <Text style={styles.detail}>{blockDetails.block_name}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Course:</Text>
          <Text style={styles.detail}>{blockDetails.course_code}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Year Level:</Text>
          <Text style={styles.detail}>{blockDetails.year_level_name}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Status:</Text>
          <Text style={styles.detail}>{blockDetails.status}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <CustomButton
            title="EDIT"
            onPress={() =>
              router.push(
                `/academicManagement/blocks/EditBlock?id=${blockDetails.block_id}`
              )
            }
          />
        </View>
        {blockDetails.status !== "Disabled" && (
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
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${blockDetails.block_name}?`}
        type="warning"
        onClose={() => setIsDisableModalVisible(false)}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Block disabled successfully!"
        type="success"
        onClose={handleSuccessModalClose}
        cancelTitle="CLOSE"
      />

      <TabsComponent />
      <StatusBar style="light" />
    </View>
  );
};

export default BlockDetails;

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
