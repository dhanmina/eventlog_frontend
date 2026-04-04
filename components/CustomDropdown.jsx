import { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import theme from "../constants/theme";

const CustomDropdown = ({
  data = [],
  placeholder = "Select an option",
  onSelect,
  value: initialValue,
  title,
  display = "rounded",
  titleColor = "primary",
  borderColor = "primary",
  multiSelect = false,
  fontFamily = "Arial",
  placeholderFontSize = theme.fontSizes.medium,
  placeholderColor = theme.colors.placeholder,
  selectedEventColor = theme.colors.primary,
  selectedEventFont = "Arial",
  selectedEventFontSize = theme.fontSizes.medium,
}) => {
  const [value, setValue] = useState(initialValue || (multiSelect ? [] : null));
  const [isFocused, setIsFocused] = useState(false);
  const [selectAllLabel, setSelectAllLabel] = useState("Select All");

  useEffect(() => {
    setValue(initialValue || (multiSelect ? [] : null));
  }, [initialValue, multiSelect]);

  useEffect(() => {
    if (multiSelect && data.length > 0) {
      setSelectAllLabel(value.length === data.length ? "Deselect All" : "Select All");
    }
  }, [value, data, multiSelect]);

  const handleChange = (selectedItem) => {
    if (multiSelect) {
      const selectAllValue = "select_all";
      const allValues = data
        .filter((item) => item.value !== selectAllValue)
        .map((item) => item.value);

      if (selectedItem.includes(selectAllValue) && data.length > 0) {
        const next = value.length === data.length ? [] : allValues;
        setValue(next);
        onSelect?.(next);
      } else {
        const filtered = selectedItem.filter((item) => item !== selectAllValue);
        setValue(filtered);
        onSelect?.(filtered);
      }
    } else {
      const currentValue = typeof value === "object" && value !== null ? value?.value : value;
      if (currentValue === selectedItem.value) {
        setValue(null);
        onSelect?.(null);
      } else {
        setValue(selectedItem);
        onSelect?.(selectedItem);
      }
    }
  };

  const resolvedTitleColor =
    titleColor === "secondary" ? theme.colors.secondary : theme.colors.primary;

  const hasValue = multiSelect
    ? Array.isArray(value) && value.length > 0
    : value !== null && value !== undefined && value !== "";

  const radius = display === "sharp" ? 0 : theme.borderRadius.medium;

  const dropdownStyle = {
    height: 46,
    borderWidth: 1.5,
    borderColor: isFocused ? theme.colors.primary : "rgba(37,85,134,0.4)",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: radius,
    ...Platform.select({
      ios: isFocused
        ? { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 }
        : {},
      android: isFocused ? { elevation: 2 } : {},
    }),
  };

  const placeholderStyle = {
    fontFamily: theme.fontFamily[fontFamily] || theme.fontFamily.Arial,
    fontSize: placeholderFontSize,
    color: hasValue ? theme.colors.primary : placeholderColor,
  };

  const selectedTextStyle = {
    fontFamily: theme.fontFamily[selectedEventFont] || theme.fontFamily.Arial,
    fontSize: selectedEventFontSize,
    color: selectedEventColor,
  };

  const itemTextStyle = {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily[fontFamily] || theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
  };

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, { color: resolvedTitleColor }]}>{title}</Text>
      ) : null}
      {multiSelect ? (
        <MultiSelect
          data={data.length > 0 ? [{ label: selectAllLabel, value: "select_all" }, ...data] : data}
          labelField="label"
          valueField="value"
          value={value}
          onChange={handleChange}
          placeholder={hasValue ? `${value.length} selected` : placeholder}
          style={dropdownStyle}
          placeholderStyle={placeholderStyle}
          selectedTextStyle={selectedTextStyle}
          itemTextStyle={itemTextStyle}
          itemContainerStyle={styles.itemContainer}
          containerStyle={styles.listContainer}
          inputSearchStyle={styles.inputSearch}
          searchPlaceholderTextColor={theme.colors.placeholder}
          iconColor={theme.colors.primary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          renderSelectedItem={(item, unSelect) => (
            <TouchableOpacity onPress={() => unSelect && unSelect(item)} />
          )}
        />
      ) : (
        <Dropdown
          data={data}
          labelField="label"
          valueField="value"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={dropdownStyle}
          placeholderStyle={placeholderStyle}
          selectedTextStyle={selectedTextStyle}
          itemTextStyle={itemTextStyle}
          itemContainerStyle={styles.itemContainer}
          containerStyle={styles.listContainer}
          iconColor={theme.colors.primary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      )}
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    marginBottom: theme.spacing.small,
  },
  itemContainer: {
    backgroundColor: theme.colors.secondary,
  },
  listContainer: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1.5,
    borderColor: "rgba(37,85,134,0.4)",
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  inputSearch: {
    borderWidth: 1,
    borderColor: "rgba(37,85,134,0.15)",
    borderRadius: theme.borderRadius.small,
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
  },
});
