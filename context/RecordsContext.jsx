import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getStoredUser } from "../database/queries";
import { useAuth } from "./AuthContext";
import { useEvents } from "./EventsContext";
import {
  fetchUserOngoingEvents,
  fetchUserPastEvents,
  fetchAllPastEvents,
  fetchAllOngoingEvents,
} from "../services/api/records";

const RecordsContext = createContext();

export const RecordsProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { lastEventUpdate } = useEvents();
  const [allEvents, setAllEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [blockId, setBlockId] = useState(null);

  const canViewRecords = (userRoleId) => {
    return [1, 2, 3].includes(userRoleId);
  };

  const fetchRecordsData = useCallback(async () => {
    if (!user || !canViewRecords(user.role_id)) {
      setAllEvents([]);
      setOngoingEvents([]);
      setPastEvents([]);
      return;
    }

    const now = Date.now();
    if (now - lastFetchTime < 3000) {
      return;
    }
    setLastFetchTime(now);

    try {
      setLoading(true);
      let ongoingEventsData = [];
      let pastEventsData = [];
      let userIdNumber = null;
      let userBlockNumber = null;

      if (user.role_id === 1 || user.role_id === 2) {
        const storedUser = await getStoredUser();
        if (!storedUser || !storedUser.id_number) {
          return;
        }

        userIdNumber = storedUser.id_number;
        userBlockNumber = storedUser.block_id || null;
        setStudentId(userIdNumber);
        setBlockId(userBlockNumber);

        const [ongoingResponse, pastResponse] = await Promise.all([
          fetchUserOngoingEvents(userIdNumber),
          fetchUserPastEvents(userIdNumber),
        ]);

        ongoingEventsData = ongoingResponse?.events || [];
        pastEventsData = pastResponse?.events || [];
      } else if (user.role_id === 3) {
        const [ongoingResponse, pastResponse] = await Promise.all([
          fetchAllOngoingEvents(),
          fetchAllPastEvents(),
        ]);

        ongoingEventsData = ongoingResponse?.events || [];
        pastEventsData = pastResponse?.events || [];
      }

      const groupedEvents = {};
      [...ongoingEventsData, ...pastEventsData].forEach((record) => {
        const { event_id, event_name, event_dates } = record;
        if (!groupedEvents[event_id]) {
          groupedEvents[event_id] = {
            event_id,
            event_name,
            event_dates: event_dates ? event_dates.split(",") : [],
          };
        }
      });

      const allEventsData = Object.values(groupedEvents);
      const ongoingList = Object.values(groupedEvents).filter((event) =>
        ongoingEventsData.some((e) => e.event_id === event.event_id)
      );
      const pastList = Object.values(groupedEvents).filter((event) =>
        pastEventsData.some((e) => e.event_id === event.event_id)
      );

      setAllEvents(allEventsData);
      setOngoingEvents(ongoingList);
      setPastEvents(pastList);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [user?.role_id, user?.id_number, lastFetchTime]);

  const filterEvents = useCallback(
    (searchTerm) => {
      if (!searchTerm.trim()) {
        return {
          filteredOngoing: ongoingEvents,
          filteredPast: pastEvents,
        };
      }

      const filteredEvents = allEvents.filter((event) =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return {
        filteredOngoing: filteredEvents.filter((event) =>
          ongoingEvents.some((e) => e.event_id === event.event_id)
        ),
        filteredPast: filteredEvents.filter((event) =>
          pastEvents.some((e) => e.event_id === event.event_id)
        ),
      };
    },
    [allEvents, ongoingEvents, pastEvents]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setAllEvents([]);
      setOngoingEvents([]);
      setPastEvents([]);
      return;
    }

    fetchRecordsData();
  }, [authLoading, user?.role_id, user?.id_number, fetchRecordsData]);

  useEffect(() => {
    if (lastEventUpdate > 0) {
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch < 3000) {
        return;
      }

      const timeoutId = setTimeout(() => {
        fetchRecordsData();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [lastEventUpdate]);

  return (
    <RecordsContext.Provider
      value={{
        allEvents,
        ongoingEvents,
        pastEvents,
        loading,
        studentId,
        blockId,
        fetchRecordsData,
        filterEvents,
        canViewRecords,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error("useRecords must be used within RecordsProvider");
  }
  return context;
};
