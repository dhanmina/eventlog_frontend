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
const EVENT_VIEWER_ROLE_IDS = [1, 2, 3, 4];
const BLOCK_SCOPED_EVENT_ROLE_IDS = [1, 2];

export const EventsProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchTimeRef = useRef(0);
  const [lastEventUpdate, setLastEventUpdate] = useState(0);

  const canViewEvents = (userRoleId) =>
    EVENT_VIEWER_ROLE_IDS.includes(userRoleId);

  const shouldFilterByBlock = (userRoleId) =>
    BLOCK_SCOPED_EVENT_ROLE_IDS.includes(userRoleId);

  const normalizeBlockId = (blockId) => {
    if (blockId === null || blockId === undefined) return null;
    return parseInt(blockId);
  };

  const isEventRelevantToUser = (eventBlockIds, userBlockId, userRoleId) => {
    if (!canViewEvents(userRoleId)) return false;
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

      if (shouldFilterByBlock(user.role_id) && user.block_id) {
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

  const fetchAndStoreEvents = useCallback(async ({ force = false } = {}) => {
    if (!user) return;

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2000) return;
    lastFetchTimeRef.current = now;

    try {
      const { fetchUpcomingEvents } = await import("../services/api");
      const { storeEvent, cleanupOutdatedEvents } =
        await import("../database/queries");

      const blockIdToFetch =
        shouldFilterByBlock(user.role_id) && user.block_id
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
  }, [user, refreshEventsFromDatabase]);

  useEffect(() => {
    if (authLoading || !user) {
      setEvents([]);
      return;
    }

    refreshEventsFromDatabase();
    socketService.connect();

    let joinedRoom = null;
    if (user.role_id === 3 || user.role_id === 4) {
      joinedRoom = "all-events";
    } else if ((user.role_id === 1 || user.role_id === 2) && user.block_id) {
      joinedRoom = `block-${user.block_id}`;
    }

    if (joinedRoom) {
      socketService.joinRoom(joinedRoom);
    }

    const triggerRefresh = () => {
      setLastEventUpdate(Date.now());
      fetchAndStoreEvents({ force: true });
    };

    const handleEventDeleted = (data) => {
      setEvents((prev) =>
        prev.filter(
          (event) => String(event.event_id) !== String(data.event_id),
        ),
      );
      triggerRefresh();
    };

    socketService.socket?.on("newApprovedEvent", triggerRefresh);
    socketService.socket?.on("upcoming-events-updated", triggerRefresh);
    socketService.socket?.on("events-list-updated", triggerRefresh);
    socketService.socket?.on("event-updated", triggerRefresh);
    socketService.socket?.on("event-deleted", handleEventDeleted);

    return () => {
      socketService.socket?.off("newApprovedEvent", triggerRefresh);
      socketService.socket?.off("upcoming-events-updated", triggerRefresh);
      socketService.socket?.off("events-list-updated", triggerRefresh);
      socketService.socket?.off("event-updated", triggerRefresh);
      socketService.socket?.off("event-deleted", handleEventDeleted);
      if (joinedRoom) {
        socketService.leaveRoom(joinedRoom);
      }
    };
  }, [user, authLoading, refreshEventsFromDatabase, fetchAndStoreEvents]);

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
