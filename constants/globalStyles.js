import { StyleSheet } from "react-native";
import theme from "./theme";

const globalStyles = StyleSheet.create({
  primaryContainer: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.medium,
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
    padding: theme.spacing.medium,
    paddingTop: 0,
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
  icons: {
    width: 24,
    height: 24,
    tintColor: theme.colors.gray,
  },
});

export default globalStyles;
