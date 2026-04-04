import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import theme from "../../../../constants/theme";
import globalStyles from "../../../../constants/globalStyles";
import icons from "../../../../constants/icons";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import * as Print from "expo-print";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import CustomModal from "../../../../components/CustomModal";
import { getStudentAttSummary } from "../../../../services/api/records";
import { getStoredUser } from "../../../../database/queries";

const CHIP_SIZE = 38;

const StatusChip = ({ attended }) => {
  if (attended === null || attended === undefined) {
    return <View style={[styles.statusChip, styles.chipEmpty]} />;
  }
  const isPresent = !!attended;
  return (
    <View
      style={[
        styles.statusChip,
        isPresent ? styles.chipPresent : styles.chipAbsent,
      ]}
    >
      <Image
        source={isPresent ? icons.present : icons.absent}
        style={[
          styles.chipIcon,
          { tintColor: isPresent ? theme.colors.green : "#C62828" },
        ]}
      />
    </View>
  );
};

const SessionLog = ({ label, data, sessionType = "am", showDivider }) => {
  const timeInKey = sessionType === "am" ? "am_in" : "pm_in";
  const timeOutKey = sessionType === "am" ? "am_out" : "pm_out";

  const scheduleIn = data?.schedule?.[timeInKey];
  const scheduleOut = data?.schedule?.[timeOutKey];

  if (!scheduleIn && !scheduleOut) return null;

  const sessionTimes = {
    am_in: "08:00:00",
    am_out: "12:00:00",
    pm_in: "13:00:00",
    pm_out: "17:00:00",
  };

  const now = moment();
  const eventDateStr = data.date;

  const isSessionTimePassed = (timeKey) => {
    if (!timeKey) return false;
    const sessionTime = sessionTimes[timeKey];
    const sessionDateTime = moment(
      `${eventDateStr}T${sessionTime}`,
      "YYYY-MM-DDTHH:mm:ss",
    );
    return now.isSameOrAfter(sessionDateTime);
  };

  const showIn = isSessionTimePassed(timeInKey);
  const showOut = isSessionTimePassed(timeOutKey);

  return (
    <>
      {showDivider && <View style={styles.sessionDivider} />}
      <View style={styles.sessionRow}>
        <Text style={styles.sessionLabel}>{label}</Text>
        <View style={styles.sessionStatus}>
          <View style={styles.statusIndicator}>
            <Text style={styles.statusLabel}>In</Text>
            <StatusChip
              attended={showIn ? data?.attendance?.[timeInKey] : undefined}
            />
          </View>
          <View style={styles.statusIndicator}>
            <Text style={styles.statusLabel}>Out</Text>
            <StatusChip
              attended={showOut ? data?.attendance?.[timeOutKey] : undefined}
            />
          </View>
        </View>
      </View>
    </>
  );
};

