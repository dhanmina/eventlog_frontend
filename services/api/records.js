import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchUserOngoingEvents = async (
  idNumber,
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    if (!idNumber) {
      throw new Error("Missing required parameter: idNumber.");
    }

    const response = await axios.get(
      `${API_URL}/api/attendance/user/events/ongoing`,
      { params: { id_number: idNumber, page, limit, search } }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || "Failed to fetch user events.");
  } catch (error) {
    throw error;
  }
};

export const fetchUserPastEvents = async (
  idNumber,
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    if (!idNumber) {
      throw new Error("Missing required parameter: idNumber.");
    }

    const response = await axios.get(
      `${API_URL}/api/attendance/user/events/past`,
      { params: { id_number: idNumber, page, limit, search } }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || "Failed to fetch user events.");
  } catch (error) {
    throw error;
  }
};

export const fetchAllPastEvents = async (page = 1, limit = 10, search = "") => {
  try {
    const response = await axios.get(
      `${API_URL}/api/attendance/admin/events/past`,
      { params: { page, limit, search } }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch all past events."
    );
  } catch (error) {
    throw error;
  }
};

export const fetchAllOngoingEvents = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/attendance/admin/events/ongoing`,
      { params: { page, limit, search } }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch all ongoing events."
    );
  } catch (error) {
    throw error;
  }
};

export const fetchBlocksOfEvents = async (
  eventId,
  selectedDepartment,
  selectedYearLevel,
  searchQuery = ""
) => {
  try {
    const params = { event_id: eventId };

    if (selectedDepartment) {
      params.department_id = selectedDepartment;
    }

    if (selectedYearLevel) {
      params.year_level_id = selectedYearLevel;
    }

    if (searchQuery.trim() !== "") {
      params.search_query = searchQuery;
    }

    const response = await axios.get(
      `${API_URL}/api/attendance/events/blocks`,
      { params }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch blocks of events."
    );
  } catch (error) {
    console.error("❌ Failed to fetch blocks:", error.message);
    throw error;
  }
};

export const fetchStudentAttendanceByEventAndBlock = async (
  eventId,
  blockId,
  searchQuery = "",
  page = 1,
  limit = 10
) => {
  try {
    if (!eventId || !blockId) {
      throw new Error("Missing required parameters: eventId and blockId.");
    }

    const params = { event_id: eventId, block_id: blockId, page, limit };

    if (searchQuery.trim() !== "") {
      params.search_query = searchQuery;
    }

    const response = await axios.get(
      `${API_URL}/api/attendance/events/blocks/students`,
      { params }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch student attendance data."
    );
  } catch (error) {
    console.error("❌ Failed to fetch student attendance:", error.message);
    throw error;
  }
};

export const fetchAttendanceSummaryPerBlock = async (
  eventId,
  blockId,
  attendanceFilter = "all"
) => {
  try {
    if (!eventId || !blockId) {
      throw new Error("Missing required parameters: eventId and blockId.");
    }

    const response = await axios.get(`${API_URL}/api/attendance/summary`, {
      params: { event_id: eventId, block_id: blockId, attendanceFilter },
    });

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch attendance summary."
    );
  } catch (error) {
    console.error("❌ Failed to fetch attendance summary:", error.message);
    throw error;
  }
};

export const getStudentAttSummary = async (eventId, studentId) => {
  try {
    if (!eventId || !studentId) {
      throw new Error("Missing required parameters: eventId and studentId.");
    }

    const response = await axios.get(
      `${API_URL}/api/attendance/student/summary`,
      { params: { event_id: eventId, student_id: studentId } }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch attendance summary."
    );
  } catch (error) {
    console.error("❌ Failed to fetch attendance summary:", error.message);
    throw error;
  }
};

export const fetchAttendanceSummaryOfEvent = async (
  eventId,
  departmentId,
  yearLevelId
) => {
  try {
    if (!eventId) {
      throw new Error("Missing required parameter: eventId.");
    }

    if (typeof eventId !== "string" && typeof eventId !== "number") {
      throw new Error("Invalid eventId format. Expected string or number.");
    }

    const params = { event_id: eventId };
    if (departmentId) params.department_id = departmentId;
    if (yearLevelId) params.year_level_id = yearLevelId;

    const response = await axios.get(
      `${API_URL}/api/attendance/event/summary`,
      {
        params,
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response || !response.data) {
      throw new Error("Invalid response format from server.");
    }

    if (response.data.success) {
      return response.data;
    }

    throw new Error(
      response.data.message || "Failed to fetch attendance summary."
    );
  } catch (error) {
    if (error.response) {
      console.error("❌ Server error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        eventId,
      });

      if (error.response.status === 404) {
        throw new Error(`Event with ID ${eventId} not found.`);
      } else if (error.response.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      } else if (error.response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }

      throw new Error(
        error.response.data?.message || `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      console.error("❌ Network error:", error.request);
      throw new Error("Network error. Please check your internet connection.");
    } else {
      console.error("❌ Error:", error.message);
      throw error;
    }
  }
};
