import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  uploadSchoolYearFile,
  changeSchoolYear,
  getCurrentSchoolYear,
} from "../../../../services/api/schoolYears";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import CustomModal from "../../../../components/CustomModal";
import theme from "../../../../constants/theme";

const pickDocument = async (
  type,
  setUploading,
  setMessage,
  setSuccessModalVisible,
  fetchCurrentSchoolYear
) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedFile = result.assets[0];
      setUploading(true);
      setMessage("Uploading file...");

      try {
        let response;
        if (type === "changeSchoolYear") {
          response = await changeSchoolYear(selectedFile.uri);

          await fetchCurrentSchoolYear();
          setMessage("Semester changed successfully!");
        } else {
          response = await uploadSchoolYearFile(selectedFile.uri, type);
          setMessage("Upload successful!");
        }

        setSuccessModalVisible(true);
      } catch (error) {
        console.error("Error uploading file:", error);
        setMessage("Error uploading file.");
      }
    } else {
      setMessage("File picking cancelled.");
    }
  } catch (error) {
    console.error("Document pick error:", error);
    setMessage("Error picking file.");
  } finally {
    setUploading(false);
  }
};

export default function SchoolYearScreen() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchCurrentSchoolYear();
  }, []);

  const handleChangeSchoolYear = () => {
    setModalType("changeSchoolYear");
    setModalVisible(true);
  };

  const handleUpdateStudentList = () => {
    setModalType("updateStudentList");
    setModalVisible(true);
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (modalType === "changeSchoolYear") {
      setTimeout(() => {
        pickDocument(
          "changeSchoolYear",
          setUploading,
          setMessage,
          setSuccessModalVisible,
          fetchCurrentSchoolYear
        );
      }, 300);
    } else if (modalType === "updateStudentList") {
      setTimeout(() => {
        pickDocument(
          "updateStudentList",
          setUploading,
          setMessage,
          setSuccessModalVisible,
          fetchCurrentSchoolYear
        );
      }, 300);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
  };

  return (
    <View style={globalStyles.secondaryContainer}>
      <View style={styles.buttonWrapper}>
        <View style={styles.currentSyContainer}>
          <Text style={styles.label}>Current School Year</Text>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : currentSchoolYear ? (
            <Text style={styles.currentSy}>
              {currentSchoolYear.school_year} - {currentSchoolYear.semester}
            </Text>
          ) : (
            <Text style={styles.currentSy}>No active school year</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Change Semester"
            onPress={handleChangeSchoolYear}
          />
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Update Student List"
            onPress={handleUpdateStudentList}
            type="secondary"
          />
        </View>
      </View>

      <CustomModal
        visible={modalVisible}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalVisible(false)}
        title={
          modalType === "changeSchoolYear"
            ? "Change Semester"
            : "Update Student List"
        }
        message={
          modalType === "changeSchoolYear"
            ? "Are you sure you want to change the semester and create new blocks based on the uploaded CSV file?"
            : "Are you sure you want to update the student list based on the uploaded CSV file?"
        }
        confirmTitle="Confirm"
      />

      <CustomModal
        visible={successModalVisible}
        onClose={handleSuccessModalClose}
        title="Success"
        message={
          modalType === "changeSchoolYear"
            ? "The semesterhas been changed successfully."
            : "The student list has been updated successfully."
        }
        type="success"
        cancelTitle="CLOSE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: "100%",
    paddingHorizontal: theme.spacing.medium,
  },
  buttonContainer: {
    paddingBottom: theme.spacing.medium,
  },
  label: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.huge,
  },
  currentSyContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.large,
  },
  currentSy: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.extraLarge,
  },
});
