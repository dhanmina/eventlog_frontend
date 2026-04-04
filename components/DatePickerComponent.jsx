import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import theme from "../constants/theme";
import icons from "../constants/icons";

const DatePickerComponent = ({
  label,
  title,
  onDateChange,
  selectedValue: initialSelectedValues = [],
  mode = "multiple",
  fetchData,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDatesInternal, setSelectedDatesInternal] = useState(() => {
    if (Array.isArray(initialSelectedValues)) {
      return initialSelectedValues
        .map((date) => new Date(date))
        .sort((a, b) => a - b);
    }
    return [];
  });

  const [tempDate, setTempDate] = useState(new Date());
  const [pendingDates, setPendingDates] = useState([]);

  const [initiallyFetchedDates, setInitiallyFetchedDates] = useState([]);
  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    const populateDatesFromFetch = async () => {
      if (typeof fetchData === "function" && !hasFetchedInitial.current) {
        try {
          const response = await fetchData();
          if (response?.success && response?.event?.all_dates) {
            const fetchedDate = new Date(response.event.all_dates);
            if (!isNaN(fetchedDate)) {
              const formattedFetchedDate = formatDateValue(fetchedDate);

              if (
                mode === "multiple" &&
                !initiallyFetchedDates.some(
                  (d) => formatDateValue(d) === formattedFetchedDate,
                )
              ) {
                const newInit = [...initiallyFetchedDates, fetchedDate].sort(
                  (a, b) => a - b,
                );
                setInitiallyFetchedDates(newInit);

                const newSelected = [
                  ...selectedDatesInternal,
                  fetchedDate,
                ].sort((a, b) => a - b);
                setSelectedDatesInternal(newSelected);
                onDateChange?.(newSelected.map(formatDateValue));
              } else if (mode === "single") {
                setInitiallyFetchedDates([fetchedDate]);
                setSelectedDatesInternal([fetchedDate]);
                onDateChange?.(formatDateValue(fetchedDate));
              }

              hasFetchedInitial.current = true;
            }
          }
        } catch (error) {
          console.error("Error fetching initial dates:", error.message);
        }
      }
    };

    populateDatesFromFetch();
  }, [mode, onDateChange, initialSelectedValues, fetchData]);

  const formatDisplayDate = (date) => {
    if (!date) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const formatDateValue = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openModal = () => {
    setPendingDates([...selectedDatesInternal]);
    setTempDate(
      selectedDatesInternal.length > 0 ? selectedDatesInternal[0] : new Date(),
    );
    setShowPicker(true);
  };

  const handleDateChange = (_event, selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleAddDate = () => {
    if (!tempDate) return;
    if (isDateInPast(tempDate)) return;
    const formattedValue = formatDateValue(tempDate);
    const alreadyAdded = pendingDates.some(
      (d) => formatDateValue(d) === formattedValue,
    );
    if (!alreadyAdded) {
      setPendingDates([...pendingDates, tempDate].sort((a, b) => a - b));
    }
  };

  const handleRemovePending = (dateToRemove) => {
    setPendingDates(
      pendingDates.filter(
        (d) => formatDateValue(d) !== formatDateValue(dateToRemove),
      ),
    );
  };

  const handleDone = () => {
    setSelectedDatesInternal(pendingDates);
    onDateChange?.(pendingDates.map(formatDateValue));
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleSingleConfirm = () => {
    if (!tempDate) return;
    setSelectedDatesInternal([tempDate]);
    onDateChange?.(formatDateValue(tempDate));
    setShowPicker(false);
  };

  const handleRemoveDate = (dateToRemove) => {
    const newDates = selectedDatesInternal.filter(
      (d) => formatDateValue(d) !== formatDateValue(dateToRemove),
    );
    setSelectedDatesInternal(newDates);
    onDateChange?.(newDates.map(formatDateValue));
  };

  const count = selectedDatesInternal.length;

  const buttonLabel =
    mode === "multiple"
      ? count > 0
        ? `${count} date${count > 1 ? "s" : ""} selected`
        : "Select dates"
      : count > 0
        ? formatDisplayDate(selectedDatesInternal[0])
        : "Select date";

  const hasSelection = count > 0;

  const isAlreadyPending =
    tempDate &&
    pendingDates.some((d) => formatDateValue(d) === formatDateValue(tempDate));

  const isPastDate = tempDate && isDateInPast(tempDate);

  return (
    <View>
      {title && <Text style={styles.titleText}>{title}</Text>}
      <TouchableOpacity
        style={[styles.container, hasSelection && styles.containerFilled]}
        onPress={openModal}
        accessibilityRole="button"
        accessibilityLabel="Open date picker"
      >
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.buttonContent}>
          <Image
            source={icons.calendar}
            style={[styles.calendarIcon, hasSelection && styles.iconFilled]}
          />
          <Text
            style={[
              styles.dateDisplay,
              hasSelection && styles.dateDisplayFilled,
            ]}
          >
            {buttonLabel}
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
                {mode === "multiple" ? "Select Dates" : "Select Date"}
              </Text>
            </View>

            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                style={styles.picker}
              />
            </View>

            {mode === "multiple" && (
              <View style={styles.multiSection}>
                <TouchableOpacity
                  style={[
                    styles.addDateBtn,
                    isAlreadyPending && styles.removeDateBtn,
                    isPastDate && styles.addDateBtnPast,
                  ]}
                  onPress={
                    isAlreadyPending
                      ? () => handleRemovePending(tempDate)
                      : handleAddDate
                  }
                  disabled={isPastDate}
                >
                  <Text
                    style={[
                      styles.addDateBtnText,
                      isAlreadyPending && styles.removeDateBtnText,
                      isPastDate && styles.addDateBtnPastText,
                    ]}
                  >
                    {isPastDate
                      ? "Past dates cannot be added"
                      : isAlreadyPending
                        ? "− Remove Selected Date"
                        : "+ Add Selected Date"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.pendingList}>
                  <Text style={styles.pendingTitle}>
                    DATES TO SAVE ({pendingDates.length})
                  </Text>
                  <ScrollView
                    style={styles.pendingScroll}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled
                  >
                    {pendingDates.length === 0 ? (
                      <Text style={styles.pendingEmpty}>
                        No dates added yet
                      </Text>
                    ) : (
                      pendingDates.map((date) => (
                        <View key={date.toISOString()} style={styles.dateRow}>
                          <Text style={styles.selectedDateItem}>
                            {formatDisplayDate(date)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemovePending(date)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Image
                              source={icons.close}
                              style={styles.removeIcon}
                            />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={mode === "multiple" ? handleDone : handleSingleConfirm}
              >
                <Text style={styles.confirmBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {mode === "multiple" && count > 0 && (
        <View style={styles.selectedDatesDisplay}>
          <Text style={styles.selectedDatesTitle}>SELECTED DATES</Text>
          {selectedDatesInternal.map((date) => (
            <View key={date.toISOString()} style={styles.dateRow}>
              <Text style={styles.selectedDateItem}>
                {formatDisplayDate(date)}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveDate(date)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Image source={icons.close} style={styles.removeIcon} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default DatePickerComponent;

const styles = StyleSheet.create({
  container: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    minHeight: 46,
  },
  containerFilled: {
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
  },
  calendarIcon: {
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
  selectedDatesDisplay: {
    marginTop: theme.spacing.small,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  selectedDatesTitle: {
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary + "22",
  },
  selectedDateItem: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    flex: 1,
  },
  removeIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
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
    maxHeight: "90%",
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
    alignItems: "center",
  },
  picker: {
    width: "100%",
  },
  multiSection: {
    paddingHorizontal: theme.spacing.medium,
    paddingBottom: theme.spacing.small,
  },
  addDateBtn: {
    marginHorizontal: theme.spacing.medium,
    marginTop: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  removeDateBtn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  addDateBtnText: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
  },
  removeDateBtnText: {
    color: theme.colors.secondary,
  },
  addDateBtnPast: {
    borderColor: theme.colors.placeholder,
    backgroundColor: "transparent",
    opacity: 0.5,
  },
  addDateBtnPastText: {
    color: theme.colors.placeholder,
  },
  pendingList: {
    marginTop: theme.spacing.small,
    marginHorizontal: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  pendingTitle: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xsmall,
  },
  pendingScroll: {
    height: 140,
  },
  pendingEmpty: {
    color: theme.colors.placeholder,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.small,
    textAlign: "center",
    paddingVertical: theme.spacing.medium,
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary + "33",
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
  confirmBtnDisabled: {
    backgroundColor: theme.colors.placeholder,
  },
  confirmBtnText: {
    fontFamily: theme.fontFamily.ArialBold,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
  },
});
