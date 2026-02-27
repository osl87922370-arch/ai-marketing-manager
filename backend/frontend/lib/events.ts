const KEY = "history_refresh_tick";
const EVT = "history_refresh";

export function emitHistoryRefresh() {
    if (typeof window === "undefined") return;

    const tick = String(Date.now());
    localStorage.setItem(KEY, tick);
    window.dispatchEvent(new Event(EVT)); // 같은 탭 즉시 반응
}

export function onHistoryRefresh(handler: () => void) {
    if (typeof window === "undefined") return () => { };

    const storageListener = (e: StorageEvent) => {
        if (e.key === KEY) handler();
    };

    const eventListener = () => handler();

    window.addEventListener("storage", storageListener);
    window.addEventListener(EVT, eventListener);

    return () => {
        window.removeEventListener("storage", storageListener);
        window.removeEventListener(EVT, eventListener);
    };
}