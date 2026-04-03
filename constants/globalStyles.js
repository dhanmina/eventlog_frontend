import { StyleSheet } from "react-native";
import theme from "./theme";

const globalStyles = StyleSheet.create({
  primaryContainer: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryContainer: {
    backgroundColor: theme.colors.secondary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.medium,
  },

  secondaryContainerSA: {
    backgroundColor: theme.colors.secondary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.medium,
    paddingBottom: 100,
  },

  authContent: {
    width: "80%",
    alignItems: "stretch",
    gap: theme.spacing.medium,
  },

  headerText: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },

  authTitle: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    color: theme.colors.secondary,
    textAlign: "center",
  },

  authInfo: {
    fontFamily: theme.fontFamily.Arial,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.secondary,
    textAlign: "center",
  },

  scrollView: {
    flex: 1,
    width: "100%",
  },

  tabSpacer: {
    height: 110,
  },

  iconBtn: {
    padding: theme.spacing.xsmall,
    marginLeft: theme.spacing.xsmall,
  },

  icons: {
    width: 24,
    height: 24,
    tintColor: theme.colors.primary,
  },
});

export default globalStyles;
