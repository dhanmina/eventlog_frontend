import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import socketService from "../services/socketService";
import { getStoredEvents, deleteStoredEvent } from "../database/queries";
import { useAuth } from "./AuthContext";

const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [lastEventUpdate, setLastEventUpdate] = useState(0);

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
      let approvedEvents = (storedEvents || []).filter((event) => event.status === "Approved");

      if ([1, 2, 3, 4].includes(user.role_id) && user.block_id) {
        approvedEvents = approvedEvents.filter((event) =>
          isEventRelevantToUser(event.eventBlocks || event.block_ids, user.block_id, user.role_id)
        );
      }

      setEvents(approvedEvents);
      return approvedEvents;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAndStoreEvents = useCallback(async (force = false) => {
    if (!user) return;

    const now = Date.now();
    if (!force && now - lastFetchTime < 2000) return;
    setLastFetchTime(now);

    try {
      const { fetchUpcomingEvents } = await import("../services/api/events");
      const { storeEvent, cleanupOutdatedEvents } = await import("../database/queries");

      const response = await fetchUpcomingEvents(user.block_id || null);

      if (!response?.success) throw new Error("Failed to fetch events from API.");

      const allEvents = response.events || response.data || [];
      if (allEvents.length === 0) return;

      const allApiEventIds = allEvents.map((e) => e.event_id);
      await cleanupOutdatedEvents(allApiEventIds);

      for (const event of allEvents) {
        await storeEvent(event);
      }

      await refreshEventsFromDatabase();
    } catch {
      await refreshEventsFromDatabase();
    }
  }, [user, lastFetchTime, refreshEventsFromDatabase]);

  const isFetchingRef = useRef(false);
  const fetchAndStoreEventsRef = useRef(fetchAndStoreEvents);
  useEffect(() => {
    fetchAndStoreEventsRef.current = fetchAndStoreEvents;
  }, [fetchAndStoreEvents]);

  useEffect(() => {
    if (authLoading || !user) {
      setEvents([]);
      return;
    }

    refreshEventsFromDatabase();
    socketService.connect();

    if ([1, 2].includes(user.role_id) && user.block_id) {
      socketService.joinRoom(`block-${user.block_id}`);
    }
    if ([3, 4].includes(user.role_id)) {
      socketService.joinRoom("all-events");
    }

    const triggerFullRefresh = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await fetchAndStoreEventsRef.current(true);
      } finally {
        isFetchingRef.current = false;
      }
    };

    const handleNewApprovedEvent = (data) => {
      if (isEventRelevantToUser(data?.block_ids, user.block_id, user.role_id)) {
        setLastEventUpdate(Date.now());
      }
      triggerFullRefresh();
    };

    const handleEventDeleted = async (data) => {
      const { event_id } = data;
      if (!event_id) return;
      await deleteStoredEvent(event_id);
      setEvents((prev) => prev.filter((e) => e.event_id !== event_id));
    };

    const eventTypes = [
      "database-updated",
      "newApprovedEvent",
      "new-event-added",
      "events-list-updated",
      "upcoming-events-updated",
      "event-updated",
      "event-deleted",
    ];
    eventTypes.forEach((type) => socketService.socket?.off(type));

    socketService.socket?.on("database-updated", triggerFullRefresh);
    socketService.socket?.on("newApprovedEvent", handleNewApprovedEvent);
    socketService.socket?.on("new-event-added", triggerFullRefresh);
    socketService.socket?.on("events-list-updated", triggerFullRefresh);
    socketService.socket?.on("upcoming-events-updated", triggerFullRefresh);
    socketService.socket?.on("event-updated", triggerFullRefresh);
    socketService.socket?.on("event-deleted", handleEventDeleted);

    return () => {
      eventTypes.forEach((type) => socketService.socket?.off(type));
      if ([3, 4].includes(user.role_id)) {
        socketService.leaveRoom("all-events");
      }
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
