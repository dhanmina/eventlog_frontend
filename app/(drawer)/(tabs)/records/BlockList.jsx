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
} from "../../../../services/api/attendance";
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

const INITIAL_MODAL_CONFIG = {
  title: "",
  message: "",
  type: "success",
  cancelTitle: "OK",
};

const DEFAULT_TIME_PERIODS = {
  hasAmIn: false,
  hasAmOut: false,
  hasPmIn: false,
  hasPmOut: false,
};

const EMPTY_ATTENDANCE_SUMMARY = {
  data: {
    attendance_summary: [],
    available_time_periods: DEFAULT_TIME_PERIODS,
    first_event_date: null,
    last_event_date: null,
  },
};

const ALL_DEPARTMENTS_OPTION = { label: "All Departments", value: "" };

const ATTENDANCE_FILTER_LABELS = {
  all: "General List",
  present: "Present List",
};

const getBlockDisplayName = (block) =>
  block.course_code ? `${block.course_code} ${block.block_name}` : block.block_name;

const mapBlocks = (blocks = []) =>
  blocks.map((block) => ({
    ...block,
    display_name: getBlockDisplayName(block),
  }));

const buildDepartmentOptions = (mappedBlocks) => {
  const uniqueDepartments = [
    ...new Set(mappedBlocks.map((block) => block.department_id)),
  ];

  const departmentOptions = uniqueDepartments.map((departmentId) => ({
    label: mappedBlocks.find((block) => block.department_id === departmentId)
      ?.course_code,
    value: String(departmentId),
  }));

  return [ALL_DEPARTMENTS_OPTION, ...departmentOptions];
};

const buildYearLevelOptions = (mappedBlocks) => {
  const uniqueYearLevels = [
    ...new Set(mappedBlocks.map((block) => block.year_level_id)),
  ];

  return uniqueYearLevels.map((yearId) => ({
    label: `Year ${yearId}`,
    value: String(yearId),
  }));
};

const filterBlocksForPrint = (blocks, filters) => {
  const { departmentIds, blockIds, yearLevelIds } = filters;

  return blocks.filter((block) => {
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
};

const getAttendanceCounts = (student) => ({
  am_in_count: student.am_in_attended || 0,
  am_out_count: student.am_out_attended || 0,
  pm_in_count: student.pm_in_attended || 0,
  pm_out_count: student.pm_out_attended || 0,
});

const getAttendanceFilterLabel = (attendanceFilter) =>
  ATTENDANCE_FILTER_LABELS[attendanceFilter] || "Absent List";

const formatEventDateRange = (eventStartDate, eventEndDate) => {
  if (!eventStartDate || !eventEndDate) return "Date not available";

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
    return `${formatDate(startDate)}`;
  }

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.toLocaleDateString("en-US", {
      month: "long",
    })} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
};

const buildHeaderColumns = (availableTimePeriods) => {
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

  return `${headerColumns}
    <span class="col-count">Present</span>
    <span class="col-count">Absent</span>
  `;
};

const buildStudentRows = (students, availableTimePeriods) => {
  if (students.length === 0) {
    return `<div style="text-align: center; margin-top: 20px; font-style: italic; color: #666;">
       No records
     </div>`;
  }

  return students
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
};

const buildBlockPage = ({
  blockName,
  blockData,
  dateString,
  eventTitle,
  attendanceFilter,
  isFirst = false,
}) => {
  const { students, availableTimePeriods } = blockData;

  return `
    <div style="${
      isFirst
        ? "padding-top: 10px;"
        : "page-break-before: always; padding-top: 10px;"
    }">
      <h2 style="color: black; text-align: left; margin-bottom: 3px;">${eventTitle}</h2>
      <h3 style="color: black; text-align: left; margin-bottom: 3px;">${getAttendanceFilterLabel(
        attendanceFilter
      )}</h3>
      <h4 style="color: black; text-align: left; margin-bottom: 3px;">Date: ${dateString}</h4>
      <h3 style="color: black; text-align: left; margin-bottom: 10px;">${blockName}</h3>
      <div class="header-line">
        ${buildHeaderColumns(availableTimePeriods)}
      </div>
      ${buildStudentRows(students, availableTimePeriods)}
    </div>
  `;
};

const buildPdfHtml = ({
  studentsByBlock,
  dateString,
  eventTitle,
  attendanceFilter,
}) => `
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
          buildBlockPage({
            blockName,
            blockData,
            dateString,
            eventTitle,
            attendanceFilter,
            isFirst: index === 0,
          })
        )
        .join("")}
    </body>
  </html>
`;

const BlockList = () => {
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
  const [modalConfig, setModalConfig] = useState(INITIAL_MODAL_CONFIG);

  const showModal = (config) => {
    setModalConfig({ ...INITIAL_MODAL_CONFIG, ...config });
    setModalVisible(true);
  };

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
        const mappedBlocks = mapBlocks(blocksData.data?.blocks);
        setAllBlocks(mappedBlocks);
        setBlocks(mappedBlocks);
        setDepartments(buildDepartmentOptions(mappedBlocks));
        setYearLevels(buildYearLevelOptions(mappedBlocks));
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
        const mappedBlocks = mapBlocks(blocksData?.data?.blocks);
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

  const handleSavePDF = async (filters) => {
    try {
      const { attendanceFilter } = filters;
      const filteredBlocks = filterBlocksForPrint(allBlocks, filters);

      if (filteredBlocks.length === 0) {
        showModal({
          title: "No Blocks Found",
          message: "No blocks match the selected filters.",
          type: "warning",
        });
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
            return EMPTY_ATTENDANCE_SUMMARY;
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

      const dateString = formatEventDateRange(eventStartDate, eventEndDate);

      const studentsByBlock = {};

      filteredBlocks.forEach((block, index) => {
        const summaryData = attendanceSummaries[index]?.data || {};
        const summary = summaryData.attendance_summary || [];
        const availableTimePeriods =
          summaryData.available_time_periods || DEFAULT_TIME_PERIODS;

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

      const html = buildPdfHtml({
        studentsByBlock,
        dateString,
        eventTitle,
        attendanceFilter,
      });

      const { uri } = await Print.printToFileAsync({ html });
      const filterName = getAttendanceFilterLabel(attendanceFilter);
      const pdfName = `${eventTitle} - ${filterName}.pdf`;
      const pdfPath = `${FileSystem.documentDirectory}${pdfName}`;
      await FileSystem.moveAsync({ from: uri, to: pdfPath });
      await Sharing.shareAsync(pdfPath, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
      showModal({
        title: "Download Successful",
        message: "Your attendance record has been downloaded successfully.",
        type: "success",
      });
    } catch (error) {
      showModal({
        title: "Download Failed",
        message: "An error occurred while generating the PDF.",
        type: "error",
      });
    }
  };

  const handleBlockPress = (block) => {
    router.push({
      pathname: "/records/StudentsList",
      params: { eventId: eventId, blockId: block.block_id },
    });
  };

  const handleDownloadPress = () => {
    if (allBlocks.length === 0) {
      showModal({
        title: "No Blocks Available",
        message: "No blocks available to print.",
        type: "warning",
      });
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
          <View style={styles.filterDropdown}>
            <CustomDropdown
              placeholder="Department"
              data={departments}
              labelField="label"
              valueField="value"
              value={selectedDepartment}
              onSelect={(item) => setSelectedDepartment(item.value)}
            />
          </View>
          <View style={styles.filterDropdown}>
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
  filterDropdown: {
    width: "48%",
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
    marginVertical: 20,
    paddingHorizontal: theme.spacing.medium,
  },
});
