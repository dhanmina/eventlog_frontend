import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import images from "../constants/images";
import theme from "../constants/theme";

const CustomSearch = ({ placeholder = "Search...", onSearch }) => {
  const [searchText, setSearchText] = useState("");

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
    <View style={styles.container}>
      <Image source={images.search} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {hasText && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Image source={images.close} style={styles.icon} />
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
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.medium,
    height: 46,
    gap: theme.spacing.small,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.primary,
  },
  clearButton: {
    padding: theme.spacing.xsmall,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
});

export default CustomSearch;
