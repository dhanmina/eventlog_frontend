import "../services/api/index";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { EventsProvider } from "../context/EventsContext";
import { RecordsProvider } from "../context/RecordsContext";
import CustomModal from "../components/CustomModal";

function RootLayoutWithModal() {
  const { modalVisible, modalConfig, closeModal } = useAuth();

  return (
    <SafeAreaProvider>
      <Slot />
      <CustomModal
        visible={modalVisible}
        title={modalConfig?.title || ""}
        message={modalConfig?.message || ""}
        type={modalConfig?.type || "success"}
        onClose={closeModal}
        cancelTitle="OK"
      />
    </SafeAreaProvider>
  );
}

const RootLayout = () => {
  return (
    <AuthProvider>
      <EventsProvider>
        <RecordsProvider>
          <RootLayoutWithModal />
        </RecordsProvider>
      </EventsProvider>
    </AuthProvider>
  );
};

export default RootLayout;
