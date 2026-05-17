import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from "react-native";
import theme from "../../../../constants/theme";
import globalStyles from "../../../../constants/globalStyles";
import images from "../../../../constants/images";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import CustomButton from "../../../../components/CustomButton";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import CustomModal from "../../../../components/CustomModal";
import {
  fetchStudentAttendanceByEventAndBlock,
  getStudentAttSummary,
} from "../../../../services/api/attendance";

const INITIAL_MODAL_CONFIG = {
  title: "",
  message: "",
  type: "success",
  cancelTitle: "OK",
};

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
  const renderAttendanceStatus = (time, attendance) => {
    try {
      if (isAttendanceTimePassed(time)) {
        const iconSource = attendance ? images.present : images.absent;
        const iconStyle = attendance ? styles.presentIcon : styles.absentIcon;
        return <Image source={iconSource} style={iconStyle} />;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const timeInKey = sessionType === "am" ? "am_in" : "pm_in";
  const timeOutKey = sessionType === "am" ? "am_out" : "pm_out";

  const scheduleTimeIn = data?.schedule?.[timeInKey];
  const scheduleTimeOut = data?.schedule?.[timeOutKey];
  const attendanceTimeIn = data?.attendance?.[timeInKey];
  const attendanceTimeOut = data?.attendance?.[timeOutKey];

  if (!scheduleTimeIn && !scheduleTimeOut) {
    return null;
  }

  return (
    <View style={styles.sessionContainer}>
      <View style={styles.morningTextContainer}>
        <Text style={styles.morningText}>{label}</Text>
      </View>
      <View style={styles.logContainer}>
        <View style={styles.timeContainer}>
          <View
            style={[
              styles.timeLabelContainer,
              { borderRightWidth: 0, borderLeftWidth: 0 },
            ]}
          >
            <Text style={styles.timeLabel}>Time In</Text>
          </View>
          <View style={[styles.imageContainer, { borderLeftWidth: 0 }]}>
            {renderAttendanceStatus(scheduleTimeIn, attendanceTimeIn)}
          </View>
        </View>
        <View style={styles.timeContainer}>
          <View style={[styles.timeLabelContainer, { borderRightWidth: 0 }]}>
            <Text style={styles.timeLabel}>Time Out</Text>
          </View>
          <View style={[styles.imageContainer, { borderRightWidth: 0 }]}>
            {renderAttendanceStatus(scheduleTimeOut, attendanceTimeOut)}
          </View>
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
  const [modalConfig, setModalConfig] = useState(INITIAL_MODAL_CONFIG);

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
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 0px 40px 20px 40px; color: black; font-size: 11px; }
            h2, h3, h4 { color: black; }
            .header-line { color: black; font-weight: bold; margin-bottom: 10px; display: flex; }
            .record-line { color: black; margin-bottom: 2px; display: flex; }
            .col-date { width: 120px; text-align: left; }
            .col-time { width: 60px; text-align: center; font-size: 11px; }
            .col-count { width: 60px; text-align: center; }
          </style>
        </head>
        <body>
          <div style="padding-top: 10px;">
            <h2 style="color: black; text-align: left; margin-bottom: 3px;">${
              event_name || "Unknown Event"
            }</h2>
            <h3 style="color: black; text-align: left; margin-bottom: 3px;">Individual Attendance Report</h3>
            <h4 style="color: black; text-align: left; margin-bottom: 3px;">Generated: ${new Date().toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}</h4>
            <h3 style="color: black; text-align: left; margin-bottom: 10px;">${
              student_name || "N/A"
            } (${student_id || "N/A"})</h3>
            <div style="margin-bottom: 15px;">
              <p style="margin: 5px 0; text-align: left;"><strong>Course/Block:</strong> ${
                studentDetails?.courseBlock || "N/A"
              }</p>
            </div>
            <div class="header-line">
              ${tableHeaders}
            </div>
            ${tableRows}
          </div>
        </body>
      </html>
    `;

      const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
      const pdfName = `${
        student_name || "Student"
      } - Individual Attendance Report.pdf`;

      const tempFile = new File(tempUri);
      const documentsDir = new Directory(Paths.document);
      const existingFile = new File(documentsDir, pdfName);
      if (existingFile.exists) existingFile.delete();
      tempFile.move(documentsDir);
      tempFile.rename(pdfName);

      const shareResult = await Share.share({ url: tempFile.uri, title: pdfName });

      if (shareResult.action === Share.sharedAction) {
        setModalConfig({
          title: "Download Successful",
          message: "Your attendance record has been downloaded successfully.",
          type: "success",
          cancelTitle: "OK",
        });
        setModalVisible(true);
      }
      return;
    } catch (error) {
      setModalConfig({
        title: "Download Failed",
        message: `An error occurred while generating the PDF: ${
          error.message || "Unknown error"
        }`,
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
        <Text style={styles.noEventsText}>No attendance data available.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.attendanceWrapper}>
        <Text style={styles.eventTitle}>{eventName}</Text>
        <View style={styles.fullContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollviewContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.info}>Name: {studentDetails.name}</Text>
              <Text style={styles.info}>ID: {studentDetails.id}</Text>
              <Text style={styles.info}>
                Course/Block: {studentDetails.courseBlock}
              </Text>
            </View>
            {attendanceDataList.map((attendanceData, index) => {
              const sessionData = {
                date: attendanceData.date,
                schedule: attendanceData.schedule,
                attendance: attendanceData.attendance,
              };
              return (
                <View key={index} style={styles.attendanceContainer}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.date}>
                      {moment(attendanceData.date).format("MMMM D, YYYY")}
                    </Text>
                  </View>
                  {attendanceData.schedule?.am_in &&
                    attendanceData.schedule?.am_out && (
                      <SessionLog
                        label="Morning"
                        data={sessionData}
                        sessionType="am"
                      />
                    )}
                  {attendanceData.schedule?.pm_in &&
                    attendanceData.schedule?.pm_out && (
                      <SessionLog
                        label="Afternoon"
                        data={sessionData}
                        sessionType="pm"
                      />
                    )}
                  {!(
                    attendanceData.schedule?.am_in &&
                    attendanceData.schedule?.am_out
                  ) &&
                    !(
                      attendanceData.schedule?.pm_in &&
                      attendanceData.schedule?.pm_out
                    ) && (
                      <View style={styles.noSessionContainer}>
                        <Text style={styles.noSessionText}>
                          No schedule available for this date
                        </Text>
                      </View>
                    )}
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.buttonContainer}>
            <CustomButton title="Download" onPress={handlePrint} />
          </View>
        </View>
      </View>
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
  fullContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
  },
  attendanceWrapper: {
    flex: 1,
    width: "100%",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  eventTitle: {
    fontSize: theme.fontSizes.huge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    textAlign: "center",
    paddingVertical: theme.spacing.medium,
  },
  scrollviewContainer: {
    paddingHorizontal: theme.spacing.medium,
    paddingBottom: theme.spacing.large,
  },
  infoContainer: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  info: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    marginTop: theme.spacing.xsmall,
  },
  attendanceContainer: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.medium,
  },
  dateContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderColor: theme.colors.primary,
    height: 40,
  },
  date: {
    fontSize: theme.fontSizes.extraLarge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    textAlign: "center",
  },
  sessionContainer: {
    flex: 1,
  },
  morningText: {
    fontSize: theme.fontSizes.extraLarge,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
  morningTextContainer: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logContainer: {
    flexDirection: "row",
  },
  timeContainer: {
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  timeLabelContainer: {
    borderWidth: 3,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderColor: theme.colors.primary,
    height: 50,
  },
  timeLabel: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
  imageContainer: {
    borderLeftWidth: 3,
    borderBottomWidth: 2,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    borderColor: theme.colors.primary,
  },
  absentIcon: {
    width: 35,
    height: 35,
    tintColor: "red",
  },
  presentIcon: {
    width: 35,
    height: 35,
    tintColor: theme.colors.green,
  },
  loadingText: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  noEventsText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.secondary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
  },
  noSessionContainer: {
    paddingVertical: theme.spacing.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  noSessionText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.secondary,
    textAlign: "center",
  },
});
