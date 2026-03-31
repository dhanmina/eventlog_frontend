import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import Header from "../../../components/Header";
import icons from "../../../constants/icons";
import useUserAccount from "../../../hooks/useUserAccount";
import TabsComponent from "../../../components/TabsComponent";
import { router } from "expo-router";

const Account = () => {
  const { user, handleLogout } = useUserAccount();

  return (
    <SafeAreaView
      style={[
        globalStyles.secondaryContainer,
        { paddingLeft: 0, paddingRight: 0, paddingBottom: 0 },
      ]}
    >
      <View style={{ width: "100%", marginTop: theme.spacing.xlarge }}>
        <Header type="secondary" />
      </View>
      <Text style={styles.title}>ACCOUNT</Text>
      <ScrollView
        style={{ width: "80%", marginBottom: 50 }}
        contentContainerStyle={{
          paddingBottom: theme.spacing.xlarge,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsWrapper}>
          <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailsTitle}>Name: </Text>
            <Text style={styles.details}>
              {user?.first_name || "N/A"} {user?.middle_name || ""}{" "}
              {user?.last_name || "N/A"} {user?.suffix || ""}
            </Text>
          </View>
          <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailsTitle}>ID Number: </Text>
            <Text style={styles.details}>{user?.id_number || "N/A"}</Text>
          </View>
          {user?.block_name !== null && (
            <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailsTitle}>Block: </Text>
              <Text style={styles.details}>{user?.block_name || "N/A"}</Text>
            </View>
          )}
          <View style={[styles.detailsContainer, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailsTitle}>Department: </Text>
            <Text style={styles.details}>{user?.department_code || "N/A"}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Email: </Text>
            <Text style={styles.details}>{user?.email || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.contactUsContainer}>
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
              <Image source={icons.email} style={styles.icon} />
              <Text style={styles.socialText}>
                cit_eventlogsupport@gmail.com
              </Text>
            </View>
            <View style={styles.socialsContainer}>
              <Image source={icons.facebook} style={styles.icon} />
              <Text style={styles.socialText}>CITofficial.UCV</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <TabsComponent />
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
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 2,
    padding: theme.spacing.medium,
    borderColor: theme.colors.primary,
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
    alignSelf: "center",
    minHeight: 100,
  },
  logout: {
    marginTop: theme.spacing.medium,
  },
});
