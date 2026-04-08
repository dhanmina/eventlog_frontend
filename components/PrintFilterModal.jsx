import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import CustomButton from "../components/CustomButton";
import theme from "../constants/theme";
import icons from "../constants/icons";
import CustomDropdown from "../components/CustomDropdown";

const PrintFilterModal = ({
  visible,
  onClose,
  onPrint,
  showDepartment = false,
  showBlock = false,
  showYearLevel = false,
  showAttendance = false,
  departments = [],
  blocks = [],
  yearLevels = [],
  title = "Download Report",
}) => {
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState("all");
  const [filteredBlocks, setFilteredBlocks] = useState(blocks);

  const attendanceOptions = [
    { label: "All Students", value: "all" },
    { label: "Present Only", value: "present" },
    { label: "Absent Only", value: "absent" },
  ];

  useEffect(() => {
    if (visible) {
      setSelectedDepartments([]);
      setSelectedBlocks([]);
      setSelectedYearLevels([]);
      setSelectedAttendance("all");
    }
  }, [visible]);

  useEffect(() => {
    let filtered = [...blocks];
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((block) =>
        selectedDepartments.includes(String(block.department_id))
      );
    }
    if (selectedYearLevels.length > 0) {
      filtered = filtered.filter((block) =>
        selectedYearLevels.includes(String(block.year_level_id))
      );
    }
    setFilteredBlocks(filtered);
    setSelectedBlocks([]);
  }, [selectedDepartments, selectedYearLevels, blocks]);

  const canDownload = blocks.length > 0 && selectedBlocks.length > 0;

  const handlePrint = () => {
    if (!canDownload) return;
    const filters = {
      departmentIds: selectedDepartments,
      blockIds: selectedBlocks,
      yearLevelIds: selectedYearLevels,
      attendanceFilter: selectedAttendance,
    };
    onPrint(filters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handleBar} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>Select filters for export</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Image source={icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {showDepartment && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Department</Text>
                <CustomDropdown
                  placeholder="Select departments"
                  data={departments}
                  value={selectedDepartments}
                  onSelect={setSelectedDepartments}
                  multiSelect
                />
              </View>
            )}

            {showYearLevel && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Year Level</Text>
                <CustomDropdown
                  placeholder="Select year levels"
                  data={yearLevels}
                  value={selectedYearLevels}
                  onSelect={setSelectedYearLevels}
                  multiSelect
                />
              </View>
            )}

            {showBlock && (
              <View style={styles.filterSection}>
                <View style={styles.filterLabelRow}>
                  <Text style={styles.filterLabel}>Blocks</Text>
                  {selectedBlocks.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {selectedBlocks.length} selected
                      </Text>
                    </View>
                  )}
                </View>
                <CustomDropdown
                  placeholder="Select blocks"
                  data={filteredBlocks.map((block) => ({
                    label: block.display_name,
                    value: String(block.block_id),
                  }))}
                  value={selectedBlocks}
                  onSelect={setSelectedBlocks}
                  multiSelect
                />
                {showBlock && selectedBlocks.length === 0 && (
                  <Text style={styles.hintText}>
                    Select at least one block to download
                  </Text>
                )}
              </View>
            )}

            {showAttendance && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Attendance Filter</Text>
                <CustomDropdown
                  placeholder="Select attendance status"
                  data={attendanceOptions}
                  value={selectedAttendance}
                  onSelect={(item) => {
                    if (item && item.value) {
                      setSelectedAttendance(item.value);
                    } else if (typeof item === "string") {
                      setSelectedAttendance(item);
                    } else if (Array.isArray(item) && item.length > 0) {
                      setSelectedAttendance(item[0]);
                    }
                  }}
                  multiSelect={false}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <CustomButton
              title={Platform.OS === "web" ? "PRINT" : "DOWNLOAD"}
              onPress={handlePrint}
              disabled={!canDownload}
            />
            <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default PrintFilterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.secondary,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.2,
    alignSelf: "center",
    marginTop: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.medium,
    paddingBottom: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37,85,134,0.08)",
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.primary,
  },
  sheetSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.small,
    marginTop: 2,
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
    opacity: 0.4,
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
    paddingBottom: theme.spacing.small,
    gap: theme.spacing.medium,
  },
  filterSection: {
    gap: theme.spacing.xsmall,
  },
  filterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
  },
  filterLabel: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
  },
  hintText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.4,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
    gap: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(37,85,134,0.08)",
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: theme.spacing.small,
  },
  cancelText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.5,
  },
});
