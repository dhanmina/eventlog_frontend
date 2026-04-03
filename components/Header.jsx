import { View, Image, StyleSheet } from "react-native";
import React from "react";
import images from "../constants/images";
import theme from "../constants/theme";

const ACCENT_COLOR = "#74ACD3";

const Header = ({ type = "primary", style }) => {
  const isPrimary = type === "primary";

  return (
    <View
      style={[
        styles.container,
        isPrimary ? styles.containerPrimary : styles.containerSecondary,
        style,
      ]}
    >
      <View style={styles.topBar} />
      <View
        style={[
          styles.middleBar,
          isPrimary ? styles.middleBarPrimary : styles.middleBarSecondary,
        ]}
      />
      <View style={styles.bottomBar} />
      <Image source={images.logo} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 40,
    marginBottom: 50,
  },
  containerPrimary: {
    backgroundColor: theme.colors.secondary,
  },
  containerSecondary: {
    backgroundColor: theme.colors.primary,
  },
  logo: {
    width: 200,
    height: 200,
    position: "absolute",
    zIndex: 2,
  },
  topBar: {
    width: "80%",
    height: 40,
    backgroundColor: ACCENT_COLOR,
    position: "absolute",
    top: theme.spacing.medium,
    alignSelf: "flex-start",
  },
  middleBar: {
    width: "80%",
    height: 40,
    position: "absolute",
    zIndex: 1,
    alignSelf: "center",
  },
  middleBarPrimary: {
    backgroundColor: theme.colors.primary,
  },
  middleBarSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  bottomBar: {
    width: "80%",
    height: 40,
    backgroundColor: ACCENT_COLOR,
    position: "absolute",
    bottom: theme.spacing.medium,
    alignSelf: "flex-end",
  },
});

export default Header;
