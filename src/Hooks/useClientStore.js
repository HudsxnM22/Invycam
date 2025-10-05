import { create } from "zustand";

const useClientStore = create((set) => ({
    roomId: "",
    roomStatus: "disconnected",
    role: "host", // possible values: "guest", "host" TODO: change to guest by deafault...
    username: "",
    startedStream: false,
    localStream: null,

    setRoomStatus: (roomStatus) => set({ roomStatus }),
    setRole: (role) => set({ role }),
    setUsername: (username) => set({ username }),
    setRoomId: (roomId) => set({ roomId }),
    setStartedStream: (bool) => set({startedStream: bool}),
    setLocalStream: (MediaStream) => set({localStream: MediaStream})
}))

export default useClientStore