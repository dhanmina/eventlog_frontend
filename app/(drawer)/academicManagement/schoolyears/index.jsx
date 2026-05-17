import { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  uploadSchoolYearFile,
  changeSchoolYear,
  getCurrentSchoolYear,
} from "../../../../services/api";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import CustomModal from "../../../../components/CustomModal";
import theme from "../../../../constants/theme";

const FLOW_TYPES = {
  changeSchoolYear: "changeSchoolYear",
  updateStudentList: "updateStudentList",
};

const FLOW_CONTENT = {
  [FLOW_TYPES.changeSchoolYear]: {
    buttonTitle: "Change Semester",
    confirmTitle: "Change Semester",
    confirmMessage:
      "Are you sure you want to change the semester based on the uploaded file?",
    successMessage: "The semester has been changed successfully.",
  },
  [FLOW_TYPES.updateStudentList]: {
    buttonTitle: "Update Student List",
    confirmTitle: "Update Student List",
    confirmMessage:
      "Are you sure you want to update the student list based on the uploaded file?",
    successMessage: "The student list has been updated successfully.",
  },
};

const ALLOWED_FILE_EXTENSIONS = ["csv", "xlsx"];

const getFileExtension = (fileName = "") =>
  fileName.toLowerCase().split(".").pop();

const isAllowedFileExtension = (extension) =>
  ALLOWED_FILE_EXTENSIONS.includes(extension);

export default function SchoolYearScreen() {
  const [uploading, setUploading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);

  const fetchCurrentSchoolYear = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCurrentSchoolYear();
      setCurrentSchoolYear(
        response.success && response.data ? response.data : null
      );
    } catch {
      setCurrentSchoolYear(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentSchoolYear();
  }, [fetchCurrentSchoolYear]);

  const activeFlowContent = useMemo(
    () =>
      FLOW_CONTENT[confirmModalType] ||
      FLOW_CONTENT[FLOW_TYPES.updateStudentList],
    [confirmModalType]
  );

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalVisible(false);
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
  };

  const closeErrorModal = () => {
    setErrorModalVisible(false);
  };

  const pickFile = async (flowType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const extension = getFileExtension(file.name);

      if (!isAllowedFileExtension(extension)) {
        showErrorModal("Only CSV or Excel (.xlsx) files are allowed.");
        return;
      }

      setPendingFile(file);
      setConfirmModalType(flowType);
      setConfirmModalVisible(true);
    } catch {
      showErrorModal("Error picking file.");
    }
  };

  const handleConfirmUpload = async () => {
    closeConfirmModal();
    setUploading(true);
    try {
      if (confirmModalType === FLOW_TYPES.changeSchoolYear) {
        await changeSchoolYear(pendingFile);
        await fetchCurrentSchoolYear();
      } else {
        await uploadSchoolYearFile(pendingFile, confirmModalType);
      }
      setSuccessModalVisible(true);
    } catch (error) {
      showErrorModal(error?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <Text style={styles.headerText}>SCHOOL YEAR</Text>

      <View style={styles.currentSyContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={styles.currentSy}>
            {currentSchoolYear
              ? `${currentSchoolYear.school_year} — ${currentSchoolYear.semester}`
              : "No active school year"}
          </Text>
        )}
      </View>

      <View style={styles.buttonWrapper}>
        <View style={styles.buttonContainer}>
          <CustomButton
            title={
              uploading
                ? "Uploading..."
                : FLOW_CONTENT[FLOW_TYPES.changeSchoolYear].buttonTitle
            }
            onPress={() => pickFile(FLOW_TYPES.changeSchoolYear)}
            disabled={uploading}
          />
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            title={
              uploading
                ? "Uploading..."
                : FLOW_CONTENT[FLOW_TYPES.updateStudentList].buttonTitle
            }
            onPress={() => pickFile(FLOW_TYPES.updateStudentList)}
            disabled={uploading}
            type="secondary"
          />
        </View>
      </View>

      <CustomModal
        visible={confirmModalVisible}
        onConfirm={handleConfirmUpload}
        onCancel={closeConfirmModal}
        title={activeFlowContent.confirmTitle}
        message={activeFlowContent.confirmMessage}
        confirmTitle="Confirm"
      />

      <CustomModal
        visible={successModalVisible}
        onClose={closeSuccessModal}
        title="Success"
        message={activeFlowContent.successMessage}
        type="success"
        cancelTitle="CLOSE"
      />

      <CustomModal
        visible={errorModalVisible}
        onClose={closeErrorModal}
        title="Upload Failed"
        message={errorMessage}
        type="error"
        cancelTitle="CLOSE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  currentSyContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.large,
  },
  currentSy: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraLarge,
    textAlign: "center",
  },
  buttonWrapper: {
    width: "100%",
    paddingHorizontal: theme.spacing.medium,
  },
  buttonContainer: {
    paddingBottom: theme.spacing.medium,
  },
});
