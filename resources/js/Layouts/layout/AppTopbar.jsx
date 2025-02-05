import { classNames } from "primereact/utils";
import React, {
    forwardRef,
    useContext,
    useImperativeHandle,
    useRef,
} from "react";
import { LayoutContext } from "./context/layoutcontext";
import { Link, router } from "@inertiajs/react";
import { PrimeReactContext } from "primereact/api";
import { Button } from "primereact/button";

const AppTopbar = forwardRef((props, ref) => {
    // Get layout configuration and actions from LayoutContext.
    const {
        layoutConfig,
        layoutState,
        onMenuToggle,
        showProfileSidebar,
        setLayoutConfig,
    } = useContext(LayoutContext);
    // Get the changeTheme function from PrimeReactContext.
    const { changeTheme } = useContext(PrimeReactContext);

    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current,
    }));

    // Toggle between light and dark mode themes and save the setting via Inertia.
    const toggleTheme = () => {
        if (layoutConfig.colorScheme === "light") {
            // Switch to dark theme (e.g., Material Dark Indigo)
            changeTheme?.(
                layoutConfig.theme,
                "md-dark-indigo",
                "theme-css",
                () => {
                    setLayoutConfig((prevState) => ({
                        ...prevState,
                        theme: "md-dark-indigo",
                        colorScheme: "dark",
                    }));
                    // Persist the setting in the backend.
                    router.put("/user-settings", { theme: "dark" });
                }
            );
        } else {
            // Switch to light theme (e.g., Material Light Indigo)
            changeTheme?.(
                layoutConfig.theme,
                "md-light-indigo",
                "theme-css",
                () => {
                    setLayoutConfig((prevState) => ({
                        ...prevState,
                        theme: "md-light-indigo",
                        colorScheme: "light",
                    }));
                    // Persist the setting in the backend.
                    router.put("/user-settings", { theme: "light" });
                }
            );
        }
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img
                    src={`/images/logo/svg-logo.svg`}
                    width="100.22px"
                    height="35px"
                    alt="logo"
                />
            </Link>

            <button
                ref={menubuttonRef}
                type="button"
                className="p-link layout-menu-button layout-topbar-button"
                onClick={onMenuToggle}
            >
                <i className="pi pi-bars" />
            </button>

            {/* Theme Toggle Button */}
            <Button
                icon={
                    layoutConfig.colorScheme === "light"
                        ? "pi pi-sun"
                        : "pi pi-moon"
                }
                className="p-button-rounded p-button-text"
                onClick={toggleTheme}
                tooltip="Toggle Light/Dark Mode"
                tooltipOptions={{ position: "bottom" }}
            />

            <button
                ref={topbarmenubuttonRef}
                type="button"
                className="p-link layout-topbar-menu-button layout-topbar-button"
                onClick={showProfileSidebar}
            >
                <i className="pi pi-user" />
            </button>

            <div
                ref={topbarmenuRef}
                className={classNames("layout-topbar-menu", {
                    "layout-topbar-menu-mobile-active":
                        layoutState.profileSidebarVisible,
                })}
            >
                <Link
                    href={route("profile.edit")}
                    className="p-link layout-topbar-button"
                >
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </Link>
                <Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="p-link layout-topbar-button"
                >
                    <i className="pi pi-lock"></i>
                    <span>Logout</span>
                </Link>
            </div>
        </div>
    );
});

AppTopbar.displayName = "AppTopbar";
export default AppTopbar;
