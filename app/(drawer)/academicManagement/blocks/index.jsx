import React, { useState, useCallback } from "react";
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
import { fetchBlocks, disableBlock } from "../../../../services/api/blocks";
import { router, useFocusEffect } from "expo-router";

import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function BlocksScreen() {
  const [blocks, setBlocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [blockToDisable, setBlockToDisable] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBlocks = async () => {
    try {
      const fetchedBlocks = await fetchBlocks();
      if (!Array.isArray(fetchedBlocks)) return;
      setBlocks(fetchedBlocks);
    } catch (err) {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadBlocks();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBlocks();
    }, [])
  );

  const filteredBlocks = Array.isArray(blocks)
    ? blocks
        .filter((block) => block.status !== "Archived")
        .filter((block) => {
          const name = block.block_name?.toLowerCase() || "";
          const courseName = block.course_name?.toLowerCase() || "";
          const query = searchQuery.toLowerCase();
          return name.includes(query) || courseName.includes(query);
        })
    : [];

  const handleDisablePress = (block) => {
    setBlockToDisable(block);
    setIsDisableModalVisible(true);
  };

  const handleDisableModalClose = () => {
    setIsDisableModalVisible(false);
    setBlockToDisable(null);
  };

  const handleConfirmDisable = async () => {
    if (!blockToDisable) return;

    try {
      await disableBlock(blockToDisable.block_id);
      setBlocks((prevBlocks) =>
        prevBlocks.map((block) =>
          block.block_id === blockToDisable.block_id
            ? { ...block, status: "Disabled" }
            : block
        )
      );
      setIsDisableModalVisible(false);
      setIsSuccessModalVisible(true);
    } catch (error) {}
  };

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <Text style={styles.headerText}>BLOCKS</Text>
      <View style={{ paddingHorizontal: theme.spacing.medium, width: "100%" }}>
        <SearchBar
          placeholder="Search blocks..."
          onSearch={(query) => setSearchQuery(query)}
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
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => (
            <TouchableOpacity
              key={block.block_id}
              style={styles.blockContainer}
              onPress={() =>
                router.push(
                  `/academicManagement/blocks/BlockDetails?id=${block.block_id}`
                )
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {`${block.course_code || ""} ${block.block_name || ""}`.trim()}
                </Text>
                <Text style={styles.courseName} numberOfLines={1}>
                  {block.status}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/academicManagement/blocks/EditBlock?id=${block.block_id}`
                    )
                  }
                >
                  <Image source={icons.edit} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDisablePress(block)}
                  disabled={block.status === "Disabled"}
                  style={{ opacity: block.status === "Disabled" ? 0.5 : 1 }}
                >
                  <Image source={icons.disabled} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No blocks found</Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD BLOCK"
          onPress={() => router.push("/academicManagement/blocks/AddBlock")}
        />
      </View>

      <CustomModal
        visible={isDisableModalVisible}
        title="Confirm Disable"
        message={`Are you sure you want to disable ${
          blockToDisable?.block_name
            ? `${blockToDisable.course_code || ""} ${blockToDisable.block_name}`
            : ""
        }?`}
        type="warning"
        onClose={handleDisableModalClose}
        onConfirm={handleConfirmDisable}
        cancelTitle="Cancel"
        confirmTitle="Disable"
      />

      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message="Block disabled successfully!"
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
  blockContainer: {
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
  courseName: {
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