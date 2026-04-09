import { useState, useEffect } from "react";
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

  const fetchCurrentSchoolYear = async () => {
    try {
      setLoading(true);
      const response = await getCurrentSchoolYear();
      setCurrentSchoolYear(response.success && response.data ? response.data : null);
    } catch {
      setCurrentSchoolYear(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSchoolYear();
  }, []);

  const pickFile = async (flowType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const ext = file.name?.toLowerCase().split(".").pop();

      if (ext !== "csv" && ext !== "xlsx") {
        setErrorMessage("Only CSV or Excel (.xlsx) files are allowed.");
        setErrorModalVisible(true);
        return;
      }

      setPendingFile(file);
      setConfirmModalType(flowType);
      setConfirmModalVisible(true);
    } catch {
      setErrorMessage("Error picking file.");
      setErrorModalVisible(true);
    }
  };

  const handleConfirmUpload = async () => {
    setConfirmModalVisible(false);
    setUploading(true);
    try {
      if (confirmModalType === "changeSchoolYear") {
        await changeSchoolYear(pendingFile);
        await fetchCurrentSchoolYear();
      } else {
        await uploadSchoolYearFile(pendingFile, confirmModalType);
      }
      setSuccessModalVisible(true);
    } catch (error) {
      setErrorMessage(error?.message || "Upload failed. Please try again.");
      setErrorModalVisible(true);
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
            title={uploading ? "Uploading..." : "Change Semester"}
            onPress={() => pickFile("changeSchoolYear")}
            disabled={uploading}
          />
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            title={uploading ? "Uploading..." : "Update Student List"}
            onPress={() => pickFile("updateStudentList")}
            disabled={uploading}
            type="secondary"
          />
        </View>
      </View>

      <CustomModal
        visible={confirmModalVisible}
        onConfirm={handleConfirmUpload}
        onCancel={() => setConfirmModalVisible(false)}
        title={
          confirmModalType === "changeSchoolYear"
            ? "Change Semester"
            : "Update Student List"
        }
        message={
          confirmModalType === "changeSchoolYear"
            ? "Are you sure you want to change the semester based on the uploaded file?"
            : "Are you sure you want to update the student list based on the uploaded file?"
        }
        confirmTitle="Confirm"
      />

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

      <CustomModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
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
