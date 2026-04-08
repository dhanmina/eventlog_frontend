import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  fetchBlocksOfEvents,
  fetchAttendanceSummaryPerBlock,
} from "../../../../services/api/records";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomSearch from "../../../../components/CustomSearch";
import PrintFilterModal from "../../../../components/PrintFilterModal";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import CustomModal from "../../../../components/CustomModal";

const BlockList = ({
  studentListPath = "eventManagement/records/StudentsList",
  showTabs = true,
}) => {
  const { eventId } = useLocalSearchParams();
  const [eventTitle, setEventTitle] = useState("");
  const [allBlocks, setAllBlocks] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const baseBlocksRef = useRef([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "success",
    cancelTitle: "OK",
  });

  useEffect(() => {
    if (!eventId) return;
    const loadEventData = async () => {
      try {
        setLoading(true);
        setFetchError(false);
        const event_id = Number(eventId);
        if (isNaN(event_id) || event_id <= 0) return;
        const blocksData = await fetchBlocksOfEvents(event_id, "", "");
        if (!blocksData.success) throw new Error("Failed to load blocks");
        const title = blocksData.data?.event_title || "Event Title Not Found";
        setEventTitle(title);
        const mappedBlocks =
          blocksData.data?.blocks?.map((block) => ({
            ...block,
            display_name: block.course_code
              ? `${block.course_code} ${block.block_name}`
              : block.block_name,
          })) || [];
        baseBlocksRef.current = mappedBlocks;
        setAllBlocks(mappedBlocks);
        setBlocks(mappedBlocks);
        const uniqueDepartments = [
          ...new Set(mappedBlocks.map((b) => b.department_id)),
        ];
        const deptOptions = uniqueDepartments.map((deptId) => ({
          label:
            mappedBlocks.find((b) => b.department_id === deptId)
              ?.department_name || String(deptId),
          value: String(deptId),
        }));
        setDepartments([
          { label: "All Departments", value: "" },
          ...deptOptions,
        ]);
        const uniqueYearLevels = [
          ...new Set(mappedBlocks.map((b) => b.year_level_id)),
        ];
        const yearOptions = uniqueYearLevels.map((yearId) => ({
          label:
            mappedBlocks.find((b) => b.year_level_id === yearId)
              ?.year_level_name || `Year ${yearId}`,
          value: String(yearId),
        }));
        setYearLevels([
          { label: "All Year Levels", value: "" },
          ...yearOptions,
        ]);
      } catch (error) {
        setFetchError(true);
        setAllBlocks([]);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    if (!selectedDepartment && !selectedYearLevel) {
      if (baseBlocksRef.current.length > 0) {
        setAllBlocks(baseBlocksRef.current);
        setBlocks(baseBlocksRef.current);
      }
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError(false);
        const event_id = Number(eventId);
        if (isNaN(event_id) || event_id <= 0) return;
        const blocksData = await fetchBlocksOfEvents(
          event_id,
          selectedDepartment || undefined,
          selectedYearLevel || undefined,
        );
        let mappedBlocks = [];
        if (blocksData?.data?.blocks?.length > 0) {
          mappedBlocks = blocksData.data.blocks.map((block) => ({
            ...block,
            display_name: block.course_code
              ? `${block.course_code} ${block.block_name}`
              : block.block_name,
          }));
        }
        setAllBlocks(mappedBlocks);
        setBlocks(mappedBlocks);
      } catch (error) {
        setAllBlocks([]);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDepartment, selectedYearLevel, eventId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setBlocks(allBlocks);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allBlocks.filter((block) =>
      (block.display_name || "").toLowerCase().includes(lowerQuery),
    );
    setBlocks(filtered);
  }, [searchQuery, allBlocks]);

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "-";
    }
  };

  const getAttendanceCounts = (student) => {
    return {
      am_in_count: student.am_in_attended || 0,
      am_out_count: student.am_out_attended || 0,
      pm_in_count: student.pm_in_attended || 0,
      pm_out_count: student.pm_out_attended || 0,
    };
  };

  const handleSavePDF = async (filters) => {
    try {
      const { departmentIds, blockIds, yearLevelIds, attendanceFilter } =
        filters;
      const filteredBlocks = allBlocks.filter((block) => {
        const departmentMatch =
          departmentIds.length === 0 ||
          departmentIds.includes(String(block.department_id));
        const yearLevelMatch =
          yearLevelIds.length === 0 ||
          yearLevelIds.includes(String(block.year_level_id));
        const blockMatch =
          blockIds.length === 0 || blockIds.includes(String(block.block_id));
        return departmentMatch && yearLevelMatch && blockMatch;
      });

      if (filteredBlocks.length === 0) {
        setModalConfig({
          title: "No Blocks Found",
          message: "No blocks match the selected filters.",
          type: "warning",
          cancelTitle: "OK",
        });
        setModalVisible(true);
        return;
      }

      const attendanceSummaries = await Promise.all(
        filteredBlocks.map(async (block) => {
          try {
            const summary = await fetchAttendanceSummaryPerBlock(
              Number(eventId),
              block.block_id,
              attendanceFilter,
            );
            return summary;
          } catch (error) {
            return {
              data: {
                attendance_summary: [],
                available_time_periods: {
                  hasAmIn: false,
                  hasAmOut: false,
                  hasPmIn: false,
                  hasPmOut: false,
                },
                first_event_date: null,
                last_event_date: null,
              },
            };
          }
        }),
      );

      let eventStartDate = null;
      let eventEndDate = null;
      for (const summary of attendanceSummaries) {
        if (summary?.data?.first_event_date && summary?.data?.last_event_date) {
          eventStartDate = summary.data.first_event_date;
          eventEndDate = summary.data.last_event_date;
          break;
        }
      }

      let dateString = "Date not available";
      if (eventStartDate && eventEndDate) {
        const startDate = new Date(eventStartDate);
        const endDate = new Date(eventEndDate);
        const formatDate = (date) =>
          date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
        if (
          startDate.getDate() === endDate.getDate() &&
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getFullYear() === endDate.getFullYear()
        ) {
          dateString = `${formatDate(startDate)}`;
        } else if (
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getFullYear() === endDate.getFullYear()
        ) {
          dateString = `${startDate.toLocaleDateString("en-US", {
            month: "long",
          })} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
        } else {
          dateString = `${formatDate(startDate)} – ${formatDate(endDate)}`;
        }
      }

      const studentsByBlock = {};
      let globalAvailableTimePeriods = {
        hasAmIn: false,
        hasAmOut: false,
        hasPmIn: false,
        hasPmOut: false,
      };

      filteredBlocks.forEach((block, index) => {
        const summaryData = attendanceSummaries[index]?.data || {};
        const summary = summaryData.attendance_summary || [];
        const availableTimePeriods = summaryData.available_time_periods || {
          hasAmIn: false,
          hasAmOut: false,
          hasPmIn: false,
          hasPmOut: false,
        };

        globalAvailableTimePeriods.hasAmIn =
          globalAvailableTimePeriods.hasAmIn || availableTimePeriods.hasAmIn;
        globalAvailableTimePeriods.hasAmOut =
          globalAvailableTimePeriods.hasAmOut || availableTimePeriods.hasAmOut;
        globalAvailableTimePeriods.hasPmIn =
          globalAvailableTimePeriods.hasPmIn || availableTimePeriods.hasPmIn;
        globalAvailableTimePeriods.hasPmOut =
          globalAvailableTimePeriods.hasPmOut || availableTimePeriods.hasPmOut;

        const departmentName =
          departments.find((dept) => dept.value === String(block.department_id))
            ?.label || "Unknown Department";

        const blockStudents = summary.map((student) => {
          const attendanceCounts = getAttendanceCounts(student);
          return {
            id: student.student_id,
            name: student.student_name,
            block: block.display_name,
            department: departmentName,
            present: student.present_count,
            absent: student.absent_count,
            am_in: attendanceCounts.am_in_count,
            am_out: attendanceCounts.am_out_count,
            pm_in: attendanceCounts.pm_in_count,
            pm_out: attendanceCounts.pm_out_count,
            availableTimePeriods: availableTimePeriods,
          };
        });

        blockStudents.sort((a, b) => {
          const lastNameA = a.name.split(",")[0].trim().toLowerCase();
          const lastNameB = b.name.split(",")[0].trim().toLowerCase();
          return lastNameA.localeCompare(lastNameB);
        });

        studentsByBlock[block.display_name] = {
          students: blockStudents,
          availableTimePeriods: availableTimePeriods,
        };
      });

      const filterLabel =
        attendanceFilter === "all"
          ? "General List"
          : attendanceFilter === "present"
            ? "Present List"
            : "Absent List";

      const generateBlockPage = (blockName, blockData, isFirst = false) => {
        const { students, availableTimePeriods } = blockData;

        let headerColumns = `<span class="col-id">ID Number</span><span class="col-name">Name</span>`;
        if (availableTimePeriods.hasAmIn)
          headerColumns += '<span class="col-time">AM In</span>';
        if (availableTimePeriods.hasAmOut)
          headerColumns += '<span class="col-time">AM Out</span>';
        if (availableTimePeriods.hasPmIn)
          headerColumns += '<span class="col-time">PM In</span>';
        if (availableTimePeriods.hasPmOut)
          headerColumns += '<span class="col-time">PM Out</span>';
        headerColumns += `<span class="col-count">Present</span><span class="col-count">Absent</span>`;

        const studentRows =
          students.length === 0
            ? `<div class="no-records">No records found for this block.</div>`
            : students
                .map((record, i) => {
                  let rowColumns = `<span class="col-id">${record.id}</span><span class="col-name">${record.name}</span>`;
                  if (availableTimePeriods.hasAmIn)
                    rowColumns += `<span class="col-time">${record.am_in}</span>`;
                  if (availableTimePeriods.hasAmOut)
                    rowColumns += `<span class="col-time">${record.am_out}</span>`;
                  if (availableTimePeriods.hasPmIn)
                    rowColumns += `<span class="col-time">${record.pm_in}</span>`;
                  if (availableTimePeriods.hasPmOut)
                    rowColumns += `<span class="col-time">${record.pm_out}</span>`;
                  rowColumns += `<span class="col-count">${record.present}</span><span class="col-count">${record.absent}</span>`;
                  return `<div class="record-line ${i % 2 === 0 ? "row-odd" : "row-even"}">${rowColumns}</div>`;
                })
                .join("");

        const pageBreak = isFirst ? "" : `style="page-break-before: always;"`;

        return `
          <div class="page" ${pageBreak}>
            ${
              isFirst
                ? `
            <div class="header">
              <div class="brand">EVENTLOG</div>
              <div class="subtitle">Attendance Report — ${filterLabel}</div>
              <div class="generated-date">Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            <div class="event-card">
              <p class="event-name">${eventTitle}</p>
              <p><strong>Date:</strong> ${dateString}</p>
              <p><strong>Report Type:</strong> ${filterLabel}</p>
            </div>
            `
                : `
            <div class="page-mini-header">
              <span class="mini-brand">EVENTLOG</span>
              <span class="mini-meta">${eventTitle} · ${filterLabel}</span>
            </div>
            `
            }
            <div class="block-section">
              <div class="block-label">${blockName}</div>
              <div class="student-count">${students.length} student${students.length !== 1 ? "s" : ""}</div>
            </div>
            <div class="header-line">${headerColumns}</div>
            ${studentRows}
          </div>
        `;
      };

      const blockEntries = Object.entries(studentsByBlock);
      const html = `
        <html><head><meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #222; font-size: 12px; line-height: 1.5; }
            .page { padding: 40px; }
            .header { border-bottom: 3px solid #255586; padding-bottom: 20px; margin-bottom: 25px; }
            .brand { font-size: 26px; font-weight: bold; color: #255586; margin-bottom: 5px; }
            .subtitle { font-size: 13px; color: #444; margin-bottom: 6px; }
            .generated-date { font-size: 11px; color: #666; }
            .event-card { background-color: #f0f4f8; border-left: 4px solid #255586; padding: 12px 15px; margin-bottom: 20px; border-radius: 3px; }
            .event-card p { margin: 4px 0; font-size: 12px; color: #222; }
            .event-name { font-weight: bold; color: #255586; font-size: 13px; margin-bottom: 4px; }
            .page-mini-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; margin-bottom: 15px; border-bottom: 2px solid #255586; }
            .mini-brand { font-size: 15px; font-weight: bold; color: #255586; }
            .mini-meta { font-size: 11px; color: #555; }
            .block-section { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
            .block-label { font-size: 15px; font-weight: bold; color: #255586; }
            .student-count { font-size: 11px; color: #666; }
            .header-line { display: flex; font-weight: bold; background-color: #255586; color: #ffffff; padding: 9px 8px; margin-bottom: 1px; font-size: 11px; }
            .record-line { display: flex; padding: 7px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #222; }
            .row-odd { background-color: #fafafa; }
            .row-even { background-color: #ffffff; }
            .no-records { text-align: center; padding: 20px; color: #666; font-style: italic; font-size: 12px; }
            .col-id { width: 95px; padding-right: 6px; }
            .col-name { width: 180px; padding-right: 6px; }
            .col-time { width: 54px; text-align: center; }
            .col-count { width: 54px; text-align: center; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; line-height: 1.8; }
          </style>
        </head>
        <body>
          ${blockEntries
            .map(([blockName, blockData], index) =>
              generateBlockPage(blockName, blockData, index === 0),
            )
            .join("")}
          <div class="page" style="padding-top: 0;">
            <div class="footer">
              <p>This is an official attendance report generated by the EVENTLOG system.</p>
              <p>For inquiries, please contact your administrator.</p>
            </div>
          </div>
        </body></html>
      `;

      const safeEvent = eventTitle.replace(/[^a-zA-Z0-9]/g, "");
      const safeFilter = filterLabel.replace(/[^a-zA-Z0-9]/g, "");
      const pdfName = `${safeEvent}_${safeFilter}.pdf`;

      const { uri: tempUri } = await Print.printToFileAsync({ html });
      const tempFile = new File(tempUri);
      const documentsDir = new Directory(Paths.document);
      const existingFile = new File(documentsDir, pdfName);
      if (existingFile.exists) existingFile.delete();
      tempFile.move(documentsDir);
      tempFile.rename(pdfName);

      const shareResult = await Share.share({
        url: tempFile.uri,
        title: pdfName,
      });

      if (shareResult.action === Share.sharedAction) {
        setModalConfig({
          title: "Report Saved",
          message: "Your attendance report has been saved successfully.",
          type: "success",
          cancelTitle: "OK",
        });
        setModalVisible(true);
      }
    } catch (error) {
      setModalConfig({
        title: "Download Failed",
        message: `An error occurred while generating the PDF: ${error.message || "Unknown error"}`,
        type: "error",
        cancelTitle: "OK",
      });
      setModalVisible(true);
    }
  };

  const handleBlockPress = (block) => {
    router.push({
      pathname: studentListPath,
      params: { eventId: eventId, blockId: block.block_id },
    });
  };

  const handleDownloadPress = () => {
    if (allBlocks.length === 0) {
      setModalConfig({
        title: "No Blocks Available",
        message: "No blocks available to print.",
        type: "warning",
        cancelTitle: "OK",
      });
      setModalVisible(true);
      return;
    }
    setShowPrintModal(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading blocks...</Text>
        </View>
      );
    }
    if (fetchError) {
      return (
        <View style={styles.emptyState}>
          <Image source={icons.blocks} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Failed to load blocks</Text>
          <Text style={styles.emptySub}>Please try again</Text>
        </View>
      );
    }
    if (blocks.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Image source={icons.blocks} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No blocks found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? "Try a different search term"
              : "No blocks assigned to this event"}
          </Text>
        </View>
      );
    }
    return blocks.map((block, index) => (
      <TouchableOpacity
        key={index}
        style={styles.card}
        onPress={() => handleBlockPress(block)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft} />
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {block.display_name || "Unnamed Block"}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {[block.department_name, block.year_level_name]
              .filter(Boolean)
              .join("  ·  ") || "—"}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{eventTitle || "Event Blocks"}</Text>
        <Text style={styles.headerSubtitle}>Block Attendance</Text>
        {allBlocks.length > 0 && (
          <View style={styles.headerFooter}>
            <Text style={styles.headerStat}>
              {allBlocks.length} {allBlocks.length === 1 ? "Block" : "Blocks"}
            </Text>
          </View>
        )}
      </View>

      <View style={{ width: "100%" }}>
        <CustomSearch
          placeholder="Search blocks..."
          onSearch={(text) => setSearchQuery(text)}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <CustomDropdown
            placeholder="Department"
            data={departments}
            labelField="label"
            valueField="value"
            value={selectedDepartment}
            onSelect={(item) => setSelectedDepartment(item.value)}
          />
        </View>
        <View style={styles.filterItem}>
          <CustomDropdown
            placeholder="Year Level"
            data={yearLevels}
            labelField="label"
            valueField="value"
            value={selectedYearLevel}
            onSelect={(item) => setSelectedYearLevel(item.value)}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadPress}
        activeOpacity={0.8}
      >
        <Image source={icons.printer} style={styles.downloadIcon} />
        <Text style={styles.downloadText}>DOWNLOAD REPORT</Text>
      </TouchableOpacity>

      <PrintFilterModal
        visible={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={handleSavePDF}
        showDepartment={true}
        showBlock={true}
        showYearLevel={true}
        showAttendance={true}
        departments={departments.filter((dept) => dept.value !== "")}
        blocks={allBlocks}
        yearLevels={yearLevels}
      />
      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        cancelTitle={modalConfig.cancelTitle}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
};

export default BlockList;

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
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.small,
    marginTop: theme.spacing.small,
    width: "100%",
  },
  filterItem: {
    flex: 1,
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
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    height: 50,
    width: "100%",
    gap: theme.spacing.small,
    marginTop: theme.spacing.small,
    marginBottom: 96,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  downloadIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.secondary,
  },
  downloadText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
});
