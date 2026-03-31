import { View, Image, StyleSheet } from "react-native";
import React from "react";
import images from "../constants/images";
import theme from "../constants/theme";

const Header = ({ type = "primary" }) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            type === "primary" ? theme.colors.secondary : theme.colors.primary,
        },
      ]}
    >
      <View style={styles.topBarPrimary} />
      <View style={styles.bottomBarPrimary} />
      <View
        style={[
          styles.middleBarPrimary,
          {
            backgroundColor:
              type === "primary"
                ? theme.colors.primary
                : theme.colors.secondary,
          },
        ]}
      />
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
    marginBottom: 50,
  },
  logo: {
    width: 200,
    height: 200,
    position: "absolute",
    zIndex: 2,
  },
  topBarPrimary: {
    width: "80%",
    height: 40,
    backgroundColor: "#74ACD3",
    position: "absolute",
    top: 20,
    alignSelf: "flex-start",
  },
  middleBarPrimary: {
    width: "80%",
    height: 40,
    position: "absolute",
    zIndex: 1,
    alignSelf: "center",
  },
  bottomBarPrimary: {
    width: "80%",
    height: 40,
    backgroundColor: "#74ACD3",
    position: "absolute",
    bottom: 20,
    alignSelf: "flex-end",
  },
});

export default Header;
