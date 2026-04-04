import { useState, useCallback } from "react";
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
import { fetchBlocks, disableBlock, enableBlock } from "../../../../services/api/blocks";
import icons from "../../../../constants/icons";
import SearchBar from "../../../../components/CustomSearch";
import CustomModal from "../../../../components/CustomModal";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";

export default function BlocksScreen() {
  const [blocks, setBlocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [blockToToggle, setBlockToToggle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBlocks = async () => {
    try {
      const fetchedBlocks = await fetchBlocks();
      if (!Array.isArray(fetchedBlocks)) return;
      setBlocks(fetchedBlocks);
    } catch {}
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadBlocks();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadBlocks(); }, []));

  const visibleBlocks = Array.isArray(blocks)
    ? blocks.filter((b) => b.status !== "Archived")
    : [];

  const filteredBlocks = visibleBlocks.filter((b) => {
    const name = b.block_name?.toLowerCase() || "";
    const course = b.course_name?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || course.includes(q);
  });

  const activeCount = visibleBlocks.filter((b) => b.status === "Active").length;
  const disabledCount = visibleBlocks.filter((b) => b.status === "Disabled").length;

  const handleTogglePress = (block) => {
    setBlockToToggle(block);
    setIsToggleModalVisible(true);
  };

  const handleToggleModalClose = () => {
    setIsToggleModalVisible(false);
    setBlockToToggle(null);
  };

  const handleConfirmToggle = async () => {
    if (!blockToToggle) return;
    const isDisabled = blockToToggle.status === "Disabled";
    try {
      if (isDisabled) {
        await enableBlock(blockToToggle.block_id);
      } else {
        await disableBlock(blockToToggle.block_id);
      }
      setBlocks((prev) =>
        prev.map((b) =>
          b.block_id === blockToToggle.block_id
            ? { ...b, status: isDisabled ? "Active" : "Disabled" }
            : b
        )
      );
      setIsToggleModalVisible(false);
      setSuccessMessage(`Block ${isDisabled ? "enabled" : "disabled"} successfully!`);
      setIsSuccessModalVisible(true);
    } catch {}
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={isToggleModalVisible}
        title={blockToToggle?.status === "Disabled" ? "Enable Block" : "Disable Block"}
        message={`Are you sure you want to ${blockToToggle?.status === "Disabled" ? "enable" : "disable"} ${
          blockToToggle ? `${blockToToggle.course_code || ""} ${blockToToggle.block_name}`.trim() : ""
        }?`}
        type="warning"
        onClose={handleToggleModalClose}
        onConfirm={handleConfirmToggle}
        cancelTitle="Cancel"
        confirmTitle={blockToToggle?.status === "Disabled" ? "Enable" : "Disable"}
      />
      <CustomModal
        visible={isSuccessModalVisible}
        title="Success"
        message={successMessage}
        type="success"
        onClose={() => setIsSuccessModalVisible(false)}
        cancelTitle="CLOSE"
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>BLOCKS</Text>
        <Text style={styles.headerSubtitle}>Manage sections per course and year level</Text>
        {visibleBlocks.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>{activeCount} Active</Text>
            <Text style={styles.headerStatDivider}>·</Text>
            <Text style={styles.headerStat}>{disabledCount} Disabled</Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <SearchBar
          placeholder="Search blocks..."
          onSearch={(q) => setSearchQuery(q)}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => {
            const isDisabled = block.status === "Disabled";
            return (
              <TouchableOpacity
                key={block.block_id}
                style={styles.card}
                onPress={() =>
                  router.push(`/academicManagement/blocks/BlockDetails?id=${block.block_id}`)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.cardLeft, isDisabled && styles.cardLeftDisabled]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {`${block.course_code || ""} ${block.block_name || ""}`.trim()}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {block.course_name || ""}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      router.push(`/academicManagement/blocks/EditBlock?id=${block.block_id}`)
                    }
                  >
                    <Image source={icons.edit} style={styles.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleTogglePress(block)}
                  >
                    <Image
                      source={isDisabled ? icons.check : icons.disabled}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Image source={icons.blocks} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No blocks found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search term" : "Add a block to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="ADD BLOCK"
          onPress={() => router.push("/academicManagement/blocks/AddBlock")}
        />
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
