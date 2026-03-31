import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

import images from "../constants/images";
import icons from "../constants/icons";
import theme from "../constants/theme";

const WebHeader = ({ title }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        <Image source={images.logo} style={styles.logo} />
        <Text style={styles.title}>EVENTLOG ATTENDANCE RECORD</Text>
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.navButtonWrapper}>
          <TouchableOpacity
            style={styles.navButtonContainer}
            onPress={() => {
              router.replace("/web");
            }}
          >
            <Image source={icons.home} style={styles.headerIcon} />
            <Text style={styles.navTitle}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButtonContainer,
              { paddingLeft: theme.spacing.large },
            ]}
            onPress={() => {
              router.replace("web/Account");
            }}
          >
            <Image source={icons.user} style={styles.headerIcon} />
            <Text style={styles.navTitle}>ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WebHeader;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.colors.primary,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.medium,
    height: 120,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    height: 80,
    width: 80,
  },
  title: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: 40,
    color: theme.colors.secondary,
    paddingLeft: theme.spacing.medium,
  },
  headerIcon: {
    width: 50,
    height: 50,
    tintColor: theme.colors.secondary,
  },
  navButtonContainer: {
    alignItems: "center",
  },
  navTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.large,
    color: theme.colors.secondary,
  },
  navButtonWrapper: {
    flexDirection: "row",
  },
  rightContainer: {
    justifyContent: "center",
  },
});
