import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import theme from "../constants/theme";
import images from "../constants/images";

const TimePickerComponent = ({
  label,
  title,
  onTimeChange,
  selectedValue = null,
  defaultValue = null,
  allowAM = true,
  allowPM = true,
}) => {
  const [finalAllowAM, setFinalAllowAM] = useState(allowAM);
  const [finalAllowPM, setFinalAllowPM] = useState(allowPM);

  useEffect(() => {
    if (allowPM === true) {
      setFinalAllowAM(false);
      setFinalAllowPM(true);
    } else if (allowAM === true) {
      setFinalAllowPM(false);
      setFinalAllowAM(true);
    } else {
      setFinalAllowAM(allowAM);
      setFinalAllowPM(allowPM);
    }
  }, [allowAM, allowPM]);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(selectedValue || null);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);

  const convertTo12HourFormat = useCallback((h24, min) => {
    const isPM = h24 >= 12;
    const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
    const formattedTime = `${h24.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}:00`;
    const displayTime = `${h12.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
    return { formattedTime, displayTime };
  }, []);

  // AM only: 12(midnight)=0, 01–11
  // PM only: 12(noon)=12, 01 PM=13, … 11 PM=23
  // Both:    01–12 (value = display hour, AM/PM determined separately)
  const hourOptions = useMemo(() => {
    if (finalAllowAM && !finalAllowPM) {
      return Array.from({ length: 12 }, (_, i) => ({
        label: i === 0 ? "12" : String(i).padStart(2, "0"),
        value: i,
      }));
    }
    if (!finalAllowAM && finalAllowPM) {
      return Array.from({ length: 12 }, (_, i) => ({
        label: i === 0 ? "12" : String(i).padStart(2, "0"),
        value: i === 0 ? 12 : i + 12,
      }));
    }
    return Array.from({ length: 12 }, (_, i) => ({
      label: String(i + 1).padStart(2, "0"),
      value: i + 1,
    }));
  }, [finalAllowAM, finalAllowPM]);

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: String(i * 5).padStart(2, "0"),
        value: i * 5,
      })),
    []
  );

  const parseSelectedTime = useCallback((timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(" ");
    if (parts.length !== 2) return null;
    const [hStr, mStr] = parts[0].split(":");
    const h12 = parseInt(hStr, 10);
    const min = parseInt(mStr, 10);
    const isPM = parts[1] === "PM";
    const h24 = isPM
      ? h12 === 12 ? 12 : h12 + 12
      : h12 === 12 ? 0 : h12;
    return { h24, min };
  }, []);

  const parseFormattedTime = useCallback((timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length < 2) return null;
    return { h24: parseInt(parts[0], 10), min: parseInt(parts[1], 10) };
  }, []);

  const openPicker = () => {
    const parsed = parseSelectedTime(selectedTime);
    if (parsed) {
      setPickerHour(parsed.h24);
      setPickerMinute(parsed.min);
    } else if (defaultValue) {
      const parsedDefault = parseFormattedTime(defaultValue);
      if (parsedDefault) {
        setPickerHour(parsedDefault.h24);
        setPickerMinute(parsedDefault.min);
      }
    } else {
      setPickerHour(finalAllowAM && !finalAllowPM ? 8 : 13);
      setPickerMinute(0);
    }
    setShowPicker(true);
  };

  const handleConfirm = () => {
    const { formattedTime, displayTime } = convertTo12HourFormat(
      pickerHour,
      pickerMinute
    );
    setSelectedTime(displayTime);
    onTimeChange?.(formattedTime);
    setShowPicker(false);
  };

  const handleCancel = () => setShowPicker(false);

  const handleClear = () => {
    setSelectedTime(null);
    onTimeChange?.(null);
    setShowPicker(false);
  };

  const hasSelection = !!selectedTime;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.titleText}>{title}</Text>}
      <TouchableOpacity
        style={[styles.pickerButton, hasSelection && styles.pickerButtonFilled]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel="Open time picker"
      >
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.buttonContent}>
          <Image
            source={images.calendarStar}
            style={[styles.clockIcon, hasSelection && styles.iconFilled]}
          />
          <Text
            style={[styles.dateDisplay, hasSelection && styles.dateDisplayFilled]}
          >
            {selectedTime || "Select time"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {title || label || "Select Time"}
              </Text>
            </View>

            <View style={styles.pickerWrapper}>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={pickerHour}
                  onValueChange={(val) => setPickerHour(val)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {hourOptions.map((opt) => (
                    <Picker.Item
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      color={theme.colors.primary}
                    />
                  ))}
                </Picker>
                <Text style={styles.pickerSeparator}>:</Text>
                <Picker
                  selectedValue={pickerMinute}
                  onValueChange={(val) => setPickerMinute(val)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {minuteOptions.map((opt) => (
                    <Picker.Item
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      color={theme.colors.primary}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TimePickerComponent;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  pickerButton: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    minHeight: 46,
  },
  pickerButtonFilled: {
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
  },
  clockIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  iconFilled: {
    tintColor: theme.colors.secondary,
  },
  dateDisplay: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
  },
  dateDisplayFilled: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.ArialBold,
  },
  label: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.xsmall,
  },
  titleText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
    paddingBottom: theme.spacing.small,
    fontFamily: theme.fontFamily.ArialBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.medium,
  },
  modalCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    width: "100%",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
  },
  modalTitle: {
    textAlign: "center",
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
  pickerWrapper: {
    paddingVertical: theme.spacing.small,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.medium,
  },
  picker: {
    flex: 1,
    color: theme.colors.primary,
  },
  pickerItem: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.large,
  },
  pickerSeparator: {
    fontSize: 24,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.xsmall,
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary + "33",
  },
  clearBtn: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: theme.colors.primary + "33",
  },
  clearBtnText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.gray,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: theme.colors.primary + "33",
  },
  cancelBtnText: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.gray,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  confirmBtnText: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
});
