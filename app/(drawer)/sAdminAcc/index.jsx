import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../../../constants/globalStyles";
import theme from "../../../constants/theme";
import Header from "../../../components/Header";
import icons from "../../../constants/icons";
import useUserAccount from "../../../hooks/useUserAccount";
import TabsComponent from "../../../components/TabsComponent";

const Account = () => {
  const { user } = useUserAccount();

  return (
    <SafeAreaView
      style={[globalStyles.secondaryContainer, { paddingHorizontal: 0 }]}
    >
      <View style={styles.headerWrapper}>
        <Header type="secondary" />
      </View>
      <Text style={styles.title}>ACCOUNT</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsWrapper}>
          <View style={[styles.detailsContainer, styles.detailsRowTop]}>
            <Text style={styles.detailsTitle}>Name</Text>
            <Text style={styles.details}>
              {[user?.first_name, user?.middle_name, user?.last_name, user?.suffix]
                .filter(Boolean)
                .join(" ") || "N/A"}
            </Text>
          </View>
          <View style={[styles.detailsContainer, styles.detailsRowMid]}>
            <Text style={styles.detailsTitle}>ID Number</Text>
            <Text style={styles.details}>{user?.id_number || "N/A"}</Text>
          </View>
          {user?.block_name != null && (
            <View style={[styles.detailsContainer, styles.detailsRowMid]}>
              <Text style={styles.detailsTitle}>Block</Text>
              <Text style={styles.details}>{user?.block_name || "N/A"}</Text>
            </View>
          )}
          <View style={[styles.detailsContainer, styles.detailsRowMid]}>
            <Text style={styles.detailsTitle}>Department</Text>
            <Text style={styles.details}>{user?.department_code || "N/A"}</Text>
          </View>
          <View style={[styles.detailsContainer, styles.detailsRowBottom]}>
            <Text style={styles.detailsTitle}>Email</Text>
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
            VHNP Building 4th Floor - New Site Campus, Balzain, Tuguegarao
            City, Cagayan
          </Text>
          <View style={styles.socialsContainer}>
            <Image source={icons.email} style={styles.icon} />
            <Text style={styles.socialText}>cit_eventlogsupport@gmail.com</Text>
          </View>
          <View style={styles.socialsContainer}>
            <Image source={icons.facebook} style={styles.icon} />
            <Text style={styles.socialText}>CITofficial.UCV</Text>
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
  headerWrapper: {
    width: "100%",
    marginTop: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.title,
    fontFamily: theme.fontFamily.SquadaOne,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.small,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollview: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.medium,
    paddingBottom: 120,
  },
  detailsWrapper: {
    width: "100%",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    borderColor: theme.colors.primary,
  },
  detailsRowTop: {
    borderBottomWidth: 0,
  },
  detailsRowMid: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
  },
  detailsRowBottom: {
    borderTopWidth: 1,
  },
  detailsTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    width: "40%",
    flexShrink: 1,
  },
  details: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    width: "60%",
    flexShrink: 1,
  },
  contactUsContainer: {
    marginTop: theme.spacing.medium,
    alignItems: "center",
  },
  contactUs: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  line: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    width: "100%",
    marginBottom: theme.spacing.small,
  },
  school: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.ArialBold,
    color: theme.colors.primary,
    textAlign: "center",
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
    marginTop: theme.spacing.xsmall,
    marginBottom: theme.spacing.small,
  },
  socialsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.small,
  },
  icon: {
    tintColor: theme.colors.primary,
    width: 20,
    height: 20,
  },
  socialText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.Arial,
    color: theme.colors.primary,
    marginLeft: theme.spacing.small,
  },
});
