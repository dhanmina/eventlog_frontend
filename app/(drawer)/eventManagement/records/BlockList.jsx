import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  fetchBlocksOfEvents,
  fetchAttendanceSummaryPerBlock,
} from "../../../../services/api/records";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomButton from "../../../../components/CustomButton";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomSearch from "../../../../components/CustomSearch";
import PrintFilterModal from "../../../../components/PrintFilterModal";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import CustomModal from "../../../../components/CustomModal";
import TabsComponent from "../../../../components/TabsComponent";

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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
        const event_id = Number(eventId);
        const blocksData = await fetchBlocksOfEvents(event_id, "", "");
        if (!blocksData.success) throw new Error("Failed to load blocks");
        const eventTitle =
          blocksData.data?.event_title || "Event Title Not Found";
        setEventTitle(eventTitle);
        const mappedBlocks =
          blocksData.data?.blocks?.map((block) => ({
            ...block,
            display_name: block.course_code
              ? `${block.course_code} ${block.block_name}`
              : block.block_name,
          })) || [];
        setAllBlocks(mappedBlocks);
        setBlocks(mappedBlocks);
        const uniqueDepartments = [
          ...new Set(mappedBlocks.map((b) => b.department_id)),
        ];
        const deptOptions = uniqueDepartments.map((deptId) => ({
          label: mappedBlocks.find((b) => b.department_id === deptId)
            ?.course_code,
          value: String(deptId),
        }));
        const departmentsWithAll = [
          { label: "All Departments", value: "" },
          ...deptOptions,
        ];
        setDepartments(departmentsWithAll);
        const uniqueYearLevels = [
          ...new Set(mappedBlocks.map((b) => b.year_level_id)),
        ];
        const yearOptions = uniqueYearLevels.map((yearId) => ({
          label: `Year ${yearId}`,
          value: String(yearId),
        }));
        setYearLevels(yearOptions);
      } catch (error) {
        setAllBlocks([]);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (!eventId || (!selectedDepartment && !selectedYearLevel)) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const event_id = Number(eventId);
        const blocksData = await fetchBlocksOfEvents(
          event_id,
          selectedDepartment || undefined,
          selectedYearLevel || undefined
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
      (block.display_name || "").toLowerCase().includes(lowerQuery)
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
              attendanceFilter
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
        })
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

      const generateBlockPage = (blockName, blockData, isFirst = false) => {
        const { students, availableTimePeriods } = blockData;

        let headerColumns = `
          <span class="col-id">ID Number</span>
          <span class="col-name">Name</span>
        `;
        if (availableTimePeriods.hasAmIn) {
          headerColumns += '<span class="col-time">AM In</span>';
        }
        if (availableTimePeriods.hasAmOut) {
          headerColumns += '<span class="col-time">AM Out</span>';
        }
        if (availableTimePeriods.hasPmIn) {
          headerColumns += '<span class="col-time">PM In</span>';
        }
        if (availableTimePeriods.hasPmOut) {
          headerColumns += '<span class="col-time">PM Out</span>';
        }
        headerColumns += `
          <span class="col-count">Present</span>
          <span class="col-count">Absent</span>
        `;

        const studentRows =
          students.length === 0
            ? `<div style="text-align: center; margin-top: 20px; font-style: italic; color: #666;">
               No records
             </div>`
            : students
                .map((record) => {
                  let rowColumns = `
                <span class="col-id">${record.id}</span>
                <span class="col-name">${record.name}</span>
              `;
                  if (availableTimePeriods.hasAmIn) {
                    rowColumns += `<span class="col-time">${record.am_in}</span>`;
                  }
                  if (availableTimePeriods.hasAmOut) {
                    rowColumns += `<span class="col-time">${record.am_out}</span>`;
                  }
                  if (availableTimePeriods.hasPmIn) {
                    rowColumns += `<span class="col-time">${record.pm_in}</span>`;
                  }
                  if (availableTimePeriods.hasPmOut) {
                    rowColumns += `<span class="col-time">${record.pm_out}</span>`;
                  }
                  rowColumns += `
                <span class="col-count">${record.present}</span>
                <span class="col-count">${record.absent}</span>
              `;
                  return `<div class="record-line">${rowColumns}</div>`;
                })
                .join("");

        return `
          <div style="${
            isFirst
              ? "padding-top: 10px;"
              : "page-break-before: always; padding-top: 10px;"
          }">
            <h2 style="color: black; text-align: left; margin-bottom: 3px;">${eventTitle}</h2>
            <h3 style="color: black; text-align: left; margin-bottom: 3px;">${
              attendanceFilter === "all"
                ? "General List"
                : attendanceFilter === "present"
                ? "Present List"
                : "Absent List"
            }</h3>
            <h4 style="color: black; text-align: left; margin-bottom: 3px;">Date: ${dateString}</h4>
            <h3 style="color: black; text-align: left; margin-bottom: 10px;">${blockName}</h3>
            <div class="header-line">
              ${headerColumns}
            </div>
            ${studentRows}
          </div>
        `;
      };

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 0px 20px 20px 20px; 
                color: black;
                font-size: 11px;
              }
              h1, h2, h3 { 
                color: black; 
                text-align: center;
              }
              .header-line {
                color: black;
                font-weight: bold;
                margin-bottom: 10px;
                display: flex;
              }
              .record-line {
                color: black;
                margin-bottom: 2px;
                display: flex;
              }
              .col-id { width: 90px; }
              .col-name { width: 200px; }
              .col-time { width: 55px; text-align: center; font-size: 11px; }
              .col-count { width: 55px; text-align: center; }
            </style>
          </head>
          <body>
            ${Object.entries(studentsByBlock)
              .map(([blockName, blockData], index) =>
                generateBlockPage(blockName, blockData, index === 0)
              )
              .join("")}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const filterName =
        attendanceFilter === "all"
          ? "General List"
          : attendanceFilter === "present"
          ? "Present List"
          : "Absent List";
      const pdfName = `${eventTitle} - ${filterName}.pdf`;
      const pdfPath = `${FileSystem.documentDirectory}${pdfName}`;
      await FileSystem.moveAsync({ from: uri, to: pdfPath });
      await Sharing.shareAsync(pdfPath, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
      setModalConfig({
        title: "Download Successful",
        message: "Your attendance record has been downloaded successfully.",
        type: "success",
        cancelTitle: "OK",
      });
      setModalVisible(true);
    } catch (error) {
      setModalConfig({
        title: "Download Failed",
        message: "An error occurred while generating the PDF.",
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

  return (
    <View style={globalStyles.secondaryContainer}>
      <Text style={styles.eventTitle}>{eventTitle}</Text>
      <View style={styles.container}>
        <CustomSearch
          placeholder="Search blocks..."
          onSearch={(text) => setSearchQuery(text)}
        />
      </View>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <View style={{ width: "48%" }}>
            <CustomDropdown
              placeholder="Department"
              data={departments}
              labelField="label"
              valueField="value"
              value={selectedDepartment}
              onSelect={(item) => setSelectedDepartment(item.value)}
            />
          </View>
          <View style={{ width: "48%" }}>
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
      </View>
      <ScrollView contentContainerStyle={styles.scrollviewContainer}>
        {loading ? (
          <Text style={styles.noDataText}>Loading blocks...</Text>
        ) : blocks.length === 0 && searchQuery !== "" ? (
          <Text style={styles.noDataText}>No matching blocks found.</Text>
        ) : blocks.length === 0 ? (
          <Text style={styles.noDataText}>No blocks found.</Text>
        ) : (
          <View style={styles.gridContainer}>
            {blocks.map((block, index) => (
              <View
                key={index}
                style={
                  blocks.length === 1
                    ? styles.singleBlockContainer
                    : styles.multiBlockContainer
                }
              >
                <TouchableOpacity
                  style={styles.blockContainer}
                  onPress={() => handleBlockPress(block)}
                >
                  <Text style={styles.blockText}>
                    {block.display_name || "Unnamed Block"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton title="Download" onPress={handleDownloadPress} />
      </View>
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
      {showTabs && <TabsComponent />}
    </View>
  );
};

export default BlockList;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: theme.spacing.medium,
    alignItems: "center",
  },
  eventTitle: {
    fontSize: theme.fontSizes.huge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    marginVertical: theme.spacing.medium,
  },
  filterContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.medium,
  },
  scrollviewContainer: {
    paddingHorizontal: theme.spacing.medium,
    flexGrow: 1,
  },
  blockText: {
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
    textAlign: "center",
  },
  blockContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  singleBlockContainer: {
    width: "100%",
    marginVertical: theme.spacing.small,
  },
  multiBlockContainer: {
    width: "48%",
    marginVertical: theme.spacing.small,
  },
  noDataText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  buttonContainer: {
    width: "100%",
    marginVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
  },
});
