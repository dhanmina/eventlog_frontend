import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../../components/CustomButton";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import Header from "../../../../components/Header";
import images from "../../../../constants/images";
import useUserAccount from "../../../../hooks/useUserAccount";
import { router } from "expo-router";

const DetailRow = ({ label, value, isLast = false }) => (
  <View style={[styles.detailsContainer, !isLast && styles.detailsContainerNoBorder]}>
    <Text style={styles.detailsTitle}>{label}: </Text>
    <Text style={styles.details}>{value || "N/A"}</Text>
  </View>
);

const getFullName = (user) =>
  `${user?.first_name || "N/A"} ${user?.middle_name || ""} ${
    user?.last_name || "N/A"
  } ${user?.suffix || ""}`;

const Account = () => {
  const { user, handleLogout } = useUserAccount();
  const canManageEvents = user?.role_id === 3 || user?.role_id === 4;
  const profileRows = [
    { label: "Name", value: getFullName(user) },
    { label: "ID Number", value: user?.id_number },
    user?.block_name !== null && { label: "Block", value: user?.block_name },
    user?.department_code && { label: "Department", value: user?.department_name },
    { label: "Email", value: user?.email, isLast: true },
  ].filter(Boolean);

  return (
    <SafeAreaView
      style={[
        globalStyles.secondaryContainer,
        { paddingLeft: 0, paddingRight: 0, paddingBottom: 0 },
      ]}
    >
      <View style={styles.headerWrapper}>
        <Header type="secondary" />
      </View>
      <Text style={styles.title}>ACCOUNT</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsWrapper}>
          {profileRows.map((row) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              isLast={row.isLast}
            />
          ))}
        </View>

        <View style={styles.contactUsContainer}>
          {canManageEvents ? (
            <View style={styles.buttonContainer}>
              <CustomButton
                type="primary"
                title="ADD EVENT"
                onPress={() => router.push("/account/AddEvent")}
                otherStyles={styles.button}
              />
              <CustomButton
                type="secondary"
                title="EDIT EVENT"
                onPress={() => router.push("/account/EventsList")}
                otherStyles={styles.button}
              />
            </View>
          ) : (
            <View style={styles.eventActionsSpacer} />
          )}

          <Text style={styles.contactUs}>Contact Us</Text>
          <View style={styles.line} />
          <Text style={styles.school}>UNIVERSITY OF CAGAYAN VALLEY</Text>
          <Text style={styles.department}>
            COLLEGE OF INFORMATION TECHNOLOGY
          </Text>
          <Text style={styles.address}>
            VHNP Building 4th Floor - New Site Campus, Balzain, Tuguegarao City,
            Cagayan
          </Text>

          <View>
            <View style={styles.socialsContainer}>
              <Image source={images.email} style={styles.icon} />
              <Text style={styles.socialText}>
                cit_eventlogsupport@gmail.com
              </Text>
            </View>
            <View style={styles.socialsContainer}>
              <Image source={images.facebook} style={styles.icon} />
              <Text style={styles.socialText}>CITofficial.UCV</Text>
            </View>
          </View>

          <View style={[styles.buttonContainer, styles.logout]}>
            <CustomButton
              type="primary"
              title="Logout"
              onPress={handleLogout}
              otherStyles={styles.button}
            />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default Account;

const styles = StyleSheet.create({
  title: {
    fontSize: theme.fontSizes.display,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
  },
  headerWrapper: {
    width: "100%",
    marginTop: theme.spacing.xlarge,
  },
  scrollView: {
    width: "80%",
  },
  scrollContent: {
    paddingBottom: theme.spacing.xlarge,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 2,
    padding: theme.spacing.medium,
    borderColor: theme.colors.primary,
  },
  detailsContainerNoBorder: {
    borderBottomWidth: 0,
  },
  details: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
  },
  detailsTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
  },
  contactUs: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    marginTop: theme.spacing.medium,
  },
  line: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    width: "100%",
  },
  contactUsContainer: {
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    alignItems: "center",
  },
  eventActionsSpacer: {
    height: theme.spacing.medium,
  },
  school: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    marginTop: theme.spacing.medium,
  },
  department: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    textAlign: "center",
  },
  address: {
    textAlign: "center",
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
  },
  icon: {
    tintColor: theme.colors.primary,
    width: 24,
    height: 24,
  },
  socialText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    paddingLeft: theme.spacing.medium,
  },
  socialsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: theme.spacing.medium,
  },
  button: {
    marginTop: theme.spacing.medium,
  },
  buttonContainer: {
    width: "80%",
  },
  logout: {
    marginTop: theme.spacing.medium,
  },
});
