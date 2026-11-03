import React from "react";
import { useState, useEffect } from "react";
import ConnectionManager from "../../Utils/ConnectionManager";
import useClientStore from "../../Hooks/useClientStore";
import styles from "./MonitorSelect.module.css";

const MonitorSelect = () => {
    const [screens, setScreens] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currentScreen = useClientStore((state) => state.currentScreen);
    const setCurrentScreen = useClientStore((state) => state.setCurrentScreen);

    useEffect(() => {
        setIsModalOpen(false);
    }, [currentScreen]);

    useEffect(() => {
        const fetchScreens = async () => {
            const [screens, current] = await Promise.all([
                window.ipc.getScreens(),
                ConnectionManager.getCurrentMonitor(),
            ]);
            setScreens(screens);
            setCurrentScreen(current);
        };
        fetchScreens();
    }, [setCurrentScreen]);

    const handleMonitorClick = (screenId) => {
        ConnectionManager.changeMainMonitor(screenId);
    };

    useEffect(() => {
        if (!isModalOpen) return;

        const handleEscapeKey = (event) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscapeKey);
        return () => {
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isModalOpen]);

    return (
        <>
            <button type="button" className={styles.openModalButton} onClick={() => setIsModalOpen(true)}>
                <svg className={styles.monitorIcon} viewBox="0 0 24 24" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
                    <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
                Change Main Screen
            </button>

            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.monitorSelect}>
                            {screens.map((screen) => (
                                <div key={screen.id} className={styles.monitorOption} onClick={() => handleMonitorClick(screen.id)}>
                                    <div className={styles.thumbnailWrap}>
                                        <img src={screen.thumbnail} alt={screen.name} />
                                    </div>
                                    <p>{screen.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MonitorSelect;