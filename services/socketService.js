import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/config";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
    this.pendingRooms = new Set();
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    const serverUrl = API_URL;
    this.isConnecting = true;

    try {
      if (!this.socket) {
        this.socket = io(serverUrl, {
          withCredentials: true,
          transports: ["polling", "websocket"],
          timeout: 10000,
          forceNew: true,
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        this.socket.on("connect", () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
          }

          this.pendingRooms.forEach((room) => {
            this.socket.emit("join-room", room);
          });
        });

        this.socket.on("disconnect", (reason) => {
          this.isConnecting = false;

          if (reason === "io server disconnect" || reason === "transport close") {
            this.attemptReconnection();
          }
        });

        this.socket.on("connect_error", () => {
          this.isConnecting = false;
          this.attemptReconnection();
        });

        this.socket.on("reconnect", () => {
          this.reconnectAttempts = 0;
        });

        this.socket.on("reconnect_error", () => {});

        this.socket.on("reconnect_failed", () => {
          this.isConnecting = false;
        });

        this.socket.on("room-joined", () => {});
        this.socket.on("room-left", () => {});
      }

      const socket = this.socket;
      AsyncStorage.getItem("userToken")
        .then((token) => {
          if (this.socket !== socket || socket.connected) {
            return;
          }

          socket.auth = token ? { token } : {};
          socket.connect();
        })
        .catch(() => {
          this.isConnecting = false;
        });
    } catch (error) {
      this.isConnecting = false;
      this.attemptReconnection();
    }
  }

  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (this.reconnectInterval) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.pendingRooms.clear();
      } catch (error) {}
    }
  }

  joinRoom(room) {
    if (!room) {
      return;
    }

    this.pendingRooms.add(room);

    if (!this.socket) {
      this.connect();
      return;
    }

    if (!this.socket.connected) {
      if (!this.isConnecting) {
        this.connect();
      }
      return;
    }

    try {
      this.socket.emit("join-room", room);
    } catch (error) {}
  }

  leaveRoom(room) {
    if (!room) {
      return;
    }

    this.pendingRooms.delete(room);

    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit("leave-room", room);
      } catch (error) {}
    }
  }

  ensureConnection() {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  off(event, listener) {
    if (this.socket) {
      this.socket.off(event, listener);
    }
  }

  on(event, listener) {
    if (this.socket) {
      this.socket.on(event, listener);
    }
  }
}

const socketService = new SocketService();

export default socketService;
