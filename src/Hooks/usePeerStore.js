import { create } from "zustand";

const usePeersStore = create((set) => ({
    peers: {},

    updatePeers: (newPeers) => set({peers: newPeers})
}))

export default usePeersStore