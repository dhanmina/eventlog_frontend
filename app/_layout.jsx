import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { EventsProvider } from "../context/EventsContext";
import { RecordsProvider } from "../context/RecordsContext";
import CustomModal from "../components/CustomModal";

const DEFAULT_MODAL_CONFIG = {
  title: "",
  message: "",
  type: "success",
};

const AppProviders = ({ children }) => (
  <AuthProvider>
    <EventsProvider>
      <RecordsProvider>{children}</RecordsProvider>
    </EventsProvider>
  </AuthProvider>
);

function RootLayoutWithModal() {
  const { modalVisible, modalConfig, closeModal } = useAuth();
  const resolvedModalConfig = {
    ...DEFAULT_MODAL_CONFIG,
    ...modalConfig,
  };

  return (
    <SafeAreaProvider>
      <Slot />
      <CustomModal
        visible={modalVisible}
        title={resolvedModalConfig.title}
        message={resolvedModalConfig.message}
        type={resolvedModalConfig.type}
        onClose={closeModal}
        cancelTitle="OK"
      />
    </SafeAreaProvider>
  );
}

const RootLayout = () => {
  return (
    <AppProviders>
      <RootLayoutWithModal />
    </AppProviders>
  );
};

export default RootLayout;
