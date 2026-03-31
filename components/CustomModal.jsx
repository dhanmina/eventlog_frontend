import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import theme from "../constants/theme";
import icons from "../constants/icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const CustomModal = ({
  visible,
  title,
  message,
  type,
  onClose,
  onCancel,
  onConfirm,
  cancelTitle = "Cancel",
  confirmTitle = "Confirm",
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [visible]);

  let iconSource;
  if (type === "success") {
    iconSource = icons.success;
  } else if (type === "error") {
    iconSource = icons.error;
  } else if (type === "warning") {
    iconSource = icons.warning;
  }

  const modalWidth = screenWidth * 0.8;
  const modalHeight = 280;
  const centerX = (screenWidth - modalWidth) / 2;
  const centerY = (screenHeight - modalHeight) / 2;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose || onCancel}
    >
      <View style={styles.overlay}>
        {showContent && (
          <View
            style={[
              styles.modalContainer,
              {
                position: "absolute",
                left: centerX,
                top: centerY,
                width: modalWidth,
              },
            ]}
          >
            {iconSource && <Image source={iconSource} style={styles.icon} />}
            {title && <Text style={styles.title}>{title}</Text>}
            <Text style={styles.message}>{message}</Text>
            <View
              style={[
                styles.buttonContainer,
                { justifyContent: onConfirm ? "space-between" : "center" },
              ]}
            >
              <TouchableOpacity
                onPress={onCancel || onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>{cancelTitle}</Text>
              </TouchableOpacity>

              {onConfirm && (
                <TouchableOpacity
                  onPress={onConfirm}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>{confirmTitle}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 100,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSizes.huge,
    color: theme.colors.primary,
    marginBottom: 10,
    fontFamily: "SquadaOne",
    textAlign: "center",
  },
  message: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
    marginBottom: 20,
    fontFamily: "Arial",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    width: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    fontFamily: "SquadaOne",
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    width: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.large,
    fontFamily: "SquadaOne",
  },
  icon: {
    width: 100,
    height: 100,
    tintColor: theme.colors.primary,
    marginBottom: theme.spacing.medium,
  },
});

export default CustomModal;
