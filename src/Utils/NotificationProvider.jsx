import { useEffect } from "react";
import useNotification from "../Hooks/useNotification";
import styles from "./NotificationProvider.module.css";

const NotificationProvider = () => {
    const notifications = useNotification((state) => state.notifications)

    const getNotificationSVG = (type) => {
        switch(type) {
            case 'success':
                return (
                    <svg className={styles.notificationIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981" />
                        <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            case 'error':
                return (
                    <svg className={styles.notificationIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#ef4444" />
                        <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                );
            case 'update':
                return (
                    <svg className={styles.notificationIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#3b82f6" />
                        <circle cx="12" cy="10" r="3" fill="white"/>
                        <path d="M6 19c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    const getBackgroundColor = (notification) => {
        const type = notification.type
        switch(type) {
            case "success":
                return "rgba(34, 255, 0, 0.37)"
            case "error":
                return "rgba(255, 0, 0, 0.37)"
            case "update":
                return "rgba(0, 213, 255, 0.37)"
            default:
                return "rgba(255, 255, 255, 0.37)"
        }
    }

    const populateNotifications = () => {
        return notifications.map((notification) => (
            <div
            key={notification.id}
            className={styles.notificationContent}
            style={{background: getBackgroundColor(notification)}}
            >
                {getNotificationSVG(notification.type)}
                <p className={styles.notificationMessage}>
                    {notification.message}
                </p>
            </div>
        ))
    }

    return (
        <span className={styles.notificationContainer}>
            {populateNotifications()}
        </span>
    )
}

export default NotificationProvider