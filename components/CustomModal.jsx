import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import theme from "../constants/theme";
import icons from "../constants/icons";

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
  let iconSource;
  let iconTint = theme.colors.primary;
  if (type === "success") {
    iconSource = icons.success;
    iconTint = theme.colors.green;
  } else if (type === "error") {
    iconSource = icons.error;
    iconTint = "#C62828";
  } else if (type === "warning") {
    iconSource = icons.warning;
    iconTint = "#E65100";
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose || onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {iconSource && (
            <View style={[styles.iconWrap, { backgroundColor: iconTint + "15" }]}>
              <Image
                source={iconSource}
                style={[styles.icon, { tintColor: iconTint }]}
              />
            </View>
          )}

          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            {onConfirm && (
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.8}>
                <Text style={styles.confirmButtonText}>{confirmTitle}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.cancelButton, !onConfirm && styles.cancelButtonFull]}
              onPress={onCancel || onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, !onConfirm && styles.cancelButtonTextSingle]}>
                {cancelTitle}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.large,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.medium,
  },
  icon: {
    width: 32,
    height: 32,
  },
  title: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.spacing.xsmall,
  },
  message: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.65,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: theme.spacing.large,
  },
  actions: {
    width: "100%",
    gap: theme.spacing.small,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    height: 46,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.small,
  },
  cancelButtonFull: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    height: 46,
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    opacity: 0.5,
  },
  cancelButtonTextSingle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
    color: theme.colors.secondary,
    opacity: 1,
  },
});
