import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
} from "react-native";
import { useState, useCallback, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import CryptoJS from "crypto-js";
import moment from "moment";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";
import CustomModal from "../../../../components/CustomModal";
import { QR_SECRET_KEY } from "../../../../config/config";
import { useAuth } from "../../../../context/AuthContext";
import {
  getStoredEvents,
  logAttendance,
  isAlreadyLogged,
} from "../../../../database/queries";
import { syncAttendance } from "../../../../services/api/sync";

const SCAN_FRAME_SIZE = 240;
const DIM = "rgba(0,0,0,0.55)";

const Scan = () => {
  useAuth();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [pendingAttendanceData, setPendingAttendanceData] = useState(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [clockTime, setClockTime] = useState(moment().format("h:mm:ss A"));

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const runScanLine = () => {
      scanLineAnim.setValue(0);
      Animated.timing(scanLineAnim, {
        toValue: SCAN_FRAME_SIZE - 2,
        duration: 2200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) runScanLine();
      });
    };
    runScanLine();
    return () => scanLineAnim.stopAnimation();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleCameraPermission = async () => {
    if (!permission) return;
    if (permission.status === "undetermined") {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Enable camera in settings.",
          [{ text: "OK" }],
        );
      }
    } else if (permission.status === "denied") {
      Alert.alert("Camera Access Denied", "Go to Settings and enable camera.", [
        { text: "OK" },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsScanning(true);
      handleCameraPermission();
    }, [permission]),
  );

  useEffect(() => {
    if (permission) handleCameraPermission();
  }, [permission]);

  useEffect(() => {
    const performAutoSync = async () => {
      try {
        await syncAttendance();
      } catch {}
    };
    performAutoSync();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(moment().format("h:mm:ss A"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    if (!isScanning) return;
    setIsScanning(false);

    try {
      if (!isBase64(data)) throw new Error("Invalid QR Code format");

      let decryptedText;
      try {
        const bytes = CryptoJS.AES.decrypt(data, QR_SECRET_KEY);
        decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      } catch {
        throw new Error("Failed to decrypt QR code");
      }

      if (!decryptedText.startsWith("eventlog"))
        throw new Error("Invalid QR format");
      const [_, eventDateIdStr, studentIdStr] = decryptedText.split("-");
      const eventDateId = parseInt(eventDateIdStr, 10);
      const studentId = studentIdStr;

      if (isNaN(eventDateId) || !studentId)
        throw new Error("Invalid QR code data.");

      let events;
      try {
        events = await getStoredEvents(eventDateId);
      } catch {
        throw new Error("Failed to retrieve event data");
      }

      const event = events.find((e) => {
        const ids = e.event_date_ids || e.date_ids;
        return ids?.includes(eventDateId);
      });
      if (!event) throw new Error("QR not valid for current events.");

      const { am_in, am_out, pm_in, pm_out, duration, event_name } = event;
      const effectiveDuration = duration > 0 ? duration : 1;
      const calcWindow = (t) =>
        t
          ? moment(t, "HH:mm:ss")
              .add(effectiveDuration, "minutes")
              .format("HH:mm:ss")
          : null;
      const currentTime = moment().format("HH:mm:ss");

      let isValidTime = false;
      let attendanceType = null;

      const timeChecks = [
        { type: "AM_IN", start: am_in, end: calcWindow(am_in) },
        { type: "AM_OUT", start: am_out, end: calcWindow(am_out) },
        { type: "PM_IN", start: pm_in, end: calcWindow(pm_in) },
        { type: "PM_OUT", start: pm_out, end: calcWindow(pm_out) },
      ];

      for (const check of timeChecks) {
        if (check.start && check.end) {
          const now = moment(currentTime, "HH:mm:ss");
          const start = moment(check.start, "HH:mm:ss");
          const end = moment(check.end, "HH:mm:ss");
          if (now.isBetween(start, end, null, "[]")) {
            isValidTime = true;
            attendanceType = check.type;
            break;
          }
        }
      }

      const descriptions = {
        AM_IN: "Morning Time In",
        AM_OUT: "Morning Time Out",
        PM_IN: "Afternoon Time In",
        PM_OUT: "Afternoon Time Out",
      };

      if (isValidTime) {
        const attendanceData = {
          event_date_id: eventDateId,
          student_id_number: studentId,
          type: attendanceType,
          typeLabel: descriptions[attendanceType],
          event_name,
        };

        let alreadyLogged = false;
        try {
          alreadyLogged = await isAlreadyLogged(
            attendanceData.event_date_id,
            attendanceData.student_id_number,
            attendanceData.type,
          );
        } catch {
          throw new Error("Failed to verify attendance");
        }

        if (alreadyLogged) {
          setErrorMessage(
            `${descriptions[attendanceData.type]} already logged.`,
          );
          setErrorModalVisible(true);
          return;
        }

        setPendingAttendanceData(attendanceData);
        setConfirmationModalVisible(true);
      } else {
        const formatted = moment(currentTime, "HH:mm:ss").format("h:mm A");
        setErrorMessage(
          `Current time (${formatted}) is outside valid scan hours.`,
        );
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
      await syncAttendance();
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
    setTimeout(() => setIsScanning(true), 1000);
  };

  const isBase64 = (str) => {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  };

  const handleModalClose = (setter) => {
    setter(false);
    setTimeout(() => setIsScanning(true), 1000);
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
    <View style={styles.root}>
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
        message={`Log ${pendingAttendanceData?.typeLabel} for:\nStudent: ${pendingAttendanceData?.student_id_number}\nEvent: ${pendingAttendanceData?.event_name}`}
        type="warning"
        onClose={cancelAttendance}
        onCancel={cancelAttendance}
        confirmTitle="Yes"
        onConfirm={confirmAttendance}
        cancelTitle="No"
      />

      <View style={styles.centerZone}>
        <View style={styles.cameraWrapper}>
          <CameraView
            key={cameraKey}
            style={styles.camera}
            facing="back"
            active={isFocused}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={!isScanning ? undefined : handleBarcodeScanned}
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={() => {}}
            animateShutter={false}
            enableTorch={false}
          />

          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.dimTop} />
            <View style={styles.scanRow}>
              <View style={styles.dimSide} />
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineAnim }] },
                  ]}
                />
              </View>
              <View style={styles.dimSide} />
            </View>
            <View style={styles.dimBottom}>
              <View style={styles.statusRow}>
                <Animated.View
                  style={[styles.statusDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.statusText}>SCANNING</Text>
              </View>
            </View>
          </View>

          {!isCameraReady && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading camera...</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomStrip}>
          <Text style={styles.instructions}>
            Align QR code within the frame
          </Text>
          <Text style={styles.clock}>{clockTime}</Text>
        </View>

        <TouchableOpacity style={styles.reloadButton} onPress={reloadCamera}>
          <Image source={icons.scanner} style={styles.reloadIcon} />
          <Text style={styles.reloadButtonText}>RELOAD CAMERA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabSpacer} />
      <StatusBar style="light" />
    </View>
  );
};

export default Scan;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.medium,
  },
  centerZone: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.small,
    paddingBottom: 80,
  },
  cameraWrapper: {
    height: 420,
    width: "100%",
    borderRadius: theme.borderRadius.large,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dimTop: {
    flex: 1,
    backgroundColor: DIM,
  },
  scanRow: {
    flexDirection: "row",
    height: SCAN_FRAME_SIZE,
  },
  dimSide: {
    flex: 1,
    backgroundColor: DIM,
  },
  dimBottom: {
    flex: 1,
    backgroundColor: DIM,
    justifyContent: "center",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.green,
  },
  statusText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: "#ffffff",
    letterSpacing: 3,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#ffffff",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
  },
  bottomStrip: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instructions: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.55,
  },
  clock: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  reloadButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: theme.spacing.small,
    paddingHorizontal: theme.spacing.large,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  reloadIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
  },
  reloadButtonText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
});
