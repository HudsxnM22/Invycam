import { create } from "zustand";

const useClientStore = create((set) => ({
    roomId: "",
    roomStatus: "disconnected", //"disconnected", "creating", "joining", "connected", "leaving"
    role: "guest", // possible values: "guest", "host"
    username: "",
    startedStream: false,
    localStream: null,
    loggedIn: false,
    currentScreen: null, // desktopCapturer source id, e.g. "screen:2:0"

    setRoomStatus: (roomStatus) => set({ roomStatus }),
    setRole: (role) => set({ role }),
    setUsername: (username) => set({ username }),
    setRoomId: (roomId) => set({ roomId }),
    setStartedStream: (bool) => set({startedStream: bool}),
    setLocalStream: (MediaStream) => set({localStream: MediaStream}),
    setLoggedIn: (bool) => set({loggedIn: bool}),
    setCurrentScreen: (screenId) => set({currentScreen: screenId}),
}))

export default useClientStore