import {
  TextInput,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from "react-native";
import { useState, useRef, useCallback } from "react";

import theme from "../constants/theme.js";
import globalStyles from "../constants/globalStyles.js";
import icons from "../constants/icons.js";

const FormField = ({
  type,
  title,
  placeholder,
  onChangeText,
  value,
  optional = false,
  iconShow = true,
  borderColor = "primary",
  titleColor = "primary",
  exampleColor = "secondary",
  design,
  multiline = false,
  example,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputs = useRef([]);
  const inputRef = useRef(null);

  const handleInputChange = useCallback(
    (text, index) => {
      let formattedText = text;

      if (type === "id") {
        formattedText = text.replace(/[^0-9]/g, "");
      } else if (type === "password") {
        formattedText = text.replace(/\s/g, "");
      }

      if (type === "code") {
        if (text.length > 1) return;

        const newCode = [...value];
        newCode[index] = text;
        if (newCode.join("") !== value.join("")) {
          onChangeText(newCode);
        }

        if (text && index < value.length - 1) {
          inputs.current[index + 1]?.focus();
        }
      } else {
        if (formattedText !== value) {
          onChangeText(formattedText);
        }
      }
    },
    [type, value, onChangeText]
  );

  const handleKeyPress = useCallback(
    ({ nativeEvent }, index) => {
      if (nativeEvent.key === "Backspace" && !value[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    },
    [value]
  );

  const getIcon = () => {
    switch (type) {
      case "id":
        return icons.idBadge;
      case "email":
        return icons.email2;
      case "password":
        return icons.lock;
      default:
        return null;
    }
  };

  const getAutoCapitalize = () => {
    if (type === "password" || type === "email") {
      return "none";
    }
    return "sentences";
  };

  const resolvedBorderColor =
    borderColor === "secondary" ? theme.colors.secondary : theme.colors.primary;

  const resolvedTitleColor =
    titleColor === "secondary" ? theme.colors.secondary : theme.colors.primary;

  const resolvedExampleColor =
    exampleColor === "primary" ? theme.colors.primary : theme.colors.secondary;

  const borderRadius = design === "sharp" ? 0 : theme.borderRadius.medium;

  return type === "code" ? (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: resolvedTitleColor }]}>
            {title}
          </Text>
          {optional && <Text style={styles.optionalText}> (optional)</Text>}
          {example && (
            <Text style={[styles.example, { color: resolvedExampleColor }]}>
              {" "}
              (Ex: {example})
            </Text>
          )}
        </View>
      )}
      <View style={styles.codeContainer}>
        {value.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[
              styles.codeInput,
              {
                borderColor: resolvedBorderColor,
                borderRadius,
                color: theme.colors.primary,
              },
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            autoFocus={index === 0}
          />
        ))}
      </View>
    </View>
  ) : (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: resolvedTitleColor }]}>
            {title}
          </Text>
          {optional && <Text style={styles.optionalText}> (optional)</Text>}
          {example && (
            <Text style={[styles.example, { color: resolvedExampleColor }]}>
              {" "}
              (Ex: {example})
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: isFocused ? resolvedBorderColor : "rgba(37,85,134,0.4)",
            borderRadius,
          },
          isFocused && styles.inputWrapperFocused,
          multiline && styles.multilineInputWrapper,
        ]}
        onTouchEnd={() => inputRef.current?.focus()}
      >
        {iconShow && getIcon() && (
          <Image source={getIcon()} style={globalStyles.icons} />
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
            { color: theme.colors.primary },
            iconShow && getIcon() && styles.textInputWithIcon,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          value={value}
          onChangeText={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={type === "password" && !showPassword}
          keyboardType={
            type === "id"
              ? "numeric"
              : type === "email"
              ? "email-address"
              : "default"
          }
          autoCapitalize={getAutoCapitalize()}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
        {type === "password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={showPassword ? icons.view : icons.hide}
              style={globalStyles.icons}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.medium,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  title: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
  },
  optionalText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily.Arial,
  },
  inputWrapper: {
    width: "100%",
    height: 46,
    paddingHorizontal: theme.spacing.medium,
    backgroundColor: theme.colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  inputWrapperFocused: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  multilineInputWrapper: {
    height: 92,
    alignItems: "flex-start",
    paddingVertical: theme.spacing.small,
  },
  textInput: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    flex: 1,
  },
  textInputWithIcon: {
    marginLeft: theme.spacing.small,
  },
  multilineInput: {
    height: 92,
    textAlignVertical: "top",
  },
  codeContainer: {
    flexDirection: "row",
    width: "100%",
    gap: theme.spacing.small,
  },
  codeInput: {
    flex: 1,
    height: 60,
    textAlign: "center",
    fontSize: theme.fontSizes.huge,
    fontFamily: theme.fontFamily.SquadaOne,
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
  },
  example: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.ArialItalic,
  },
});

export default FormField;
