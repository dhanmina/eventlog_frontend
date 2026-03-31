import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { getRoleID } from "../../../../database/queries";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import icons from "../../../../constants/icons";

const Tutorial = () => {
  const [roleID, setRoleID] = useState(null);

  useEffect(() => {
    const fetchRoleID = async () => {
      const id = await getRoleID();
      setRoleID(id);
    };
    fetchRoleID();
  }, []);

  return (
    <View
      style={[
        globalStyles.secondaryContainer,
        roleID === 4 && { paddingTop: 0 },
      ]}
    >
      <View style={[styles.info]}>
        <View style={styles.infoContainer}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>EVENTLOG TUTORIAL</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.infoText}>
              To use EVENTLOG, here’s a step-by-step guide to get you started:
            </Text>
            <Text style={styles.infoText}>
              1. Navigating the App {"\n"}
              {"\u2022"} Open the EVENTLOG app, then Log In. {"\n"}
              {"\u2022"}The Home page is for the Announcements.{"\n"}
              {"\u2022"}The QR Code page is for generating QR Code. {"\n"}
              {"\u2022"}The Records page is for attendance records. {"\n"}
              {"\u2022"}The Account page is for user's information, contact
              information of EVENTLOG, and Log Out button.
            </Text>
            <Text style={styles.infoText}>
              2. Attendance Time In/Out
              {"\n"}
              {"\u2022"}Navigate to the QR Code tab. {"\n"}
              {"\u2022"}Browse through the list of available events. {"\n"}
              {"\u2022"}Click on the event you want to join.{"\n"}
              {"\u2022"}Generate your own QR Code. {"\n"}
              {"\u2022"}Show your QR code to the instructors, or student
              officers in-charge.
            </Text>
            <Text style={styles.infoText}>
              3. Viewing Your Attendance Records{"\n"}
              {"\u2022"}Navigate to the Records tab. {"\n"}
              {"\u2022"}Click on the event you want to view. {"\n"}
              {"\u2022"}Download the attendance record (optional).
            </Text>
            <Text style={styles.infoText}>
              4. Troubleshooting and Support{"\n"}
              {"\u2022"} If you encounter any issues, please contact the COLLEGE
              OF INFORMATION TECHNOLOGY DEPARTMENT for troubleshooting and
              support.
            </Text>

            <View style={styles.contactsContainer}>
              <View style={styles.emailContainer}>
                <Image source={icons.email} style={styles.icon} />
                <Text style={styles.infoText}>
                  cit_eventlogsupport@gmail.com
                </Text>
              </View>
              <View style={styles.facebookContainer}>
                <Image source={icons.facebook} style={styles.icon} />
                <Text style={styles.infoText}>CITofficial.UCV</Text>
              </View>
              <View style={styles.locationContainer}>
                <Image source={icons.location} style={styles.icon} />
                <Text style={styles.infoText}>
                  CIT Office - VHNPB Building 4th Floor
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

export default Tutorial;

const styles = StyleSheet.create({
  container: {
    paddingLeft: theme.spacing.medium,
    paddingRight: theme.spacing.medium,
    paddingBottom: theme.spacing.medium,
  },
  welcomeContainer: {
    backgroundColor: theme.colors.primary,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    color: theme.colors.secondary,
    fontFamily: "SquadaOne",
    fontSize: theme.fontSizes.large,
  },
  info: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    margin: 10,
    marginBottom: 40,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    margin: theme.spacing.small,
    justifyContent: "space-between",
  },
  infoText: {
    fontFamily: "SquadaOne",
    padding: theme.spacing.small,
    paddingBottom: 0,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.medium,
  },
  contactsContainer: { padding: theme.spacing.small },
  icon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.primary,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xsmall,
  },
  facebookContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xsmall,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
