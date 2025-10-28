import axios from "axios";
import { API_URL } from "../config/config";
import initDB from "../database/database";

export const fetchEventById = async (eventId) => {
  try {
    const response = await axios.get(`${API_URL}/api/events/events/${eventId}`);
    if (response.data.success) {
      return response.data.event;
    }
    throw new Error("Failed to fetch event details");
  } catch (error) {
    throw error;
  }
};

export const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/departments/departments`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch departments");
  } catch (error) {
    throw error;
  }
};

export const fetchDepartmentById = async (departmentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/departments/departments/${departmentId}`
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to fetch department");
  } catch (error) {
    throw error;
  }
};

export const addDepartment = async (departmentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/departments/departments`,
      departmentData
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to add department");
  } catch (error) {
    throw error;
  }
};

export const editDepartment = async (departmentId, departmentData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/departments/departments/${departmentId}`,
      departmentData
    );
    if (response.data.success) {
      return response.data.department;
    }
    throw new Error("Failed to update department");
  } catch (error) {
    throw error;
  }
};

export const disableDepartment = async (departmentId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/departments/departments/dis/${departmentId}`
    );
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to delete department");
  } catch (error) {
    throw error;
  }
};

export const fetchBlocksByDepartment = async (departmentIds) => {
  if (departmentIds.length === 0) return [];

  try {
    const responses = await Promise.all(
      departmentIds.map((deptId) =>
        axios.get(`${API_URL}/api/blocks/${deptId}`)
      )
    );

    return responses.flatMap((res) => (res.data.success ? res.data.data : []));
  } catch (error) {
    throw error;
  }
};

export const fetchBlocks = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/blocks`);

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error("Invalid blocks data received");
  } catch (error) {
    console.error("Error fetching blocks:", error);
    throw error;
  }
};

export const fetchBlockById = async (blockId) => {
  if (!blockId || isNaN(blockId)) {
    console.error("Invalid block ID provided:", blockId);
    throw new Error("Invalid block ID");
  }

  try {
    const response = await axios.get(`${API_URL}/api/blocks/block/${blockId}`);

    if (response.data.success) {
      return response.data.data;
    }

    console.error(
      "Failed to fetch block. Backend message:",
      response.data.message
    );
    throw new Error(response.data.message || "Failed to fetch block");
  } catch (error) {
    console.error(
      "Error fetching block details:",
      error.response?.data?.message || error.message
    );

    throw new Error(
      error.response?.data?.message ||
        "An error occurred while fetching the block."
    );
  }
};

export const addBlock = async (blockData) => {
  try {
    const response = await axios.post(`${API_URL}/api/blocks`, blockData);
    if (response.data.success) return response.data.data;
    throw new Error("Failed to add block");
  } catch (error) {
    throw error;
  }
};

export const editBlock = async (blockId, blockData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/blocks/block/${blockId}`,
      blockData
    );
    if (response.data.success) return response.data.data;
    throw new Error("Failed to edit block");
  } catch (error) {
    throw error;
  }
};

export const disableBlock = async (blockId) => {
  try {
    const response = await axios.put(`${API_URL}/api/blocks/${blockId}`);
    if (response.data.success) return response.data.message;
    throw new Error("Failed to delete block");
  } catch (error) {
    throw error;
  }
};

export const fetchEventNames = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/events/names`);

    if (response.data.success) {
      return response.data.eventNames.map((event) => ({
        label: event.name || event.event_name,
        value: event.id || event.event_name_id,
        status: event.status,
      }));
    }
    throw new Error("Failed to fetch event names");
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/events/admin/edit/${eventId}`,
      eventData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Update failed");
  } catch (error) {
    throw error;
  }
};

export const fetchApprovedOngoing = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/events/approved-ongoing`);

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error("Failed to fetch approved ongoing events");
    }
  } catch (error) {
    console.error(
      "Error fetching approved ongoing events:",
      error.message || error
    );
    throw error;
  }
};

