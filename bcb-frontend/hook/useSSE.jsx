import { useEffect, useRef } from "react";

export default function useSSE(userId) {
    const sourceRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        const token = localStorage.getItem("authToken");
        if (!token) return;

        const source = new EventSource(
            `${import.meta.env.VITE_API_URL}/sse/subscribe/${encodeURIComponent(userId)}?token=${encodeURIComponent(token)}`
        );
        sourceRef.current = source;

        // console.log("SSE connected:", userId);

        source.onerror = () => {
            // console.log("SSE error, closing...");
            source.close();
        };

        return () => {
            // console.log("SSE cleanup - closed");
            source.close();
        };
    }, [userId]);

    const onEvent = (eventName, callback) => {
        sourceRef.current?.addEventListener(eventName, (event) => {
            callback(JSON.parse(event.data));
        });
    };

    return { onEvent };
}
