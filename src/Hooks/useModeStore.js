import { create } from "zustand";

const useModeStore = create((set) => ({
    mode: "menu", //menu is the default store - menu, operation, and edit. tells app.jsx what to render and unmount
    recordSelectMode: false,

    changeMode: (newMode) => set({mode: newMode}),  //str
    setRecordSelectMode: (bool) => set({recordSelectMode: bool})
}))

export default useModeStore