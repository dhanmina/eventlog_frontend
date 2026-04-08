import socketService from "./socketService";
import { storeEvent } from "../database/queries";

class GlobalSocketHandler {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.listenersAttached = false;
  }

  initialize(user) {
    if (this.isInitialized && this.currentUser?.block_id === user?.block_id) {
      return;
    }
    if (this.isInitialized) {
      this.cleanup();
    }
    this.currentUser = user;
    this.setupGlobalListeners();
    this.isInitialized = true;
  }

  setupGlobalListeners() {
    if (!this.currentUser?.block_id) {
      return;
    }

    socketService.connect();

    const joinRoom = () => {
      if (socketService.socket?.connected) {
        socketService.joinRoom(`block-${this.currentUser.block_id}`);
      } else {
        setTimeout(joinRoom, 500);
      }
    };

    joinRoom();

    this.removeGlobalListeners();

    socketService.socket?.onAny((eventName, ...args) => {});

    socketService.socket?.on(
      "newApprovedEvent",
      this.handleNewApprovedEventBound
    );
    socketService.socket?.on("new-event-added", this.handleNewEventAddedBound);
    socketService.socket?.on(
      "upcoming-events-updated",
      this.handleUpcomingEventsUpdatedBound
    );
    socketService.socket?.on(
      "events-list-updated",
      this.handleEventsListUpdatedBound
    );

    this.listenersAttached = true;
  }

  removeGlobalListeners() {
    if (socketService.socket && this.listenersAttached) {
      socketService.socket.offAny();
      socketService.socket.off(
        "newApprovedEvent",
        this.handleNewApprovedEventBound
      );
      socketService.socket.off(
        "new-event-added",
        this.handleNewEventAddedBound
      );
      socketService.socket.off(
        "upcoming-events-updated",
        this.handleUpcomingEventsUpdatedBound
      );
      socketService.socket.off(
        "events-list-updated",
        this.handleEventsListUpdatedBound
      );

      this.listenersAttached = false;
    }
  }

  handleNewApprovedEventBound = (data) => {
    this.handleNewApprovedEvent(data);
  };

  handleNewEventAddedBound = (data) => {
    this.handleNewEventAdded(data);
  };

  handleUpcomingEventsUpdatedBound = (data) => {
    this.handleUpcomingEventsUpdated(data);
  };

  handleEventsListUpdatedBound = (data) => {
    this.handleEventsListUpdated(data);
  };

  handleNewApprovedEvent(data) {
    const eventBlockIds = data.data?.block_ids || [];
    const userBlockId = this.currentUser?.block_id;
    const userRoleId = this.currentUser?.role_id;

    let isRelevantToUser = false;

    if (userRoleId === 3 || userRoleId === 4) {
      isRelevantToUser = true;
    } else if (userRoleId === 1 || userRoleId === 2) {
      if (userBlockId === null || userBlockId === undefined) {
        isRelevantToUser = false;
      } else {
        isRelevantToUser =
          eventBlockIds.includes(userBlockId) ||
          eventBlockIds.includes(userBlockId?.toString()) ||
          eventBlockIds.includes(parseInt(userBlockId));
      }
    } else {
      if (userBlockId === null || userBlockId === undefined) {
        isRelevantToUser = true;
      } else {
        isRelevantToUser =
          eventBlockIds.includes(userBlockId) ||
          eventBlockIds.includes(userBlockId?.toString()) ||
          eventBlockIds.includes(parseInt(userBlockId));
      }
    }

    if (isRelevantToUser && data.data?.status === "Approved") {
      this.saveEventToDatabase(data.data);
    }
  }

  handleNewEventAdded(data) {
    const eventBlockIds = data.block_ids || [];
    const userBlockId = this.currentUser?.block_id;
    const userRoleId = this.currentUser?.role_id;

    let isRelevantToUser = false;

    if (userRoleId === 3 || userRoleId === 4) {
      isRelevantToUser = true;
    } else if (userRoleId === 1 || userRoleId === 2) {
      if (userBlockId === null || userBlockId === undefined) {
        isRelevantToUser = false;
      } else {
        isRelevantToUser =
          eventBlockIds.includes(userBlockId) ||
          eventBlockIds.includes(parseInt(userBlockId));
      }
    } else {
      if (userBlockId === null || userBlockId === undefined) {
        isRelevantToUser = true;
      } else {
        isRelevantToUser =
          eventBlockIds.includes(userBlockId) ||
          eventBlockIds.includes(parseInt(userBlockId));
      }
    }

    if (isRelevantToUser && data.event?.status === "Approved") {
      this.saveEventToDatabase(data.event);
    }
  }

  handleUpcomingEventsUpdated(data) {
    if (data.block_id === this.currentUser?.block_id && data.events) {
      data.events.forEach((event) => {
        if (event.status === "Approved") {
          this.saveEventToDatabase(event);
        }
      });
    }
  }

  handleEventsListUpdated(data) {
    if (data.events) {
      data.events.forEach((event) => {
        if (event.status === "Approved") {
          this.saveEventToDatabase(event);
        }
      });
    }
  }

  async saveEventToDatabase(eventData) {
    try {
      if (!eventData.event_id || !eventData.event_name) {
        return;
      }

      const result = await storeEvent(eventData, []);

      if (result?.success && socketService.socket) {
        socketService.socket.emit("database-updated", {
          type: "event-saved",
          eventId: eventData.event_id,
          eventName: eventData.event_name,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {}
  }

  cleanup() {
    if (this.currentUser?.block_id) {
      socketService.leaveRoom(`block-${this.currentUser.block_id}`);
    }

    this.removeGlobalListeners();
    this.isInitialized = false;
    this.currentUser = null;
  }

  updateUser(user) {
    if (this.currentUser?.block_id !== user?.block_id) {
      this.cleanup();
      this.initialize(user);
    }
  }

  testGlobalHandler() {
    return {
      initialized: this.isInitialized,
      user: this.currentUser?.id_number,
      block: this.currentUser?.block_id,
      socketConnected: socketService.socket?.connected,
      socketId: socketService.socket?.id,
      listenersAttached: this.listenersAttached,
    };
  }
}

const globalSocketHandler = new GlobalSocketHandler();
export default globalSocketHandler;
