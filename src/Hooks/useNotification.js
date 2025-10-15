import { create } from "zustand";

const useNotification = create((set) => ({
    notifications: [],

    notify: (type, message) => {
        const id = crypto.randomUUID();
        const notification = { id, type, message }

        set((state) => ({ notifications: state.notifications.length < 2 ? [...state.notifications, notification] : [notification]}))

        const timeoutId = setTimeout(() => {
            set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
        }, 2000)

        return timeoutId;
    },

    removeNotification: (id) => {
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
    },
}));

export default useNotification