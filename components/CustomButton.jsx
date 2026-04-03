import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import React from "react";
import theme from "../constants/theme";

const CustomButton = ({
  type = "primary",
  title = "Button",
  onPress,
  disabled = false,
  otherStyles,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.buttonBase,
          type === "primary"
            ? styles.primary
            : type === "secondary"
            ? styles.secondary
            : styles.default,
          disabled && styles.disabled,
          otherStyles,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            type === "primary" ? styles.textPrimary : styles.textSecondary,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  buttonBase: {
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 46,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  default: {
    backgroundColor: theme.colors.gray,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.extraLarge,
  },
  textPrimary: {
    color: theme.colors.secondary,
  },
  textSecondary: {
    color: theme.colors.primary,
  },
});

export default CustomButton;
