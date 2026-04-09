import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import socketService from "../services/socketService";
import { getStoredEvents } from "../database/queries";
import { useAuth } from "./AuthContext";

const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const updateNotificationTimeoutRef = useRef(null);
  const [lastEventUpdate, setLastEventUpdate] = useState(0);

  const notifyEventUpdate = useCallback(() => {
    if (updateNotificationTimeoutRef.current)
      clearTimeout(updateNotificationTimeoutRef.current);
    updateNotificationTimeoutRef.current = setTimeout(() => {
      setLastEventUpdate(Date.now());
    }, 2000);
  }, []);

  const canViewEvents = (userRoleId) => [1, 2, 3, 4].includes(userRoleId);

  const normalizeBlockId = (blockId) => {
    if (blockId === null || blockId === undefined) return null;
    return parseInt(blockId);
  };

  const isEventRelevantToUser = (eventBlockIds, userBlockId, userRoleId) => {
    if (![1, 2, 3, 4].includes(userRoleId)) return false;
    if (!userBlockId) return false;

    const normalizedUserBlockId = normalizeBlockId(userBlockId);
    const normalizedEventBlockIds = Array.isArray(eventBlockIds)
      ? eventBlockIds.map((id) => normalizeBlockId(id))
      : [];

    return normalizedEventBlockIds.includes(normalizedUserBlockId);
  };

  const refreshEventsFromDatabase = useCallback(async () => {
    if (!user || !canViewEvents(user.role_id)) {
      setEvents([]);
      return [];
    }

    try {
      setLoading(true);
      const storedEvents = await getStoredEvents();
      let approvedEvents = (storedEvents || []).filter(
        (event) => event.status === "Approved",
      );

      if ([1, 2, 3, 4].includes(user.role_id) && user.block_id) {
        approvedEvents = approvedEvents.filter((event) =>
          isEventRelevantToUser(
            event.eventBlocks || event.block_ids,
            user.block_id,
            user.role_id,
          ),
        );
      }

      setEvents(approvedEvents);
      return approvedEvents;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAndStoreEvents = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    if (now - lastFetchTime < 2000) return;
    setLastFetchTime(now);

    try {
      const { fetchUpcomingEvents } = await import("../services/api");
      const { storeEvent, cleanupOutdatedEvents } =
        await import("../database/queries");

      const blockIdToFetch =
        [1, 2, 3, 4].includes(user.role_id) && user.block_id
          ? user.block_id
          : null;
      const response = await fetchUpcomingEvents(blockIdToFetch);

      if (!response?.success)
        throw new Error("Failed to fetch events from API.");

      const allEvents = response.events || [];
      if (allEvents.length === 0) {
        await cleanupOutdatedEvents([], true);
        await refreshEventsFromDatabase();
        return;
      }

      const allApiEventIds = allEvents.map((e) => e.event_id);
      await cleanupOutdatedEvents(allApiEventIds);

      for (const event of allEvents) {
        await storeEvent(event, allApiEventIds);
      }

      await refreshEventsFromDatabase();
    } catch {
      await refreshEventsFromDatabase();
    }
  }, [user, lastFetchTime, refreshEventsFromDatabase]);

  useEffect(() => {
    if (authLoading || !user) {
      setEvents([]);
      return;
    }

    refreshEventsFromDatabase();
    socketService.connect();

    if (user.role_id === 3 || user.role_id === 4) {
      socketService.joinRoom("all-events");
    } else if ((user.role_id === 1 || user.role_id === 2) && user.block_id) {
      socketService.joinRoom(`block-${user.block_id}`);
    }

    const triggerRefresh = () => {
      setLastEventUpdate(Date.now());
    };

    const handleEventDeleted = (data) => {
      setEvents((prev) => prev.filter((e) => e.event_id !== data.event_id));
      triggerRefresh();
    };

    const eventTypes = [
      "newApprovedEvent",
      "upcoming-events-updated",
      "events-list-updated",
      "event-updated",
      "event-deleted",
    ];

    eventTypes.forEach((type) => socketService.socket?.off(type));

    socketService.socket?.on("newApprovedEvent", triggerRefresh);
    socketService.socket?.on("upcoming-events-updated", triggerRefresh);
    socketService.socket?.on("events-list-updated", triggerRefresh);
    socketService.socket?.on("event-updated", triggerRefresh);
    socketService.socket?.on("event-deleted", handleEventDeleted);

    return () => {
      eventTypes.forEach((type) => socketService.socket?.off(type));
    };
  }, [user, authLoading, refreshEventsFromDatabase]);

  return (
    <EventsContext.Provider
      value={{
        events,
        refreshEventsFromDatabase,
        loading,
        fetchAndStoreEvents,
        lastEventUpdate,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
};
