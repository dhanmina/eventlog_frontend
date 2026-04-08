import { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Share,
} from "react-native";
import theme from "../../../../constants/theme";
import globalStyles from "../../../../constants/globalStyles";
import icons from "../../../../constants/icons";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import CustomModal from "../../../../components/CustomModal";
import { getStudentAttSummary } from "../../../../services/api/records";
import { getStoredUser } from "../../../../database/queries";

const CHIP_SIZE = 36;

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
  const isSessionTimePassed = (timeKey) => {
    if (!timeKey) return false;
    return now.isSameOrAfter(
      moment(`${data.date}T${sessionTimes[timeKey]}`, "YYYY-MM-DDTHH:mm:ss"),
    );
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
            <StatusChip
              attended={showIn ? data?.attendance?.[timeInKey] : undefined}
            />
            <Text style={styles.statusLabel}>In</Text>
          </View>
          <View style={styles.statusIndicator}>
            <StatusChip
              attended={showOut ? data?.attendance?.[timeOutKey] : undefined}
            />
            <Text style={styles.statusLabel}>Out</Text>
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
          setStudentDetails({
            name: student_name,
            id: student_id,
            courseBlock: storedUser?.block_name || "",
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
                am_in: !!summary.am_in_attended,
                am_out: !!summary.am_out_attended,
                pm_in: !!summary.pm_in_attended,
                pm_out: !!summary.pm_out_attended,
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

    if (eventId && studentId) fetchData();
    else setLoading(false);
  }, [eventId, studentId]);

  const overallStats = useMemo(() => {
    const today = moment().startOf("day");
    return Object.entries(rawAttendanceSummary).reduce(
      (acc, [date, s]) => {
        if (!moment(date).isBefore(today)) return acc;
        return {
          present: acc.present + (s.present_count || 0),
          total: acc.total + (s.total_count || 0),
        };
      },
      { present: 0, total: 0 },
    );
  }, [rawAttendanceSummary]);

  const handlePrint = async () => {
    let pdfStudentName = "Student";
    let hasError = false;

    try {
      console.log("🔄 [PDF Download] Initiating PDF download...", {
        eventId,
        studentId,
      });

      const response = await getStudentAttSummary(eventId, studentId);
      if (!response?.success || !response.data) {
        console.error("❌ [PDF] Failed to fetch student summary");
        throw new Error("Failed to fetch student data for PDF generation.");
      }

      const {
        event_name,
        student_id,
        student_name,
        attendance_summary,
        available_time_periods = {},
      } = response.data;

      pdfStudentName = student_name || "Student";

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

      const htmlContent = `
        <html><head><meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #222; font-size: 12px; line-height: 1.5; }
            .container { padding: 40px; }
            .header { border-bottom: 3px solid #255586; padding-bottom: 20px; margin-bottom: 25px; }
            .title { font-size: 26px; font-weight: bold; color: #255586; margin-bottom: 5px; }
            .subtitle { font-size: 13px; color: #444; margin-bottom: 10px; }
            .generated-date { font-size: 11px; color: #666; margin-bottom: 15px; }
            .student-info { background-color: #f0f4f8; border-left: 4px solid #255586; padding: 12px 15px; margin-bottom: 20px; border-radius: 3px; }
            .student-info p { margin: 4px 0; font-size: 12px; color: #222; }
            .student-name { font-weight: bold; color: #255586; font-size: 13px; }
            .table-section { margin-top: 20px; }
            .table-label { font-size: 13px; font-weight: bold; color: #255586; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #e0e0e0; }
            .header-line { display: flex; font-weight: bold; background-color: #255586; color: #ffffff; padding: 9px 8px; margin-bottom: 1px; font-size: 11px; }
            .record-line { display: flex; padding: 7px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #222; background-color: #fafafa; }
            .record-line:nth-child(even) { background-color: #ffffff; }
            .col-date { width: 130px; text-align: left; padding-right: 10px; }
            .col-time { width: 60px; text-align: center; }
            .col-count { width: 60px; text-align: center; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; line-height: 1.8; }
          </style>
        </head>
        <body><div class="container">
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
        </div></body></html>
      `;

      try {
        const safeName = (student_name || "Student").replace(
          /[^a-zA-Z0-9]/g,
          "",
        );
        const safeEvent = (event_name || "Event").replace(/[^a-zA-Z0-9]/g, "");
        const pdfName = `${safeName}_${safeEvent}.pdf`;
        console.log("📝 [PDF] Target filename:", pdfName);

        const { uri: tempUri } = await Print.printToFileAsync({
          html: htmlContent,
        });
        const tempFile = new File(tempUri);
        const documentsDir = new Directory(Paths.document);
        const existingFile = new File(documentsDir, pdfName);
        if (existingFile.exists) existingFile.delete();
        tempFile.move(documentsDir);
        tempFile.rename(pdfName);
        console.log("✅ [PDF] File moved to:", tempFile.uri);

        const shareResult = await Share.share({
          url: tempFile.uri,
          title: pdfName,
        });
        console.log("✅ [PDF] Share result:", shareResult.action);

        if (shareResult.action === Share.sharedAction) {
          setModalConfig({
            title: "Report Saved",
            message: "Your attendance report has been saved successfully.",
            type: "success",
            cancelTitle: "OK",
          });
          setModalVisible(true);
        }
      } catch (fileError) {
        console.error("❌ [PDF File Error]", {
          message: fileError.message,
          code: fileError.code,
        });
        throw fileError;
      }
    } catch (error) {
      console.error("❌ [PDF Generation Error]", {
        message: error.message,
        code: error.code,
      });
      hasError = true;
      setModalConfig({
        title: "Download Failed",
        message: `An error occurred: ${error.message || "Unknown error"}. Please try again.`,
        type: "error",
        cancelTitle: "OK",
      });
    } finally {
      if (hasError) setModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Image source={icons.calendar} style={styles.stateIcon} />
        <Text style={styles.stateTitle}>Loading...</Text>
      </View>
    );
  }

  if (!eventName || !studentDetails || attendanceDataList.length === 0) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <Image source={icons.calendarStar} style={styles.stateIcon} />
        <Text style={styles.stateTitle}>No Data</Text>
        <Text style={styles.stateSubtitle}>
          No attendance data available for this event.
        </Text>
      </View>
    );
  }

  const pastDates = attendanceDataList.filter((d) =>
    moment(d.date).isSameOrBefore(moment(), "day"),
  );

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
        <Text style={styles.headerTitle}>{eventName}</Text>
        <Text style={styles.headerSubtitle}>Attendance Report</Text>

        <View style={styles.headerInfoBlock}>
          <View style={styles.headerMetaRow}>
            <Image source={icons.student} style={styles.headerMetaIcon} />
            <Text style={styles.headerMetaText}>{studentDetails.name}</Text>
          </View>
          <View style={styles.headerMetaRow}>
            <Image source={icons.idBadge} style={styles.headerMetaIcon} />
            <Text style={styles.headerMetaText}>{studentDetails.id}</Text>
          </View>
          {!!studentDetails.courseBlock && (
            <View style={styles.headerMetaRow}>
              <Image source={icons.blocks} style={styles.headerMetaIcon} />
              <Text style={styles.headerMetaText}>
                {studentDetails.courseBlock}
              </Text>
            </View>
          )}
        </View>

        {overallStats.total > 0 && (
          <View style={styles.headerFooter}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{overallStats.present}</Text>
              <Text style={styles.headerStatLabel}>present</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>
                {overallStats.total - overallStats.present}
              </Text>
              <Text style={styles.headerStatLabel}>absent</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{overallStats.total}</Text>
              <Text style={styles.headerStatLabel}>total sessions</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pastDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={icons.clock} style={styles.emptyIcon} />
            <Text style={styles.stateTitle}>Not Yet</Text>
            <Text style={styles.stateSubtitle}>
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
              attendanceData.schedule?.am_in && attendanceData.schedule?.am_out;
            const hasPm =
              attendanceData.schedule?.pm_in && attendanceData.schedule?.pm_out;
            const stats = rawAttendanceSummary[attendanceData.date] || {};
            const presentCount = stats.present_count || 0;
            const totalCount = stats.total_count || 0;

            const badgeStyle =
              totalCount === 0
                ? styles.badgeNeutral
                : presentCount === totalCount
                  ? styles.badgeGreen
                  : presentCount > 0
                    ? styles.badgeYellow
                    : styles.badgeRed;

            const badgeTextStyle =
              totalCount === 0
                ? styles.badgeTextNeutral
                : presentCount === totalCount
                  ? styles.badgeTextGreen
                  : presentCount > 0
                    ? styles.badgeTextYellow
                    : styles.badgeTextRed;

            return (
              <View key={index} style={styles.dateCard}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateAccent} />
                  <Text style={styles.dateText}>
                    {moment(attendanceData.date).format("MMMM D, YYYY")}
                  </Text>
                  <View style={[styles.attendanceBadge, badgeStyle]}>
                    <Text style={[styles.badgeText, badgeTextStyle]}>
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
        )}
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
    marginBottom: theme.spacing.medium,
  },
  headerInfoBlock: {
    gap: 5,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerMetaIcon: {
    width: 13,
    height: 13,
    tintColor: theme.colors.secondary,
    opacity: 0.6,
  },
  headerMetaText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    opacity: 0.85,
  },
  headerFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.medium,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,241,229,0.15)",
    gap: theme.spacing.medium,
  },
  headerStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  headerStatValue: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  headerStatLabel: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.65,
  },
  headerStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(251,241,229,0.25)",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
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
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(37,85,134,0.06)",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
  },
  dateAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.small,
    opacity: 0.7,
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
    minWidth: 44,
    alignItems: "center",
  },
  badgeGreen: { backgroundColor: "rgba(76,175,80,0.15)" },
  badgeYellow: { backgroundColor: "rgba(255,193,7,0.15)" },
  badgeRed: { backgroundColor: "rgba(198,40,40,0.12)" },
  badgeNeutral: { backgroundColor: "rgba(37,85,134,0.08)" },
  badgeText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.small,
  },
  badgeTextGreen: { color: "#2e7d32" },
  badgeTextYellow: { color: "#f57f17" },
  badgeTextRed: { color: "#C62828" },
  badgeTextNeutral: { color: theme.colors.primary, opacity: 0.5 },

  sessionsWrapper: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.xsmall,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: "rgba(37,85,134,0.08)",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.small,
  },
  sessionLabel: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    flex: 1,
  },
  sessionStatus: {
    flexDirection: "row",
    gap: theme.spacing.medium,
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
  chipPresent: { backgroundColor: "rgba(76,175,80,0.15)" },
  chipAbsent: { backgroundColor: "rgba(198,40,40,0.1)" },
  chipEmpty: { backgroundColor: "rgba(37,85,134,0.05)" },
  chipIcon: { width: 18, height: 18 },

  noSessionText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
    paddingVertical: theme.spacing.small,
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
  downloadIcon: { width: 20, height: 20, tintColor: theme.colors.secondary },
  downloadText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },

  stateIcon: {
    width: 40,
    height: 40,
    tintColor: theme.colors.primary,
    opacity: 0.2,
    marginBottom: theme.spacing.small,
  },
  stateTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  stateSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
    marginTop: theme.spacing.xsmall,
    paddingHorizontal: theme.spacing.large,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xlarge,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    tintColor: theme.colors.primary,
    opacity: 0.2,
    marginBottom: theme.spacing.small,
  },
});
