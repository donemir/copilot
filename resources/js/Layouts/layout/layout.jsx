import {
    useEventListener,
    useMountEffect,
    useUnmountEffect,
} from "primereact/hooks";
import React, { useContext, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { classNames } from "primereact/utils";
import AppFooter from "@/Layouts/layout/AppFooter.jsx";
import AppSidebar from "@/Layouts/layout/AppSidebar.jsx";
import AppTopbar from "@/Layouts/layout/AppTopbar.jsx";
import AppConfig from "@/Layouts/layout/AppConfig.jsx";
import { LayoutContext } from "./context/layoutcontext";
import { PrimeReactContext } from "primereact/api";
import { Toast } from "primereact/toast";
// import { usePathname, useSearchParams } from "next/navigation";

const Layout = ({ children }) => {
    const { flash = {}, userSettings } = usePage().props;
    const toast = useRef(null);

    const { layoutConfig, setLayoutConfig, layoutState, setLayoutState } =
        useContext(LayoutContext);

    const { changeTheme } = useContext(PrimeReactContext);

    const { setRipple } = useContext(PrimeReactContext);
    const topbarRef = useRef(null);
    const sidebarRef = useRef(null);

    const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] =
        useEventListener({
            type: "click",
            listener: (event) => {
                const isOutsideClicked = !(
                    sidebarRef.current?.isSameNode(event.target) ||
                    sidebarRef.current?.contains(event.target) ||
                    topbarRef.current?.menubutton?.isSameNode(event.target) ||
                    topbarRef.current?.menubutton?.contains(event.target)
                );

                if (isOutsideClicked) {
                    hideMenu();
                }
            },
        });

    const pathname = route().current();

    // Check userSettings on mount or update, and call changeTheme if needed
    useEffect(() => {
        if (userSettings && userSettings.theme) {
            // Convert "dark" => "md-dark-indigo", "light" => "md-light-indigo"
            const newTheme =
                userSettings.theme === "dark"
                    ? "md-dark-indigo"
                    : "md-light-indigo";

            // Only change if the userSetting theme differs from current layoutConfig.theme
            if (layoutConfig.theme !== newTheme) {
                // Call changeTheme to update the <link id="theme-css"> href
                changeTheme?.(layoutConfig.theme, newTheme, "theme-css", () => {
                    // Once loaded, update LayoutContext state so everything stays in sync
                    setLayoutConfig((prev) => ({
                        ...prev,
                        theme: newTheme,
                        colorScheme: userSettings.theme,
                    }));
                });
            }
        }
    }, [userSettings, layoutConfig.theme, setLayoutConfig, changeTheme]);

    // const searchParams = useSearchParams();
    useEffect(() => {
        hideMenu();
        hideProfileMenu();
    }, [pathname]);

    const [
        bindProfileMenuOutsideClickListener,
        unbindProfileMenuOutsideClickListener,
    ] = useEventListener({
        type: "click",
        listener: (event) => {
            const isOutsideClicked = !(
                topbarRef.current?.topbarmenu?.isSameNode(event.target) ||
                topbarRef.current?.topbarmenu?.contains(event.target) ||
                topbarRef.current?.topbarmenubutton?.isSameNode(event.target) ||
                topbarRef.current?.topbarmenubutton?.contains(event.target)
            );

            if (isOutsideClicked) {
                hideProfileMenu();
            }
        },
    });

    const hideMenu = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false,
        }));
        unbindMenuOutsideClickListener();
        unblockBodyScroll();
    };

    const hideProfileMenu = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            profileSidebarVisible: false,
        }));
        unbindProfileMenuOutsideClickListener();
    };

    const blockBodyScroll = () => {
        if (document.body.classList) {
            document.body.classList.add("blocked-scroll");
        } else {
            document.body.className += " blocked-scroll";
        }
    };

    const unblockBodyScroll = () => {
        if (document.body.classList) {
            document.body.classList.remove("blocked-scroll");
        } else {
            document.body.className = document.body.className.replace(
                new RegExp(
                    "(^|\\b)" +
                        "blocked-scroll".split(" ").join("|") +
                        "(\\b|$)",
                    "gi"
                ),
                " "
            );
        }
    };

    useMountEffect(() => {
        setRipple(layoutConfig.ripple);
    });

    useEffect(() => {
        if (
            layoutState.overlayMenuActive ||
            layoutState.staticMenuMobileActive
        ) {
            bindMenuOutsideClickListener();
        }

        layoutState.staticMenuMobileActive && blockBodyScroll();
    }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive]);

    useEffect(() => {
        if (layoutState.profileSidebarVisible) {
            bindProfileMenuOutsideClickListener();
        }
    }, [layoutState.profileSidebarVisible]);

    useEffect(() => {
        if (flash.success && toast.current) {
            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: flash.success,
                life: 3000,
            });
        }
        if (flash.error && toast.current) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: flash.error,
                life: 3000,
            });
        }
    }, [flash]);

    useUnmountEffect(() => {
        unbindMenuOutsideClickListener();
        unbindProfileMenuOutsideClickListener();
    });

    const containerClass = classNames("layout-wrapper", {
        "layout-overlay": layoutConfig.menuMode === "overlay",
        "layout-static": layoutConfig.menuMode === "static",
        "layout-static-inactive":
            layoutState.staticMenuDesktopInactive &&
            layoutConfig.menuMode === "static",
        "layout-overlay-active": layoutState.overlayMenuActive,
        "layout-mobile-active": layoutState.staticMenuMobileActive,
        "p-input-filled": layoutConfig.inputStyle === "filled",
        "p-ripple-disabled": !layoutConfig.ripple,
    });

    return (
        <React.Fragment>
            <Toast ref={toast} />
            <div className={containerClass}>
                <AppTopbar ref={topbarRef} />
                <div ref={sidebarRef} className="layout-sidebar">
                    <AppSidebar />
                </div>
                <div className="layout-main-container">
                    <div className="layout-main">{children}</div>
                    <AppFooter />
                </div>
                <AppConfig />
                <div className="layout-mask"></div>
            </div>
        </React.Fragment>
    );
};

export default Layout;
