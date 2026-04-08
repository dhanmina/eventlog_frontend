import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Platform,
  Share,
  TouchableOpacity,
} from "react-native";
import theme from "../../../../constants/theme";
import globalStyles from "../../../../constants/globalStyles";
import icons from "../../../../constants/icons";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import CustomModal from "../../../../components/CustomModal";
import { fetchStudentAttendanceByEventAndBlock } from "../../../../services/api/records";
import { getStudentAttSummary } from "../../../../services/api/records";

const SessionLog = ({ label, data, sessionType = "am" }) => {
  const now = moment.now();

  const isAttendanceTimePassed = (time) => {
    try {
      if (!time) return false;
      const dateStr = data.date;
      if (!dateStr) return false;
      const timeMoment = moment(`${dateStr}T${time}`, "YYYY-MM-DDTHH:mm:ss");
      return timeMoment.isSameOrBefore(now);
    } catch (error) {
      return false;
    }
  };

  const renderAttendanceIcon = (time, attendance) => {
    try {
      if (isAttendanceTimePassed(time)) {
        const iconSource = attendance ? icons.present : icons.absent;
        const iconTint = attendance ? theme.colors.green : "#C62828";
        return (
          <Image
            source={iconSource}
            style={[styles.sessionIcon, { tintColor: iconTint }]}
          />
        );
      }
      return <View style={styles.sessionIconPlaceholder} />;
    } catch (error) {
      return <View style={styles.sessionIconPlaceholder} />;
    }
  };

  const timeInKey = sessionType === "am" ? "am_in" : "pm_in";
  const timeOutKey = sessionType === "am" ? "am_out" : "pm_out";

  const scheduleTimeIn = data?.schedule?.[timeInKey];
  const scheduleTimeOut = data?.schedule?.[timeOutKey];
  const attendanceTimeIn = data?.attendance?.[timeInKey];
  const attendanceTimeOut = data?.attendance?.[timeOutKey];

  if (!scheduleTimeIn && !scheduleTimeOut) return null;

  return (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionLabel}>{label}</Text>
      <View style={styles.sessionChecks}>
        <View style={styles.checkItem}>
          <Text style={styles.checkLabel}>In</Text>
          {renderAttendanceIcon(scheduleTimeIn, attendanceTimeIn)}
        </View>
        <View style={styles.checkItem}>
          <Text style={styles.checkLabel}>Out</Text>
          {renderAttendanceIcon(scheduleTimeOut, attendanceTimeOut)}
        </View>
      </View>
    </View>
  );
};