export const fetchUpcomingEvents = async (blockId) => {
  try {
    const response = await axios.post(`${API_URL}/api/events/upcoming`, {
      block_id: blockId,
    });

    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch user upcoming events");
  } catch (error) {
    throw error;
  }
};

export const fetchAdmins = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admins`);
    if (response.data.success) {
      return response.data.admins;
    }
    throw new Error("Failed to fetch admins");
  } catch (error) {
    throw error;
  }
};

export const addAdmin = async (adminData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/admins/add-admin`,
      adminData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add admin");
  } catch (error) {
    throw error;
  }
};

export const editAdmin = async (id_number, adminData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/admins/edit/${id_number}`,
      adminData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update admin");
  } catch (error) {
    throw error;
  }
};

export const fetchAdminById = async (id_number) => {
  try {
    const response = await axios.get(`${API_URL}/api/admins/${id_number}`);
    if (response.data.success) {
      return response.data.admin;
    }
    throw new Error(response.data.message || "Failed to fetch admin details");
  } catch (error) {
    throw error;
  }
};

export const disableAdmin = async (id_number) => {
  try {
    const response = await axios.put(`${API_URL}/api/admins/${id_number}`);

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || "Failed to disable admin");
  } catch (error) {
    throw error;
  }
};

export const fetchCourses = async (searchQuery = "") => {
  try {
    const response = await axios.get(`${API_URL}/api/courses`, {
      params: { search: searchQuery },
    });
    if (response.data.success) {
      return response.data.courses;
    }
    throw new Error("Failed to fetch courses");
  } catch (error) {
    throw error;
  }
};

export const fetchCourseById = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}`);
    if (response.data.success) {
      return response.data.course;
    }
    throw new Error("Failed to fetch course details");
  } catch (error) {
    throw error;
  }
};

export const addCourse = async (courseData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/courses/add-course`,
      courseData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add course");
  } catch (error) {
    throw error;
  }
};

export const editCourse = async (courseId, courseData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/courses/edit/${courseId}`,
      courseData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update course");
  } catch (error) {
    throw error;
  }
};

export const disableCourse = async (courseId) => {
  try {
    const response = await axios.put(`${API_URL}/api/courses/${courseId}`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to disable course");
  } catch (error) {
    throw error;
  }
};

export const fetchUsers = async (searchQuery = "", page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/users`, {
      params: { search: searchQuery, page, limit },
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch users");
  } catch (error) {
    throw error;
  }
};

export const fetchUserById = async (idNumber) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users/id-number/${idNumber}`
    );
    if (response.data.success) {
      return response.data.user;
    }
    throw new Error("Failed to fetch user details");
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (idNumber, userData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/edit/${idNumber}`,
      userData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update user");
  } catch (error) {
    throw error;
  }
};

export const disableUser = async (idNumber) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/disable/${idNumber}`,
      {
        status: "disabled",
      }
    );

    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to disable user");
  } catch (error) {
    throw error;
  }
};

export const changeUserPassword = async (email, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/change-password`, {
      email,
      newPassword,
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to change password");
  } catch (error) {
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/users/add-user`,
      userData
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Failed to add user");
  } catch (error) {
    throw error;
  }
};

export const fetchRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/roles`);
    if (response.data.success) {
      return response.data.roles.map((role) => ({
        role_id: role.role_id,
        role_name: role.role_name,
      }));
    }
    throw new Error("Failed to fetch roles");
  } catch (error) {
    throw error;
  }
};

export const fetchYearLevels = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/year-level`);

    if (response.data.success) {
      return response.data.yearlevel.map((yearlevel) => ({
        year_level_id: yearlevel.year_level_id,
        year_level_name: yearlevel.year_level_name,
      }));
    }
    throw new Error("Failed to fetch roles");
  } catch (error) {
    throw error;
  }
};

export const fetchEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/events/`);

    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const disableEventName = async (eventId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/event-names/disable/${eventId}`
    );
    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const approveEvent = async (eventId, adminId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/events/admin/approve/${eventId}`,
      {
        admin_id_number: adminId,
      }
    );

    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const fetchEventNameById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/event-names/${id}`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch event name");
  } catch (error) {
    throw error;
  }
};

