import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  uploadSchoolYearFile,
  changeSchoolYear,
  getCurrentSchoolYear,
} from "../../../../services/api/schoolYears";
import { fetchDepartments } from "../../../../services/api/departments";
import { fetchCoursesByDepartmentId } from "../../../../services/api/courses";
import globalStyles from "../../../../constants/globalStyles";
import CustomModal from "../../../../components/CustomModal";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";

export default function SchoolYearScreen() {
  const [uploading, setUploading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null);
  const [loading, setLoading] = useState(true);

  // XLSX-specific state
  const [xlsxModalVisible, setXlsxModalVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingActionType, setPendingActionType] = useState("");
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCurrentSchoolYear = async () => {
    try {
      setLoading(true);
      const response = await getCurrentSchoolYear();
      if (response.success && response.data) {
        setCurrentSchoolYear(response.data);
      } else {
        setCurrentSchoolYear(null);
      }
    } catch (error) {
      console.error("Failed to fetch current semester:", error);
      setCurrentSchoolYear(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchCurrentSchoolYear();
  }, []));

  const handleActionPress = (type) => {
    setConfirmModalType(type);
    setConfirmModalVisible(true);
  };

  const handleConfirm = () => {
    setConfirmModalVisible(false);
    setTimeout(() => handleFilePick(confirmModalType), 300);
  };

  const handleFilePick = async (actionType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const isExcel = file.name.endsWith(".xlsx");

        if (isExcel) {
          setPendingFile(file);
          setPendingActionType(actionType);
          setSelectedDept(null);
          setSelectedCourse(null);
          setCourses([]);
          await loadDepartments();
          setXlsxModalVisible(true);
        } else {
          await uploadFile(file, actionType);
        }
      }
    } catch (error) {
      console.error("Document pick error:", error);
    }
  };

  const loadDepartments = async () => {
    try {
      setLoadingDepts(true);
      const response = await fetchDepartments();
      const active = (response.departments || []).filter(
        (d) => d.status === "Active"
      );
      setDepartments(
        active.map((d) => ({
          label: d.department_name,
          value: d.department_id,
          code: d.department_code,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleDeptSelect = async (item) => {
    setSelectedDept(item);
    setSelectedCourse(null);
    setCourses([]);

    if (!item) return;

    try {
      setLoadingCourses(true);
      const data = await fetchCoursesByDepartmentId(item.value);
      const active = (data || []).filter((c) => c.status === "Active");
      setCourses(
        active.map((c) => ({
          label: c.course_name,
          value: c.course_id,
          code: c.course_code,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleXlsxUpload = async () => {
    if (!selectedDept || !selectedCourse || !pendingFile) return;
    setXlsxModalVisible(false);
    await uploadFile(pendingFile, pendingActionType, {
      department_code: selectedDept.code,
      course_code: selectedCourse.code,
    });
  };

  const handleXlsxCancel = () => {
    setXlsxModalVisible(false);
    setPendingFile(null);
    setPendingActionType("");
    setSelectedDept(null);
    setSelectedCourse(null);
    setCourses([]);
  };

  const uploadFile = async (file, actionType, extraFields = {}) => {
    setUploading(true);
    try {
      if (actionType === "changeSchoolYear") {
        await changeSchoolYear(file, extraFields);
        await fetchCurrentSchoolYear();
      } else {
        await uploadSchoolYearFile(file, actionType, extraFields);
      }
      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const actions = [
    {
      key: "changeSchoolYear",
      icon: icons.school,
      title: "Change Semester",
      description: "Upload a CSV or XLSX to set the new semester and generate blocks.",
    },
    {
      key: "updateStudentList",
      icon: icons.student,
      title: "Update Student List",
      description: "Upload a CSV or XLSX to update enrolled students for the semester.",
    },
  ];

  const canUploadXlsx = selectedDept && selectedCourse && !uploading;

  return (
    <View style={globalStyles.secondaryContainer}>
      {/* Confirm modal */}
      <CustomModal
        visible={confirmModalVisible}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModalVisible(false)}
        title={confirmModalType === "changeSchoolYear" ? "Change Semester" : "Update Student List"}
        message={
          confirmModalType === "changeSchoolYear"
            ? "Are you sure you want to change the semester and create new blocks based on the uploaded file?"
            : "Are you sure you want to update the student list based on the uploaded file?"
        }
        confirmTitle="Confirm"
        type="warning"
      />

      {/* Success modal */}
      <CustomModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Success"
        message={
          confirmModalType === "changeSchoolYear"
            ? "The semester has been changed successfully."
            : "The student list has been updated successfully."
        }
        type="success"
        cancelTitle="CLOSE"
      />

      {/* Error modal */}
      <CustomModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Upload Failed"
        message="Something went wrong while uploading the file. Please try again."
        type="error"
        cancelTitle="CLOSE"
      />

      {/* XLSX department + course sheet */}
      <Modal
        visible={xlsxModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleXlsxCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handleBar} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>SELECT DEPARTMENT & COURSE</Text>
                <Text style={styles.sheetSubtitle}>Required for Excel uploads</Text>
              </View>
              <TouchableOpacity onPress={handleXlsxCancel} style={styles.closeBtn}>
                <Image source={icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              {loadingDepts ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginBottom: theme.spacing.medium }} />
              ) : (
                <CustomDropdown
                  title="Department"
                  data={departments}
                  placeholder="Select department..."
                  onSelect={handleDeptSelect}
                  value={selectedDept}
                />
              )}

              {selectedDept && (
                loadingCourses ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginBottom: theme.spacing.medium }} />
                ) : (
                  <CustomDropdown
                    title="Course"
                    data={courses}
                    placeholder={courses.length ? "Select course..." : "No active courses"}
                    onSelect={(item) => setSelectedCourse(item)}
                    value={selectedCourse}
                  />
                )
              )}

              {!selectedDept && (
                <Text style={styles.hintText}>Select a department to load its courses.</Text>
              )}

              <View style={styles.sheetActions}>
                <CustomButton
                  title="UPLOAD"
                  onPress={handleXlsxUpload}
                  disabled={!canUploadXlsx}
                />
              </View>

              <TouchableOpacity onPress={handleXlsxCancel} style={styles.cancelRow}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header card */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>SCHOOL YEAR</Text>
        <Text style={styles.headerSubtitle}>Manage semester and student records</Text>
        <View style={styles.headerFooter}>
          <Image source={icons.calendar} style={styles.headerFooterIcon} />
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} />
          ) : (
            <Text style={styles.headerStat}>
              {currentSchoolYear
                ? `${currentSchoolYear.school_year} — ${currentSchoolYear.semester}`
                : "No active semester"}
            </Text>
          )}
        </View>
      </View>

      {/* Action cards */}
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionCard, uploading && styles.actionCardDisabled]}
            onPress={() => handleActionPress(action.key)}
            activeOpacity={0.75}
            disabled={uploading}
          >
            <View style={styles.actionLeft} />
            <View style={styles.actionIconWrap}>
              <Image source={action.icon} style={styles.actionIcon} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </View>
            <Image source={icons.arrowRight} style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </View>

      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.uploadingText}>Uploading file...</Text>
        </View>
      )}

      <View style={styles.tabSpacer} />
    </View>
  );
}

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
  headerFooterIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.secondary,
    opacity: 0.6,
  },
  headerStat: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  actionsContainer: {
    width: "100%",
    gap: theme.spacing.small,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.1)",
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
  actionCardDisabled: {
    opacity: 0.45,
  },
  actionLeft: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.small,
    backgroundColor: "rgba(37,85,134,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.medium,
    marginVertical: theme.spacing.medium,
  },
  actionIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  actionBody: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.small,
    gap: 3,
  },
  actionTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  actionDesc: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  chevron: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    opacity: 0.3,
    marginRight: theme.spacing.medium,
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
    marginTop: theme.spacing.medium,
  },
  uploadingText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.6,
  },
  tabSpacer: {
    height: 80,
  },
  // XLSX bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.secondary,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    paddingBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(37,85,134,0.2)",
    borderRadius: 2,
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
  sheetTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  sheetSubtitle: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.45,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xsmall,
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
    opacity: 0.5,
  },
  sheetBody: {
    padding: theme.spacing.medium,
  },
  hintText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraSmall,
    color: theme.colors.primary,
    opacity: 0.4,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  sheetActions: {
    marginTop: theme.spacing.small,
  },
  cancelRow: {
    alignItems: "center",
    paddingVertical: theme.spacing.small,
    marginTop: theme.spacing.xsmall,
  },
  cancelText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.5,
  },
});
