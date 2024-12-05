import React, { useState, useEffect } from "react";

const AppFooter = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString();
    const formattedTime = currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="layout-footer">
            <span>
                {formattedDate} {formattedTime}
            </span>
        </div>
    );
};

export default AppFooter;