export const addEventName = async (name) => {
  try {
    const response = await axios.post(`${API_URL}/api/event-names/add`, {
      name,
    });
    if (response.data.success) {
      return response.data.eventName;
    }
    throw new Error("Failed to add event name");
  } catch (error) {
    throw error;
  }
};

export const editEventName = async (id, data) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/event-names/update/${id}`,
      data
    );
    if (response.data.success) {
      return response.data.eventName;
    }
    throw new Error("Failed to update event name");
  } catch (error) {
    throw error;
  }
};

export const deleteEventName = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/event-names/delete/${id}`
    );
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to delete event name");
  } catch (error) {
    throw error;
  }
};

export const addEvent = async (eventData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/events/admin/add`,
      eventData
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error("Failed to add event");
  } catch (error) {
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/events/admin/delete/${id}`
    );
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to delete name");
  } catch (error) {
    throw error;
  }
};
let syncInterval;
import { getStoredEvents } from "../database/queries";
import moment from "moment";

export const syncAttendance = async () => {
  let dbInstance;
  try {
    dbInstance = await initDB();
    if (!dbInstance) {
      throw new Error("Failed to initialize database.");
    }

    const attendanceRecords = await dbInstance.getAllAsync(
      "SELECT * FROM attendance"
    );

    if (attendanceRecords.length === 0) {
      return { success: true, message: "No attendance records to sync." };
    }

    const events = await getStoredEvents();
    const currentDate = moment().format("YYYY-MM-DD");

    const shouldClearAttendance = events.every((event) => {
      const eventDates = event.event_dates || [];
      return eventDates.every((eventDate) =>
        moment(eventDate).isBefore(currentDate)
      );
    });

    const cleanedAttendanceData = attendanceRecords.map((record) => {
      const cleanedRecord = {
        event_date_id: record.event_date_id,
        student_id_number: record.student_id_number,
        am_in: record.am_in || null,
        am_out: record.am_out || null,
        pm_in: record.pm_in || null,
        pm_out: record.pm_out || null,
      };

      Object.keys(cleanedRecord).forEach((key) => {
        if (cleanedRecord[key] === null) {
          delete cleanedRecord[key];
        }
      });

      return cleanedRecord;
    });

    const response = await axios.post(`${API_URL}/api/attendance/sync`, {
      attendanceData: cleanedAttendanceData,
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to sync attendance with the backend."
      );
    }

    const { synced_count, failed_count, failed_records } =
      response.data.data || {};

    if (shouldClearAttendance) {
      await dbInstance.runAsync("DELETE FROM attendance");
    }

    return {
      success: true,
      message: "Attendance synced successfully.",
      syncedCount: synced_count,
      failedCount: failed_count,
      failedRecords: failed_records,
    };
  } catch (error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message || "Server error during sync";
      throw new Error(`Sync failed: ${errorMessage}`);
    } else if (error.request) {
      throw new Error("Network error: Unable to connect to server");
    } else {
      throw new Error(`Sync error: ${error.message}`);
    }
  } finally {
    if (dbInstance && typeof dbInstance.close === "function") {
      try {
        await dbInstance.close();
      } catch {}
    }
  }
};


export const startSync = async () => {
  if (syncInterval) {
    return;
  }

  syncInterval = setInterval(async () => {
    try {
      await syncAttendance();
    } catch (error) {}
  }, 30000);
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

export const uploadSchoolYearFile = async (fileUri, type) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: "student_list.csv",
      type: "text/csv",
    });

    const response = await axios.post(
      `${API_URL}/api/school-years/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.error || "Failed to upload file");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const changeSchoolYear = async (fileUri) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: "student_list.csv",
      type: "text/csv",
    });

    const response = await axios.post(
      `${API_URL}/api/school-years/change-school-year`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.error || "Failed to change school year");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentSchoolYear = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/school-years/current`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to get current school year");
  } catch (error) {
    throw error;
  }
};
