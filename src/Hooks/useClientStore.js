import { create } from "zustand";

const useClientStore = create((set) => ({
    roomId: "",
    roomStatus: "disconnected",
    role: "guest", // possible values: "guest", "host"
    username: "",
    startedStream: false,

    setRoomStatus: (roomStatus) => set({ roomStatus }),
    setRole: (role) => set({ role }),
    setUsername: (username) => set({ username }),
    setRoomId: (roomId) => set({ roomId }),
    setStartedStream: (bool) => set({startedStream: bool})
}))

export default useClientStore