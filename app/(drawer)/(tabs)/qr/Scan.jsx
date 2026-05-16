import { StyleSheet, Text, View, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import CryptoJS from "crypto-js";
import moment from "moment";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import CustomModal from "../../../../components/CustomModal";
import { QR_SECRET_KEY } from "../../../../config/config";
import {
  getStoredEvents,
  logAttendance,
  isAlreadyLogged,
} from "../../../../database/queries";
import { performSync } from "../../../../services/api";

const SCAN_RESET_DELAY_MS = 1000;
const TIME_FORMAT = "HH:mm:ss";

const ATTENDANCE_DESCRIPTIONS = {
  AM_IN: "Morning Time In",
  AM_OUT: "Morning Time Out",
  PM_IN: "Afternoon Time In",
  PM_OUT: "Afternoon Time Out",
};

const isBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
};

const decryptQRData = (data) => {
  try {
    const bytes = CryptoJS.AES.decrypt(data, QR_SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error("Failed to decrypt QR code");
  }
};

const parseQRPayload = (decryptedText) => {
  if (!decryptedText.startsWith("eventlog")) throw new Error("Invalid QR format");
  const [_, eventDateIdStr, studentIdStr] = decryptedText.split("-");
  const eventDateId = parseInt(eventDateIdStr, 10);
  const studentId = studentIdStr;

  if (isNaN(eventDateId) || !studentId) throw new Error("Invalid QR code data.");

  return { eventDateId, studentId };
};

const getEventForDate = (events, eventDateId) =>
  events.find((event) => {
    const ids = event.event_date_ids || event.date_ids;
    return ids?.includes(eventDateId);
  });

const getAttendanceWindowEnd = (time, duration) =>
  time ? moment(time, TIME_FORMAT).add(duration, "minutes").format(TIME_FORMAT) : null;

const getAttendanceTypeForCurrentTime = (event, currentTime) => {
  const { am_in, am_out, pm_in, pm_out, duration } = event;
  const timeChecks = [
    { type: "AM_IN", start: am_in, end: getAttendanceWindowEnd(am_in, duration) },
    { type: "AM_OUT", start: am_out, end: getAttendanceWindowEnd(am_out, duration) },
    { type: "PM_IN", start: pm_in, end: getAttendanceWindowEnd(pm_in, duration) },
    { type: "PM_OUT", start: pm_out, end: getAttendanceWindowEnd(pm_out, duration) },
  ];

  for (const check of timeChecks) {
    if (check.start && check.end) {
      const now = moment(currentTime, TIME_FORMAT);
      const start = moment(check.start, TIME_FORMAT);
      const end = moment(check.end, TIME_FORMAT);
      const match = now.isBetween(start, end, null, "[]");

      if (match) return check.type;
    }
  }

  return null;
};

const Scan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [pendingAttendanceData, setPendingAttendanceData] = useState(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const handleCameraPermission = async () => {
    if (!permission) return;
    if (permission.status === "undetermined") {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert("Camera Permission Required", "Enable camera in settings.", [{ text: "OK" }]);
      }
    } else if (permission.status === "denied") {
      Alert.alert("Camera Access Denied", "Go to Settings and enable camera.", [{ text: "OK" }]);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setCameraKey((prev) => prev + 1);
      setIsCameraReady(false);
      setIsScanning(true);
      handleCameraPermission();
    }, [permission])
  );

  useEffect(() => {
    if (permission) handleCameraPermission();
  }, [permission]);

  useEffect(() => {
    const performAutoSync = async () => {
      try {
        await performSync();
      } catch {}
    };
    performAutoSync();
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    if (!isScanning) return;
    setIsScanning(false);

    try {
      if (!isBase64(data)) throw new Error("Invalid QR Code format");

      const decryptedText = decryptQRData(data);
      const { eventDateId, studentId } = parseQRPayload(decryptedText);

      let events;
      try {
        events = await getStoredEvents(eventDateId);
      } catch {
        throw new Error("Failed to retrieve event data");
      }

      const event = getEventForDate(events, eventDateId);
      if (!event) throw new Error("QR not valid for current events.");

      const currentTime = moment().format(TIME_FORMAT);
      const attendanceType = getAttendanceTypeForCurrentTime(event, currentTime);

      if (attendanceType) {
        const data = {
          event_date_id: eventDateId,
          student_id_number: studentId,
          type: attendanceType,
          event_name: event.event_name,
        };

        let alreadyLogged = false;
        try {
          alreadyLogged = await isAlreadyLogged(
            data.event_date_id,
            data.student_id_number,
            data.type
          );
        } catch {
          throw new Error("Failed to verify attendance");
        }

        if (alreadyLogged) {
          const msg = `${ATTENDANCE_DESCRIPTIONS[data.type]} already logged.`;
          setErrorMessage(msg);
          setErrorModalVisible(true);
          return;
        }

        setPendingAttendanceData(data);
        setConfirmationModalVisible(true);
      } else {
        const formatted = moment(currentTime, TIME_FORMAT).format("h:mm A");
        const msg = `Current time (${formatted}) is outside valid hours.`;
        setErrorMessage(msg);
        setErrorModalVisible(true);
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid QR");
      setErrorModalVisible(true);
    }
  };

  const confirmAttendance = async () => {
    try {
      await logAttendance(pendingAttendanceData);
      setSuccessModalVisible(true);
      await performSync();
    } catch (error) {
      const msg = error.message?.includes("already been logged")
        ? error.message
        : "Failed to log attendance.";
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setConfirmationModalVisible(false);
      setPendingAttendanceData(null);
    }
  };

  const cancelAttendance = () => {
    setConfirmationModalVisible(false);
    setPendingAttendanceData(null);
    setTimeout(() => setIsScanning(true), SCAN_RESET_DELAY_MS);
  };

  const handleModalClose = (setter) => {
    setter(false);
    setTimeout(() => setIsScanning(true), SCAN_RESET_DELAY_MS);
  };

  const reloadCamera = () => {
    setCameraKey((prev) => prev + 1);
    setIsCameraReady(false);
    setIsScanning(true);
    setSuccessModalVisible(false);
    setErrorModalVisible(false);
    setConfirmationModalVisible(false);
    setPendingAttendanceData(null);
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <Text style={styles.note}>Find a QR Code to scan</Text>
      <View style={styles.cameraContainer}>
        {!isCameraReady && (
          <View style={styles.cameraLoadingOverlay}>
            <Text style={styles.cameraLoadingText}>Loading camera...</Text>
          </View>
        )}
        <CameraView
          key={cameraKey}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={!isScanning ? undefined : handleBarcodeScanned}
          onCameraReady={() => {
            setIsCameraReady(true);
          }}
          onMountError={() => {}}
          animateShutter={false}
          enableTorch={false}
        />
        <View style={styles.tapToReloadOverlay}>
          <Text style={styles.tapToReloadText} onPress={reloadCamera}>
            Tap to reload camera
          </Text>
        </View>
      </View>

      <CustomModal
        visible={successModalVisible}
        title="QR Code Scanned"
        message="Attendance successfully recorded!"
        type="success"
        onClose={() => handleModalClose(setSuccessModalVisible)}
        onCancel={() => handleModalClose(setSuccessModalVisible)}
        cancelTitle="CLOSE"
      />

      <CustomModal
        visible={errorModalVisible}
        title="Error"
        message={errorMessage}
        type="error"
        onClose={() => handleModalClose(setErrorModalVisible)}
        onCancel={() => handleModalClose(setErrorModalVisible)}
        cancelTitle="CLOSE"
      />

      <CustomModal
        visible={confirmationModalVisible}
        title="Confirm Attendance"
        message={`Are you sure you want to log attendance for:\nStudent ID: ${pendingAttendanceData?.student_id_number}\nEvent Name: ${pendingAttendanceData?.event_name}`}
        type="warning"
        onClose={cancelAttendance}
        onCancel={cancelAttendance}
        confirmTitle="Yes"
        onConfirm={confirmAttendance}
        cancelTitle="No"
      />

      <StatusBar style="light" />
    </View>
  );
};

export default Scan;

const styles = StyleSheet.create({
  camera: {
    width: "100%",
    height: "100%",
  },
  cameraContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 10,
    borderColor: theme.colors.primary,
    borderRadius: 50,
    width: "80%",
    height: "45%",
    overflow: "hidden",
    position: "relative",
  },
  cameraLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  cameraLoadingText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
  },
  note: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.huge,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
    fontFamily: theme.fontFamily.SquadaOne,
  },
  tapToReloadOverlay: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  tapToReloadText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    textAlign: "center",
    overflow: "hidden",
  },
});
