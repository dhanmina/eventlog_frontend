import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import TabsComponent from "../../../../components/TabsComponent";
import globalStyles from "../../../../constants/globalStyles";
import theme from "../../../../constants/theme";
import FormField from "../../../../components/FormField";
import CustomDropdown from "../../../../components/CustomDropdown";
import CustomButton from "../../../../components/CustomButton";
import { fetchBlocks } from "../../../../services/api/blocks";
import { addUser } from "../../../../services/api/users";
import CustomModal from "../../../../components/CustomModal";

const AddStudent = () => {
  const [formData, setFormData] = useState({
    id_number: "",
    role_id: "1",
    block_id: null,
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
  });

  const roles = [
    { label: "Student", value: "1" },
    { label: "Officer", value: "2" },
  ];

  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blocksData = await fetchBlocks();
        if (Array.isArray(blocksData)) {
          const activeBlocks = blocksData
            .filter((block) => block.status === "Active")
            .map((block) => ({
              label: `${block.course_code || "N/A"} - ${
                block.block_name || `Block ${block.block_id}`
              }`,
              value: block.block_id,
            }));
          setBlocks(activeBlocks);
        } else {
          throw new Error("Invalid blocks data");
        }
      } catch (error) {
        setModal({
          visible: true,
          title: "Error",
          message: "Failed to load blocks. Please try again.",
          type: "error",
        });
      }
    };
    fetchData();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.id_number.trim() ||
        !formData.role_id ||
        !formData.block_id ||
        !formData.first_name.trim() ||
        !formData.last_name.trim()
      ) {
        setModal({
          visible: true,
          title: "Warning",
          message: "Please fill in all required fields.",
          type: "warning",
        });
        return;
      }

      const submitData = {
        id_number: formData.id_number,
        role_id: parseInt(formData.role_id, 10),
        block_id: parseInt(formData.block_id, 10),
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
      };

      setIsLoading(true);
      await addUser(submitData);

      setModal({
        visible: true,
        title: "Success",
        message: "Student added successfully!",
        type: "success",
      });

      setFormData({
        id_number: "",
        role_id: "1",
        block_id: null,
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
      });
    } catch (error) {
      setModal({
        visible: true,
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to add student. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={globalStyles.secondaryContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.secondaryContainer, { paddingTop: 0 }]}>
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, visible: false })}
        cancelTitle="CLOSE"
      />

      <Text style={styles.textHeader}>EVENTLOG</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>ADD STUDENT</Text>
      </View>
      <ScrollView
        style={styles.scrollviewContainer}
        contentContainerStyle={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <FormField
            type="id"
            iconShow={false}
            title="ID Number"
            example="1234567"
            exampleColor="primary"
            value={formData.id_number}
            onChangeText={(text) => handleChange("id_number", text)}
          />

          <FormField
            title="First Name"
            example="Juan Miguel"
            exampleColor="primary"
            value={formData.first_name}
            onChangeText={(text) => handleChange("first_name", text)}
          />

          <FormField
            title="Middle Name (Optional)"
            example="Reyes"
            exampleColor="primary"
            value={formData.middle_name}
            onChangeText={(text) => handleChange("middle_name", text)}
          />

          <FormField
            title="Last Name"
            example="Santos"
            exampleColor="primary"
            value={formData.last_name}
            onChangeText={(text) => handleChange("last_name", text)}
          />

          <FormField
            title="Suffix (Optional)"
            example="Jr"
            exampleColor="primary"
            value={formData.suffix}
            onChangeText={(text) => handleChange("suffix", text)}
          />
        </View>
        <CustomDropdown
          title="Block"
          data={blocks}
          placeholder="Select a block"
          value={formData.block_id}
          onSelect={(item) => handleChange("block_id", item.value)}
        />
        <CustomDropdown
          title="Role"
          data={roles}
          placeholder="Select a role"
          value={formData.role_id}
          onSelect={(item) => handleChange("role_id", item.value)}
        />
        <View>
          <CustomButton title="ADD STUDENT" onPress={handleSubmit} />
        </View>
      </ScrollView>

      <TabsComponent />
      <StatusBar style="auto" />
    </View>
  );
};

export default AddStudent;

const styles = StyleSheet.create({
  textHeader: {
    fontFamily: theme.fontFamily.SquadaOne,
    fontSize: theme.fontSizes.title,
    color: theme.colors.primary,
    textAlign: "center",
  },
  scrollviewContainer: {
    width: "100%",
    marginBottom: 90,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderTopWidth: 0,
  },
  scrollview: {
    justifyContent: "space-between",
    flexGrow: 1,
    padding: theme.spacing.medium,
  },
  titleContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  textTitle: {
    fontSize: theme.fontSizes.extraLarge,
    fontFamily: theme.fontFamily.SquladaOne,
    color: theme.colors.primary,
  },
});
