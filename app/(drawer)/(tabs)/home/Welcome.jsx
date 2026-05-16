import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRoleID } from "../../../../database/queries";

import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import images from "../../../../constants/images";

const contactRows = [
  { icon: images.email, text: "cit_eventlogsupport@gmail.com", style: "contactRow" },
  { icon: images.facebook, text: "CITofficial.UCV", style: "contactRow" },
  {
    icon: images.location,
    text: "CIT Office - VHNPB Building 4th Floor",
    style: "lastContactRow",
  },
];

const ContactRow = ({ icon, text, style }) => (
  <View style={styles[style]}>
    <Image source={icon} style={styles.icon} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const Welcome = () => {
  const [roleID, setRoleID] = useState(null);

  useEffect(() => {
    const fetchRoleID = async () => {
      const id = await getRoleID();
      setRoleID(id);
    };
    fetchRoleID();
  }, []);

  return (
    <SafeAreaView
      style={[
        globalStyles.secondaryContainer,
        roleID === 4 && { paddingTop: 0 },
      ]}
    >
      <View style={styles.info}>
        <View style={styles.infoContainer}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME EVENTLOG USERS!</Text>
          </View>
          <Text style={styles.infoText}>
            The College of Information Technology proudly introduce EVENTLOG,
            the new mobile application - event attendance monitoring system,
            designed to easily monitor and gather the attendance of each student
            in a techy-way!
          </Text>
          <Text style={styles.infoText}>
            EVENTLOG streamlines the attendance process, making it faster, more
            efficient, and friendly. With the power of QR codes, you can now
            easily log in/out your attendance during events with just a quick
            scan.
          </Text>
          <Text style={styles.infoText}>
            Join us in embracing this innovative solution that enhances your
            event experience and simplifies attendance logging. Welcome and
            happy logging!
          </Text>
          <Text style={styles.infoText}>
            For more information/inquiries feel free to contact us:
          </Text>

          <View style={styles.contactsContainer}>
            {contactRows.map((contact) => (
              <ContactRow key={contact.text} {...contact} />
            ))}
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
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
    flex: 1,
    backgroundColor: theme.colors.primary,
    marginBottom: 30,
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xsmall,
  },
  lastContactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
