import React, { useRef, useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import Layout from "@/Layouts/layout/layout.jsx";

const Dashboard = () => {
    const toast = useRef(null);

    const { categories: initialCategories } = usePage().props;
    const [categories, setCategories] = useState(initialCategories || []);
    const [pinnedLinks, setPinnedLinks] = useState(
        initialCategories
            ? initialCategories.flatMap((cat) =>
                  cat.bookmarks.filter((link) => link.pinned)
              )
            : []
    );

    // Inline editing category names
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");

    // Adding a new category
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Dialog states
    const [addDialogVisible, setAddDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);

    // Current category ID for add/edit
    const [currentCategoryId, setCurrentCategoryId] = useState(null);

    // Current link for edit
    const [currentLink, setCurrentLink] = useState(null);

    // Link form data
    const [linkData, setLinkData] = useState({
        url: "",
        description: "",
        faviconUrl: "",
    });

    // Update categories/pinned if initialCategories changes
    useEffect(() => {
        setCategories(initialCategories || []);
    }, [initialCategories]);

    useEffect(() => {
        setPinnedLinks(
            categories.flatMap((category) =>
                category.bookmarks.filter((link) => link.pinned)
            )
        );
    }, [categories]);

    // Utility to get favicon URL
    const getFaviconUrl = (url) => {
        try {
            const hasProtocol =
                url.startsWith("http://") || url.startsWith("https://");
            const fullUrl = hasProtocol ? url : `http://${url}`;
            const domain = new URL(fullUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch (error) {
            console.error("Invalid URL", error);
            return "";
        }
    };

    // Start inline editing category
    const startEditingCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    // Save edited category name
    const saveCategoryName = (categoryId) => {
        router.put(
            `/categories/${categoryId}`,
            { name: editingCategoryName },
            {
                onSuccess: () => {
                    setCategories((prev) =>
                        prev.map((cat) =>
                            cat.id === categoryId
                                ? { ...cat, name: editingCategoryName }
                                : cat
                        )
                    );
                    setEditingCategoryId(null);
                    setEditingCategoryName("");
                    toast.current?.show({
                        severity: "success",
                        summary: "Success",
                        detail: "Category updated successfully.",
                        life: 3000,
                    });
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update category name.",
                        life: 3000,
                    });
                },
            }
        );
    };

    // Open Add Link dialog
    const openAddDialog = (categoryId) => {
        setCurrentCategoryId(categoryId);
        setLinkData({ url: "", description: "", faviconUrl: "" });
        setAddDialogVisible(true);
    };

    // Add new category
    const addCategory = () => {
        if (!newCategoryName.trim()) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Category name cannot be empty.",
                life: 3000,
            });
            return;
        }

        router.post(
            "/categories",
            { name: newCategoryName },
            {
                onSuccess: () => {
                    router.reload({ only: ["categories"] });
                    setNewCategoryName("");
                    setAddingCategory(false);
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to create category.",
                        life: 3000,
                    });
                },
            }
        );
    };

    // Delete category
    const deleteCategory = (categoryId) => {
        confirmDialog({
            message: "Are you sure you want to delete this category?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Yes",
            rejectLabel: "No",
            accept: () => {
                router.delete(`/categories/${categoryId}`, {
                    onSuccess: () => {
                        setCategories((prev) =>
                            prev.filter((cat) => cat.id !== categoryId)
                        );
                        toast.current?.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Category deleted successfully.",
                            life: 3000,
                        });
                    },
                    onError: (errors) => {
                        console.error(errors);
                        toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to delete category.",
                            life: 3000,
                        });
                    },
                });
            },
        });
    };

    // Add link
    const addLink = () => {
        if (
            !linkData.url.startsWith("http://") &&
            !linkData.url.startsWith("https://")
        ) {
            linkData.url = "https://" + linkData.url;
        }

        // Validate URL
        try {
            const urlObject = new URL(linkData.url);
            if (!urlObject.hostname.includes(".")) {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Please enter a valid URL.",
                    life: 3000,
                });
                return;
            }
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Please enter a valid URL.",
                life: 3000,
            });
            return;
        }

        const faviconUrl = getFaviconUrl(linkData.url);

        router.post(
            "/bookmarks",
            {
                category_id: currentCategoryId,
                url: linkData.url,
                description: linkData.description,
                favicon_url: faviconUrl,
                order: categories.find(c => c.id === currentCategoryId)?.bookmarks.length || 0,
            },
            {
                onSuccess: () => {
                    router.reload({ only: ["categories"] });
                    setAddDialogVisible(false);
                    setLinkData({ url: "", description: "", faviconUrl: "" });
                    setCurrentCategoryId(null);
                },
                onError: (errors) => {
                    console.error("Error updating link:", errors);
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update link.",
                        life: 3000,
                    });
                },
            }
        );
    };

    // Open Edit Link dialog
    const openEditDialog = (link, categoryId) => {
        setCurrentCategoryId(categoryId);
        setCurrentLink(link);
        setLinkData({
            url: link.url,
            description: link.description,
            faviconUrl: link.faviconUrl,
        });
        setEditDialogVisible(true);
    };

    // Save changes to a link
    const saveLinkChanges = () => {
        if (
            !linkData.url.startsWith("http://") &&
            !linkData.url.startsWith("https://")
        ) {
            linkData.url = "https://" + linkData.url;
        }

        try {
            const urlObject = new URL(linkData.url);
            if (!urlObject.hostname.includes(".")) {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Please enter a valid URL.",
                    life: 3000,
                });
                return;
            }
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Please enter a valid URL.",
                life: 3000,
            });
            return;
        }

        const faviconUrl = getFaviconUrl(linkData.url);

        router.put(
            `/bookmarks/${currentLink.id}`,
            {
                url: linkData.url,
                description: linkData.description,
                favicon_url: faviconUrl,
                pinned: currentLink.pinned,
            },
            {
                onSuccess: () => {
                    setEditDialogVisible(false);
                    setLinkData({ url: "", description: "", faviconUrl: "" });
                    setCurrentLink(null);
                    setCurrentCategoryId(null);
                    toast.current?.show({
                        severity: "success",
                        summary: "Success",
                        detail: "Link updated successfully.",
                        life: 3000,
                    });
                },
                onError: (errors) => {
                    console.error("Error updating link:", errors);
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update link.",
                        life: 3000,
                    });
                },
            }
        );
    };

    // Delete link
    const deleteLink = (linkId, categoryId) => {
        confirmDialog({
            message: "Are you sure you want to delete this link?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Yes",
            rejectLabel: "No",
            accept: () => {
                router.delete(`/bookmarks/${linkId}`, {
                    onSuccess: () => {
                        setCategories((prevCategories) =>
                            prevCategories.map((category) => {
                                if (category.id === categoryId) {
                                    return {
                                        ...category,
                                        bookmarks: category.bookmarks.filter(
                                            (link) => link.id !== linkId
                                        ),
                                    };
                                }
                                return category;
                            })
                        );
                        setPinnedLinks((prevPinned) =>
                            prevPinned.filter((b) => b.id !== linkId)
                        );
                        toast.current?.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Link deleted successfully.",
                            life: 3000,
                        });
                    },
                    onError: (errors) => {
                        console.error(errors);
                    },
                });
            },
        });
    };

    // Pin/unpin link
    const togglePinLink = (link, categoryId) => {
        const newPinnedStatus = !link.pinned;
        router.put(
            `/bookmarks/${link.id}`,
            {
                pinned: newPinnedStatus,
            },
            {
                onSuccess: () => {
                    setCategories((prevCategories) =>
                        prevCategories.map((category) => {
                            if (category.id === categoryId) {
                                return {
                                    ...category,
                                    bookmarks: category.bookmarks.map((b) =>
                                        b.id === link.id
                                            ? { ...b, pinned: newPinnedStatus }
                                            : b
                                    ),
                                };
                            }
                            return category;
                        })
                    );
                    if (newPinnedStatus) {
                        setPinnedLinks((prevPinned) => [
                            ...prevPinned,
                            { ...link, pinned: true },
                        ]);
                    } else {
                        setPinnedLinks((prevPinned) =>
                            prevPinned.filter((b) => b.id !== link.id)
                        );
                    }
                },
                onError: (errors) => {
                    console.error(errors);
                },
            }
        );
    };

    // Reordering helper
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    // On drag end
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination, type } = result;

        if (type === "category") {
            // Reorder categories
            const newCategories = reorder(
                categories,
                source.index,
                destination.index
            );
            setCategories(newCategories);

            // Update order in backend
            const reorderData = newCategories.map((cat, idx) => ({
                id: cat.id,
                order: idx,
            }));
            router.put(
                "/categories/reorder",
                { categories: reorderData },
                {
                    onSuccess: () => {
                        console.log("Categories reordered successfully");
                    },
                    onError: (errors) => {
                        console.error("Error reordering categories:", errors);
                    },
                }
            );
            return;
        }

        if (type === "bookmark") {
            // Reorder pinned => pinned
            if (
                source.droppableId === "pinned" &&
                destination.droppableId === "pinned"
            ) {
                const newPinned = reorder(
                    pinnedLinks,
                    source.index,
                    destination.index
                );
                setPinnedLinks(newPinned);
                return;
            }

            const sourceCategory = categories.find(
                (category) => category.id.toString() === source.droppableId
            );
            const destCategory = categories.find(
                (category) => category.id.toString() === destination.droppableId
            );
            if (!sourceCategory || !destCategory) return;

            const movingItem = sourceCategory.bookmarks[source.index];
            
            // SAME CATEGORY - reorder only
            if (sourceCategory.id === destCategory.id) {
                const reorderedBookmarks = Array.from(sourceCategory.bookmarks);
                reorderedBookmarks.splice(source.index, 1);
                reorderedBookmarks.splice(destination.index, 0, movingItem);
                
                // Update order field
                const updatedBookmarks = reorderedBookmarks.map((bookmark, idx) => ({
                    ...bookmark,
                    order: idx,
                }));
                
                setCategories((prevCategories) =>
                    prevCategories.map((category) =>
                        category.id === sourceCategory.id
                            ? { ...category, bookmarks: updatedBookmarks }
                            : category
                    )
                );
                
                // Send to backend
                router.post(
                    route("bookmarks.updateOrder"),
                    {
                        bookmarks: updatedBookmarks.map((bookmark) => ({
                            id: bookmark.id,
                            order: bookmark.order,
                        })),
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            console.log("Link order updated successfully");
                        },
                        onError: (errors) => {
                            console.error("Error updating link order:", errors);
                        },
                    }
                );
                return;
            }
            
            // DIFFERENT CATEGORY - move to new category
            const newSourceBookmarks = Array.from(sourceCategory.bookmarks);
            newSourceBookmarks.splice(source.index, 1);

            const newDestBookmarks = Array.from(destCategory.bookmarks);
            newDestBookmarks.splice(destination.index, 0, movingItem);

            setCategories((prevCategories) =>
                prevCategories.map((category) => {
                    if (category.id === sourceCategory.id) {
                        return { ...category, bookmarks: newSourceBookmarks };
                    } else if (category.id === destCategory.id) {
                        return { ...category, bookmarks: newDestBookmarks };
                    } else {
                        return category;
                    }
                })
            );

            router.put(
                `/bookmarks/${movingItem.id}`,
                { category_id: destCategory.id },
                {
                    onSuccess: () => {
                        console.log("Link category updated successfully");
                    },
                    onError: (errors) => {
                        console.error("Error updating link category:", errors);
                    },
                }
            );
        }
    };

    // 3-dots menu
    const LinkOptions = ({ link, categoryId }) => {
        const menuRef = useRef(null);

        const items = [
            {
                label: "Edit",
                icon: "pi pi-pencil",
                command: () => openEditDialog(link, categoryId),
            },
            {
                label: link.pinned ? "Unpin" : "Pin",
                icon: link.pinned ? "pi pi-bookmark-fill" : "pi pi-bookmark",
                command: () => togglePinLink(link, categoryId),
            },
            {
                label: "Delete",
                icon: "pi pi-trash",
                command: () => deleteLink(link.id, categoryId),
            },
        ];

        // We stop propagation on the 3-dot button so clicks won't open the link
        const onMenuButtonClick = (e) => {
            e.stopPropagation();
            menuRef.current?.toggle(e);
        };

        return (
            <>
                <Menu model={items} popup ref={menuRef} />
                <Button
                    icon="pi pi-ellipsis-v"
                    className="p-button-text"
                    onClick={onMenuButtonClick}
                />
            </>
        );
    };

    // Helper to open link in new tab
    const openLink = (url) => {
        // Validate: if user doesn't want a new tab, you could do window.location = ...
        // But usually new tab is best
        window.open(url, "_blank");
    };

    return (
        <Layout>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Pinned Links */}
            {pinnedLinks.length > 0 && (
                <div className="col-12">
                    <div className="card">
                        <h5>Pinned Links</h5>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable
                                droppableId="pinned"
                                direction="horizontal"
                                type="bookmark"
                            >
                                {(provided) => (
                                    <div
                                        className="flex flex-wrap"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {pinnedLinks.map((link, index) => (
                                            <Draggable
                                                key={link.id}
                                                draggableId={link.id.toString()}
                                                index={index}
                                                type="bookmark"
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        className={`p-2 m-1 border-round flex-none w-48 ${
                                                            snapshot.isDragging
                                                                ? "surface-200"
                                                                : "surface-100"
                                                        }`}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        // Entire container is clickable
                                                        onClick={() =>
                                                            openLink(link.url)
                                                        }
                                                    >
                                                        <div className="flex align-items-center justify-content-between">
                                                            {/* 
                                                              Left side: Drag handle + icon + link text 
                                                              NOTE: We stopPropagation() on the handle 
                                                            */}
                                                            <div
                                                                className="flex align-items-center"
                                                                {...provided.dragHandleProps}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                {/* Drag handle icon */}
                                                                <i className="pi pi-arrows mr-2 cursor-move" />
                                                                {/* Favicon */}
                                                                {link.favicon_url && (
                                                                    <img
                                                                        src={
                                                                            link.favicon_url
                                                                        }
                                                                        alt="favicon"
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            e.target.onerror =
                                                                                null;
                                                                            e.target.style.display =
                                                                                "none";
                                                                        }}
                                                                        style={{
                                                                            width: "24px",
                                                                            height: "24px",
                                                                            marginRight:
                                                                                "8px",
                                                                        }}
                                                                    />
                                                                )}
                                                                {/* Show link text or description */}
                                                                <span>
                                                                    {link.description ||
                                                                        link.url}
                                                                </span>
                                                            </div>
                                                            {/* Right side: 3-dots menu */}
                                                            <div
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <LinkOptions
                                                                    link={link}
                                                                    categoryId={
                                                                        link.categoryId ||
                                                                        ""
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            )}

            {/* Categories */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable
                    droppableId="categories"
                    type="category"
                    direction="horizontal"
                >
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
                            style={{ minHeight: "300px" }}
                        >
                            {categories.map((category, categoryIndex) => (
                                <Draggable
                                    key={category.id}
                                    draggableId={`category-${category.id}`}
                                    index={categoryIndex}
                                    type="category"
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            style={{ minWidth: "31%" }}
                                        >
                                            <div className="card p-4">
                                                {/* 
                                                  Category header: drag handle + category name + plus button
                                                  We'll move the drag handle to an icon 
                                                */}
                                                <div className="flex justify-content-between align-items-center mb-2">
                                                    <div
                                                        className="flex align-items-center"
                                                        // drag handle
                                                        {...provided.dragHandleProps}
                                                        // don't open anything if user clicks handle
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <i className="pi pi-arrows mr-2 cursor-move" />
                                                        {/* Category name editing */}
                                                        {editingCategoryId ===
                                                        category.id ? (
                                                            <InputText
                                                                value={
                                                                    editingCategoryName
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingCategoryName(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    saveCategoryName(
                                                                        category.id
                                                                    )
                                                                }
                                                                onKeyDown={(
                                                                    e
                                                                ) =>
                                                                    e.key ===
                                                                        "Enter" &&
                                                                    saveCategoryName(
                                                                        category.id
                                                                    )
                                                                }
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <h5
                                                                onDoubleClick={() =>
                                                                    startEditingCategory(
                                                                        category
                                                                    )
                                                                }
                                                            >
                                                                {category.name}
                                                            </h5>
                                                        )}
                                                    </div>
                                                    {/* Add Link button */}
                                                    <Button
                                                        icon="pi pi-plus"
                                                        className="p-button-rounded p-button-text"
                                                        onClick={() =>
                                                            openAddDialog(
                                                                category.id
                                                            )
                                                        }
                                                        tooltip="Add Link"
                                                        tooltipOptions={{
                                                            position: "top",
                                                        }}
                                                    />
                                                </div>

                                                {/* Links within the category */}
                                                <Droppable
                                                    droppableId={category.id.toString()}
                                                    type="bookmark"
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={
                                                                provided.innerRef
                                                            }
                                                            {...provided.droppableProps}
                                                            className={`min-h-20 p-2 rounded ${
                                                                snapshot.isDraggingOver
                                                                    ? "border-2 border-dashed border-blue-500"
                                                                    : "border-2 border-dashed border-transparent"
                                                            }`}
                                                        >
                                                            {category.bookmarks
                                                                .length ===
                                                            0 ? (
                                                                <div>
                                                                    <p>
                                                                        No links
                                                                        yet. Add
                                                                        one!
                                                                    </p>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            label="Delete Category"
                                                                            icon="pi pi-trash"
                                                                            className="p-button-danger p-button-text"
                                                                            onClick={() =>
                                                                                deleteCategory(
                                                                                    category.id
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                            <ul className="list-none p-0 m-0">
                                                                {category.bookmarks
                                                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                                    .map(
                                                                        (
                                                                            link,
                                                                            idx
                                                                        ) => (
                                                                            <Draggable
                                                                                key={
                                                                                    link.id
                                                                                }
                                                                                draggableId={link.id.toString()}
                                                                                index={
                                                                                    idx
                                                                                }
                                                                                type="bookmark"
                                                                            >
                                                                                {(
                                                                                    provided,
                                                                                    snapshot
                                                                                ) => (
                                                                                    <li
                                                                                        ref={
                                                                                            provided.innerRef
                                                                                        }
                                                                                        {...provided.draggableProps}
                                                                                        // Entire <li> is clickable
                                                                                        onClick={() =>
                                                                                            openLink(
                                                                                                link.url
                                                                                            )
                                                                                        }
                                                                                        style={{
                                                                                            ...provided
                                                                                                .draggableProps
                                                                                                .style,
                                                                                            borderRadius:
                                                                                                "8px",
                                                                                            background:
                                                                                                snapshot.isDragging
                                                                                                    ? "#fddbdc" // or any highlight color
                                                                                                    : "#8383830d",
                                                                                            border: "1px solid #80808042",
                                                                                            marginBottom:
                                                                                                "0.5rem",
                                                                                            padding:
                                                                                                "0.5rem",
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            className="flex justify-content-between align-items-center  cursor-pointer"
                                                                                            style={{
                                                                                                alignItems:
                                                                                                    "center",
                                                                                            }}
                                                                                        >
                                                                                            {/* Left side: drag handle + favicon + text */}
                                                                                            <div
                                                                                                className="flex items-center"
                                                                                                {...provided.dragHandleProps}
                                                                                                onClick={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    e.stopPropagation()
                                                                                                }
                                                                                            >
                                                                                                <i className="pi pi-arrows mr-2 cursor-move" />
                                                                                                {link.favicon_url && (
                                                                                                    <img
                                                                                                        src={
                                                                                                            link.favicon_url
                                                                                                        }
                                                                                                        alt="favicon"
                                                                                                        onError={(
                                                                                                            e
                                                                                                        ) => {
                                                                                                            e.target.onerror =
                                                                                                                null;
                                                                                                            e.target.style.display =
                                                                                                                "none";
                                                                                                        }}
                                                                                                        style={{
                                                                                                            width: "24px",
                                                                                                            height: "24px",
                                                                                                            marginRight:
                                                                                                                "8px",
                                                                                                        }}
                                                                                                    />
                                                                                                )}
                                                                                            </div>
                                                                                            <span>
                                                                                                {link.description ||
                                                                                                    link.url}
                                                                                            </span>
                                                                                            {/* Right side: 3-dots menu */}
                                                                                            <div
                                                                                                onClick={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    e.stopPropagation()
                                                                                                }
                                                                                            >
                                                                                                <LinkOptions
                                                                                                    link={
                                                                                                        link
                                                                                                    }
                                                                                                    categoryId={
                                                                                                        category.id
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </li>
                                                                                )}
                                                                            </Draggable>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            )}
                                                            {
                                                                provided.placeholder
                                                            }
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {addingCategory ? (
                    <div className="col-12 mt-4">
                        <div className="p-inputgroup">
                            <InputText
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                placeholder="New Category Name"
                            />
                            <Button
                                label="Save"
                                icon="pi pi-check"
                                onClick={addCategory}
                            />
                            <Button
                                label="Cancel"
                                icon="pi pi-times"
                                className="p-button-secondary"
                                onClick={() => setAddingCategory(false)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="col-12 mt-4">
                        <Button
                            label="Add New Category"
                            icon="pi pi-plus"
                            onClick={() => setAddingCategory(true)}
                        />
                    </div>
                )}
            </DragDropContext>

            {/* Add Link Dialog */}
            <Dialog
                header="Add Link"
                visible={addDialogVisible}
                style={{ width: "400px" }}
                modal
                onHide={() => {
                    setAddDialogVisible(false);
                    setLinkData({ url: "", description: "", faviconUrl: "" });
                    setCurrentCategoryId(null);
                }}
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="url">URL</label>
                        <InputText
                            id="url"
                            value={linkData.url}
                            onChange={(e) =>
                                setLinkData({
                                    ...linkData,
                                    url: e.target.value,
                                })
                            }
                            placeholder="Enter the URL"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={linkData.description}
                            onChange={(e) =>
                                setLinkData({
                                    ...linkData,
                                    description: e.target.value,
                                })
                            }
                            rows={3}
                            placeholder="Enter a description"
                        />
                    </div>
                    <Button label="Add Link" onClick={addLink} />
                </div>
            </Dialog>

            {/* Edit Link Dialog */}
            <Dialog
                header="Edit Link"
                visible={editDialogVisible}
                style={{ width: "400px" }}
                modal
                onHide={() => {
                    setEditDialogVisible(false);
                    setLinkData({ url: "", description: "", faviconUrl: "" });
                    setCurrentLink(null);
                    setCurrentCategoryId(null);
                }}
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="url">URL</label>
                        <InputText
                            id="url"
                            value={linkData.url}
                            onChange={(e) =>
                                setLinkData({
                                    ...linkData,
                                    url: e.target.value,
                                })
                            }
                            placeholder="Enter the URL"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={linkData.description}
                            onChange={(e) =>
                                setLinkData({
                                    ...linkData,
                                    description: e.target.value,
                                })
                            }
                            rows={3}
                            placeholder="Enter a description"
                        />
                    </div>
                    <Button label="Save Changes" onClick={saveLinkChanges} />
                </div>
            </Dialog>
        </Layout>
    );
};

export default Dashboard;