const Attendance = () => {
  const [attendanceDataList, setAttendanceDataList] = useState([]);
  const [rawAttendanceSummary, setRawAttendanceSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const { eventId, studentId } = useLocalSearchParams();
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
        const [summaryResponse, storedUser] = await Promise.all([
          getStudentAttSummary(eventId, studentId),
          getStoredUser(),
        ]);

        if (summaryResponse?.success && summaryResponse.data) {
          const {
            event_name,
            student_id,
            student_name,
            attendance_summary: rawSummary,
            available_time_periods,
          } = summaryResponse.data;

          let attendance_summary = rawSummary;
          if (typeof rawSummary === "string") {
            try {
              attendance_summary = JSON.parse(rawSummary);
            } catch {
              attendance_summary = {};
            }
          }

          setEventName(event_name);

          const courseBlock = storedUser
            ? `${storedUser.course_code || ""} ${storedUser.block_name || ""}`.trim()
            : "";

          setStudentDetails({
            name: student_name,
            id: student_id,
            courseBlock,
          });

          const dates = Object.entries(attendance_summary || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, summary]) => ({
              date,
              schedule: {
                am_in: available_time_periods?.hasAmIn ? "00:00:00" : null,
                am_out: available_time_periods?.hasAmOut ? "00:00:00" : null,
                pm_in: available_time_periods?.hasPmIn ? "00:00:00" : null,
                pm_out: available_time_periods?.hasPmOut ? "00:00:00" : null,
              },
              attendance: {
                am_in: summary.am_in_attended ? true : false,
                am_out: summary.am_out_attended ? true : false,
                pm_in: summary.pm_in_attended ? true : false,
                pm_out: summary.pm_out_attended ? true : false,
              },
            }));

          setAttendanceDataList(dates);
          setRawAttendanceSummary(attendance_summary);
        } else {
          setEventName("");
          setStudentDetails(null);
          setAttendanceDataList([]);
          setRawAttendanceSummary({});
        }
      } catch {
        setEventName("");
        setStudentDetails(null);
        setAttendanceDataList([]);
        setRawAttendanceSummary({});
      } finally {
        setLoading(false);
      }
    };

    if (eventId && studentId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [eventId, studentId]);

  const handlePrint = async () => {
    try {
      console.log("🔄 [PDF Download] Initiating PDF download...", { eventId, studentId });

      const response = await getStudentAttSummary(eventId, studentId);
      if (!response?.success || !response.data) {
        console.error("❌ [PDF] Failed to fetch student summary");
        throw new Error("Failed to fetch student data for PDF generation.");
      }
      console.log("✅ [PDF] Student summary fetched successfully");

      const {
        event_name,
        student_id,
        student_name,
        attendance_summary,
        available_time_periods = {},
      } = response.data;

      console.log("📋 [PDF] Building table headers...");
      let tableHeaders = `<span class="col-date">Date</span>`;
      if (available_time_periods.hasAmIn)
        tableHeaders += '<span class="col-time">AM In</span>';
      if (available_time_periods.hasAmOut)
        tableHeaders += '<span class="col-time">AM Out</span>';
      if (available_time_periods.hasPmIn)
        tableHeaders += '<span class="col-time">PM In</span>';
      if (available_time_periods.hasPmOut)
        tableHeaders += '<span class="col-time">PM Out</span>';
      tableHeaders += `<span class="col-count">Present</span><span class="col-count">Absent</span>`;
      console.log("✅ [PDF] Headers created:", { hasAmIn: available_time_periods.hasAmIn, hasPmIn: available_time_periods.hasPmIn });

      console.log("📊 [PDF] Processing attendance rows...", { totalDates: Object.keys(attendance_summary || {}).length });
      const tableRows = Object.entries(attendance_summary || {})
        .map(([date, summary]) => {
          let rowColumns = `<span class="col-date">${moment(date).format("MMMM D, YYYY")}</span>`;
          if (available_time_periods.hasAmIn)
            rowColumns += `<span class="col-time">${summary.am_in_attended || 0}</span>`;
          if (available_time_periods.hasAmOut)
            rowColumns += `<span class="col-time">${summary.am_out_attended || 0}</span>`;
          if (available_time_periods.hasPmIn)
            rowColumns += `<span class="col-time">${summary.pm_in_attended || 0}</span>`;
          if (available_time_periods.hasPmOut)
            rowColumns += `<span class="col-time">${summary.pm_out_attended || 0}</span>`;
          rowColumns += `<span class="col-count">${summary.present_count}</span><span class="col-count">${summary.absent_count}</span>`;
          return `<div class="record-line">${rowColumns}</div>`;
        })
        .join("");
      console.log("✅ [PDF] Rows processed, count:", Object.keys(attendance_summary || {}).length);

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                color: #333;
                font-size: 11px;
                line-height: 1.5;
              }
              .container { padding: 40px; }
              .header {
                border-bottom: 3px solid #255586;
                padding-bottom: 20px;
                margin-bottom: 25px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #255586;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 12px;
                color: #666;
                margin-bottom: 10px;
              }
              .generated-date {
                font-size: 10px;
                color: #999;
                margin-bottom: 15px;
              }
              .student-info {
                background-color: #f5f5f5;
                border-left: 4px solid #255586;
                padding: 12px 15px;
                margin-bottom: 20px;
                border-radius: 3px;
              }
              .student-info p {
                margin: 4px 0;
                font-size: 11px;
              }
              .student-name {
                font-weight: bold;
                color: #255586;
                font-size: 12px;
              }
              .table-section {
                margin-top: 20px;
              }
              .table-label {
                font-size: 12px;
                font-weight: bold;
                color: #255586;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 2px solid #e0e0e0;
              }
              .header-line {
                display: flex;
                font-weight: bold;
                background-color: #255586;
                color: white;
                padding: 8px;
                margin-bottom: 1px;
                font-size: 10px;
              }
              .record-line {
                display: flex;
                padding: 6px 8px;
                border-bottom: 1px solid #e0e0e0;
                font-size: 10px;
                background-color: #fafafa;
              }
              .record-line:nth-child(even) {
                background-color: #fff;
              }
              .col-date { width: 120px; text-align: left; padding-right: 10px; }
              .col-time { width: 60px; text-align: center; }
              .col-count { width: 60px; text-align: center; }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 9px;
                color: #999;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="title">EVENTLOG</div>
                <div class="subtitle">Attendance Report</div>
                <div class="generated-date">Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              </div>

              <div class="student-info">
                <p class="student-name">${student_name || "N/A"}</p>
                <p><strong>Student ID:</strong> ${student_id || "N/A"}</p>
                <p><strong>Event:</strong> ${event_name || "Unknown Event"}</p>
                <p><strong>Course/Block:</strong> ${studentDetails?.courseBlock || "N/A"}</p>
              </div>

              <div class="table-section">
                <div class="table-label">Attendance Details</div>
                <div class="header-line">${tableHeaders}</div>
                ${tableRows}
              </div>

              <div class="footer">
                <p>This is an official attendance report generated by EVENTLOG system.</p>
                <p>For inquiries, please contact your administrator.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        console.log("🔄 [PDF] Starting PDF generation...");
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        console.log("✅ [PDF] Generated from Print:", uri);

        const pdfName = `${student_name || "Student"} - Individual Attendance Report.pdf`;
        console.log("📝 [PDF] Creating file:", pdfName);

        const src = new File(uri);
        console.log("📂 [PDF] Source file created:", uri);

        const dest = new File(Paths.document, pdfName);
        console.log("📂 [PDF] Destination path:", Paths.document, pdfName);

        src.move(dest);
        console.log("✅ [PDF] File moved successfully to:", dest.uri);

        console.log("📤 [PDF] Initiating share dialog...");
        await Sharing.shareAsync(dest.uri, {
          mimeType: "application/pdf",
          UTI: ".pdf",
        });
        console.log("✅ [PDF] Shared successfully");

        setModalConfig({
          title: "Download Successful",
          message: "Your attendance record has been downloaded successfully.",
          type: "success",
          cancelTitle: "OK",
        });
      } catch (fileError) {
        console.error("❌ [PDF File Error]", {
          stage: fileError.message?.includes("move") ? "move" :
                  fileError.message?.includes("share") ? "share" :
                  fileError.message?.includes("Print") ? "generate" : "unknown",
          message: fileError.message,
          code: fileError.code,
          stack: fileError.stack,
          studentName: student_name,
          eventId,
          studentId,
        });

        throw fileError;
      }
    } catch (error) {
      console.error("❌ [PDF Generation Error]", {
        message: error.message,
        code: error.code,
        stage: error.message?.includes("JSON") ? "html" :
               error.message?.includes("File") ? "file" :
               error.message?.includes("share") ? "share" : "unknown",
        eventId,
        studentId,
        studentName: student_name,
      });

      setModalConfig({
        title: "Download Failed",
        message: `An error occurred: ${error.message || "Unknown error"}. Please try again or contact support.`,
        type: "error",
        cancelTitle: "OK",
      });
    } finally {
      setModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.stateText}>Loading...</Text>
      </View>
    );
  }

  if (!eventName || !studentDetails || attendanceDataList.length === 0) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Text style={styles.stateText}>No attendance data available.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        cancelTitle={modalConfig.cancelTitle}
        onCancel={() => setModalVisible(false)}
      />

      <View style={styles.headerCard}>
        <Text style={styles.headerEventName} numberOfLines={2}>
          {eventName}
        </Text>
        <View style={styles.headerDivider} />
        <View style={styles.headerInfoRow}>
          <Image source={icons.student} style={styles.headerIcon} />
          <Text style={styles.headerInfoText}>{studentDetails.name}</Text>
        </View>
        <View style={styles.headerInfoRow}>
          <Image source={icons.idBadge} style={styles.headerIcon} />
          <Text style={styles.headerInfoText}>{studentDetails.id}</Text>
        </View>
        {!!studentDetails.courseBlock && (
          <View style={styles.headerInfoRow}>
            <Image source={icons.blocks} style={styles.headerIcon} />
            <Text style={styles.headerInfoText}>
              {studentDetails.courseBlock}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollviewContent}
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          const pastDates = attendanceDataList.filter((data) => {
            const now = moment();
            const dateStr = data.date;
            return moment(dateStr).isSameOrBefore(now, "day");
          });
          return pastDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.stateText}>
                No attendance records available yet.
              </Text>
            </View>
          ) : (
            pastDates.map((attendanceData, index) => {
              const sessionData = {
                date: attendanceData.date,
                schedule: attendanceData.schedule,
                attendance: attendanceData.attendance,
              };
              const hasAm =
                attendanceData.schedule?.am_in &&
                attendanceData.schedule?.am_out;
              const hasPm =
                attendanceData.schedule?.pm_in &&
                attendanceData.schedule?.pm_out;

              const attendanceStats =
                rawAttendanceSummary[attendanceData.date] || {};
              const presentCount = attendanceStats.present_count || 0;
              const totalCount = attendanceStats.total_count || 0;

              let badgeColor = styles.badgeRed;
              if (totalCount > 0 && presentCount === totalCount)
                badgeColor = styles.badgeGreen;
              else if (totalCount > 0 && presentCount > 0)
                badgeColor = styles.badgeYellow;

              return (
                <View key={index} style={styles.dateCard}>
                  <View style={styles.dateHeader}>
                    <View style={styles.dateAccent} />
                    <Text style={styles.dateText}>
                      {moment(attendanceData.date).format("MMMM D, YYYY")}
                    </Text>
                    <View style={[styles.attendanceBadge, badgeColor]}>
                      <Text style={styles.badgeText}>
                        {presentCount}/{totalCount}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionsWrapper}>
                    {hasAm && (
                      <SessionLog
                        label="Morning"
                        data={sessionData}
                        sessionType="am"
                        showDivider={false}
                      />
                    )}
                    {hasPm && (
                      <SessionLog
                        label="Afternoon"
                        data={sessionData}
                        sessionType="pm"
                        showDivider={!!hasAm}
                      />
                    )}
                    {!hasAm && !hasPm && (
                      <Text style={styles.noSessionText}>
                        No schedule for this date
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          );
        })()}
      </ScrollView>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handlePrint}
        activeOpacity={0.8}
      >
        <Image source={icons.printer} style={styles.downloadIcon} />
        <Text style={styles.downloadText}>DOWNLOAD REPORT</Text>
      </TouchableOpacity>
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
    marginBottom: theme.spacing.medium,
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
  headerEventName: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.small,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(251,241,229,0.2)",
    marginBottom: theme.spacing.small,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    marginTop: theme.spacing.xsmall,
  },
  headerIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.secondary,
    opacity: 0.7,
  },
  headerInfoText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.9,
  },
  scrollviewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  dateCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.12)",
    marginBottom: theme.spacing.small,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(37,85,134,0.07)",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
  },
  dateAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.small,
  },
  dateText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    flex: 1,
  },
  attendanceBadge: {
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 3,
    minWidth: 48,
    alignItems: "center",
  },
  badgeGreen: {
    backgroundColor: "rgba(76,175,80,0.2)",
  },
  badgeYellow: {
    backgroundColor: "rgba(255,193,7,0.2)",
  },
  badgeRed: {
    backgroundColor: "rgba(244,67,54,0.2)",
  },
  badgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  sessionsWrapper: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: "rgba(37,85,134,0.1)",
    marginHorizontal: theme.spacing.medium,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.small,
  },
  sessionLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    flex: 1,
  },
  sessionStatus: {
    flexDirection: "row",
    gap: theme.spacing.large + theme.spacing.small,
    alignItems: "center",
  },
  statusIndicator: {
    alignItems: "center",
    gap: 4,
  },
  statusLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  statusChip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPresent: {
    backgroundColor: "rgba(76,175,80,0.15)",
  },
  chipAbsent: {
    backgroundColor: "rgba(198,40,40,0.1)",
  },
  chipEmpty: {
    backgroundColor: "rgba(37,85,134,0.05)",
  },
  chipIcon: {
    width: 20,
    height: 20,
  },
  noSessionText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.5,
    textAlign: "center",
    paddingVertical: theme.spacing.xsmall,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xlarge,
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
    marginBottom: theme.spacing.medium,
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
  stateText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    opacity: 0.6,
    textAlign: "center",
  },
});
