import React, { useContext } from "react";

const AppFooter = () => {
    return (
        <div className="layout-footer">
            <span>
                Made with <span className="text-red-500">&#10084;&#65039;</span>{" "}
                in
            </span>
            <span className="font-medium ml-2">Vancouver, BC, Canada</span>
        </div>
    );
};

export default AppFooter;
