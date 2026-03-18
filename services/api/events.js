import axios from "axios";
import { API_URL } from "../../config/config";

export const fetchEventById = async (eventId) => {
  try {
    const response = await axios.get(`${API_URL}/api/events/${eventId}`);
    if (response.data.success) {
      return response.data.event;
    }
    throw new Error("Failed to fetch event details");
  } catch (error) {
    throw error;
  }
};

export const fetchEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/events`);

    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const fetchApprovedOngoing = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/events`);

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
    const response = await axios.get(`${API_URL}/api/events/upcoming`, {
      params: { block_id: blockId },
    });

    if (response.data.success) {
      return response.data;
    }
    throw new Error("Failed to fetch user upcoming events");
  } catch (error) {
    throw error;
  }
};

export const addEvent = async (eventData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/events/admin`,
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

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/events/admin/${eventId}`,
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

export const deleteEvent = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/events/admin/${id}`);
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to delete event");
  } catch (error) {
    throw error;
  }
};

export const approveEvent = async (eventId, adminId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/events/admin/${eventId}/status`,
      { admin_id_number: adminId }
    );

    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const fetchEventNames = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/event-names`);

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
    const response = await axios.post(`${API_URL}/api/event-names`, { name });
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
    const response = await axios.put(`${API_URL}/api/event-names/${id}`, data);
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
    const response = await axios.delete(`${API_URL}/api/event-names/${id}`);
    if (response.data.success) {
      return true;
    }
    throw new Error("Failed to delete event name");
  } catch (error) {
    throw error;
  }
};

export const disableEventName = async (eventId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/event-names/${eventId}/status`
    );
    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};
