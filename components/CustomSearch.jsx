import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import icons from "../constants/icons";
import theme from "../constants/theme";

const CustomSearch = ({ placeholder = "Search...", onSearch }) => {
  const [searchText, setSearchText] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (onSearch) onSearch(searchText);
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchText]);

  const handleClear = useCallback(() => {
    setSearchText("");
    if (onSearch) onSearch("");
  }, [onSearch]);

  const hasText = searchText.length > 0;

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Image
        source={icons.search}
        style={[styles.icon, focused && styles.iconFocused]}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={focused ? "rgba(37,85,134,0.5)" : theme.colors.placeholder}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {hasText && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Image source={icons.close} style={styles.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1.5,
    borderColor: "rgba(37,85,134,0.2)",
    paddingHorizontal: theme.spacing.medium,
    height: 48,
    gap: theme.spacing.small,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  containerFocused: {
    borderColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.gray,
  },
  clearButton: {
    padding: theme.spacing.xsmall,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.placeholder,
  },
  iconFocused: {
    tintColor: theme.colors.primary,
  },
});

export default CustomSearch;
