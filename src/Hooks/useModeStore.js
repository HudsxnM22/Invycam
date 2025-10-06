import { create } from "zustand";

const useModeStore = create((set) => ({
    mode: "menu", //menu is the default store - menu, operation, and edit. tells app.jsx what to render and unmount
    recordSelectMode: false,

    onScreenPeers: {}, //allows for easy access to display data of peers currently on screen

    changeMode: (newMode) => set({mode: newMode}),  //str
    setRecordSelectMode: (bool) => set({recordSelectMode: bool}),
    //peer === an instance of Connection
    addOnScreenPeer: (peer) => set((state) => ({
        onScreenPeers: {...state.onScreenPeers, [peer.peerId]: peer}
    })),
    removeOnScreenPeer: (peer) => set((state) => {
        const updatedPeers = {...state.onScreenPeers}
        delete updatedPeers[peer.peerId]
        return {onScreenPeers: updatedPeers}
    })
}))

export default useModeStore