const Attendance = () => {
  const [attendanceDataList, setAttendanceDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const { eventId, blockId, studentId } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "success",
    cancelTitle: "OK",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchStudentAttendanceByEventAndBlock(
          eventId,
          blockId,
          studentId
        );
        if (response.success) {
          const { data } = response;
          const student = data.students.find((s) => s.student_id === studentId);
          if (student) {
            setEventName(data.event_name);
            setStudentDetails({
              name: student.name,
              id: student.student_id,
              courseBlock: `${data.course_code} ${data.block_name}`,
            });
            setAttendanceDataList(student.dates);
          } else {
            setEventName("");
            setStudentDetails(null);
            setAttendanceDataList([]);
          }
        } else {
          setEventName("");
          setStudentDetails(null);
          setAttendanceDataList([]);
        }
      } catch (error) {
        setEventName("");
        setStudentDetails(null);
        setAttendanceDataList([]);
      } finally {
        setLoading(false);
      }
    };
    if (eventId && blockId && studentId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [eventId, blockId, studentId]);

  const handlePrint = async () => {
    try {
      const response = await getStudentAttSummary(eventId, studentId);
      if (!response?.success || !response.data) {
        throw new Error("Failed to fetch student data for PDF generation.");
      }

      const {
        event_name,
        student_id,
        student_name,
        attendance_summary,
        available_time_periods = {},
      } = response.data;

      let tableHeaders = `<span class="col-date">Date</span>`;
      if (available_time_periods.hasAmIn) {
        tableHeaders += '<span class="col-time">AM In</span>';
      }
      if (available_time_periods.hasAmOut) {
        tableHeaders += '<span class="col-time">AM Out</span>';
      }
      if (available_time_periods.hasPmIn) {
        tableHeaders += '<span class="col-time">PM In</span>';
      }
      if (available_time_periods.hasPmOut) {
        tableHeaders += '<span class="col-time">PM Out</span>';
      }
      tableHeaders += `
        <span class="col-count">Present</span>
        <span class="col-count">Absent</span>
      `;

      const tableRows = Object.entries(attendance_summary || {})
        .map(([date, summary]) => {
          let rowColumns = `<span class="col-date">${moment(date).format(
            "MMMM D, YYYY"
          )}</span>`;
          if (available_time_periods.hasAmIn) {
            rowColumns += `<span class="col-time">${
              summary.am_in_attended || 0
            }</span>`;
          }
          if (available_time_periods.hasAmOut) {
            rowColumns += `<span class="col-time">${
              summary.am_out_attended || 0
            }</span>`;
          }
          if (available_time_periods.hasPmIn) {
            rowColumns += `<span class="col-time">${
              summary.pm_in_attended || 0
            }</span>`;
          }
          if (available_time_periods.hasPmOut) {
            rowColumns += `<span class="col-time">${
              summary.pm_out_attended || 0
            }</span>`;
          }
          rowColumns += `
            <span class="col-count">${summary.present_count}</span>
            <span class="col-count">${summary.absent_count}</span>
          `;
          return `<div class="record-line">${rowColumns}</div>`;
        })
        .join("");

      const htmlContent = `
        <html><head><meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #222; font-size: 12px; line-height: 1.5; }
            .container { padding: 40px; }
            .header { border-bottom: 3px solid #255586; padding-bottom: 20px; margin-bottom: 25px; }
            .brand { font-size: 26px; font-weight: bold; color: #255586; margin-bottom: 5px; }
            .subtitle { font-size: 13px; color: #444; margin-bottom: 6px; }
            .generated-date { font-size: 11px; color: #666; }
            .info-card { background-color: #f0f4f8; border-left: 4px solid #255586; padding: 12px 15px; margin-bottom: 20px; border-radius: 3px; }
            .info-card p { margin: 4px 0; font-size: 12px; color: #222; }
            .info-name { font-weight: bold; color: #255586; font-size: 13px; margin-bottom: 4px; }
            .table-section { margin-top: 20px; }
            .table-label { font-size: 13px; font-weight: bold; color: #255586; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #e0e0e0; }
            .header-line { display: flex; font-weight: bold; background-color: #255586; color: #ffffff; padding: 9px 8px; margin-bottom: 1px; font-size: 11px; }
            .record-line { display: flex; padding: 7px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #222; background-color: #fafafa; }
            .record-line:nth-child(even) { background-color: #ffffff; }
            .col-date { width: 130px; text-align: left; padding-right: 10px; }
            .col-time { width: 62px; text-align: center; }
            .col-count { width: 62px; text-align: center; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; line-height: 1.8; }
          </style>
        </head>
        <body><div class="container">
          <div class="header">
            <div class="brand">EVENTLOG</div>
            <div class="subtitle">Individual Attendance Report</div>
            <div class="generated-date">Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
          <div class="info-card">
            <p class="info-name">${student_name || "N/A"}</p>
            <p><strong>Student ID:</strong> ${student_id || "N/A"}</p>
            <p><strong>Event:</strong> ${event_name || "Unknown Event"}</p>
            <p><strong>Course / Block:</strong> ${studentDetails?.courseBlock || "N/A"}</p>
          </div>
          <div class="table-section">
            <div class="table-label">Attendance Details</div>
            <div class="header-line">${tableHeaders}</div>
            ${tableRows}
          </div>
          <div class="footer">
            <p>This is an official attendance report generated by the EVENTLOG system.</p>
            <p>For inquiries, please contact your administrator.</p>
          </div>
        </div></body></html>
      `;

      const safeName = (student_name || "Student").replace(/[^a-zA-Z0-9]/g, "");
      const safeEvent = (event_name || "Event").replace(/[^a-zA-Z0-9]/g, "");
      const pdfName = `${safeName}_${safeEvent}.pdf`;

      const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
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

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!eventName || !studentDetails || attendanceDataList.length === 0) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <View style={styles.emptyState}>
          <Image source={icons.calendarStar} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No attendance data</Text>
          <Text style={styles.emptySub}>No records available for this student</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{eventName}</Text>
        <Text style={styles.headerSubtitle}>Attendance Report</Text>
        <View style={styles.headerFooter}>
          <Text style={styles.headerStat} numberOfLines={1}>
            {studentDetails.name}
          </Text>
          <Text style={styles.headerStatDivider}>·</Text>
          <Text style={styles.headerStat} numberOfLines={1}>
            {studentDetails.courseBlock}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        {attendanceDataList.map((attendanceData, index) => {
          const sessionData = {
            date: attendanceData.date,
            schedule: attendanceData.schedule,
            attendance: attendanceData.attendance,
          };
          const hasAM =
            attendanceData.schedule?.am_in && attendanceData.schedule?.am_out;
          const hasPM =
            attendanceData.schedule?.pm_in && attendanceData.schedule?.pm_out;

          return (
            <View key={index} style={styles.dateCard}>
              <View style={styles.dateHeader}>
                <Image source={icons.calendar} style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {moment(attendanceData.date).format("MMMM D, YYYY")}
                </Text>
              </View>
              <View style={styles.sessionsBody}>
                {hasAM && (
                  <SessionLog
                    label="Morning"
                    data={sessionData}
                    sessionType="am"
                  />
                )}
                {hasPM && (
                  <SessionLog
                    label="Afternoon"
                    data={sessionData}
                    sessionType="pm"
                  />
                )}
                {!hasAM && !hasPM && (
                  <Text style={styles.noScheduleText}>
                    No schedule for this date
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handlePrint}
        activeOpacity={0.8}
      >
        <Image source={icons.printer} style={styles.downloadIcon} />
        <Text style={styles.downloadText}>DOWNLOAD REPORT</Text>
      </TouchableOpacity>

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

export default Attendance;

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
    flexWrap: "wrap",
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
  dateCard: {
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
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
  },
  dateIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.secondary,
    opacity: 0.7,
  },
  dateText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
  sessionsBody: {
    paddingVertical: theme.spacing.xsmall,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37,85,134,0.07)",
  },
  sessionLabel: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    flex: 1,
  },
  sessionChecks: {
    flexDirection: "row",
    gap: theme.spacing.medium,
  },
  checkItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 40,
  },
  checkLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  sessionIcon: {
    width: 22,
    height: 22,
  },
  sessionIconPlaceholder: {
    width: 22,
    height: 22,
  },
  noScheduleText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
    paddingVertical: theme.spacing.medium,
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
  loadingText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.large,
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
});
