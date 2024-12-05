import React, { useRef, useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import { usePage, router } from "@inertiajs/react";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import Layout from "@/Layouts/layout/layout.jsx";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

const Dashboard = () => {
    const toast = useRef(null);

    const { categories: initialCategories } = usePage().props;
    const [categories, setCategories] = useState(initialCategories || []);

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");

    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [pinnedBookmarks, setPinnedBookmarks] = useState(
        initialCategories
            ? initialCategories.flatMap((category) =>
                  category.bookmarks.filter((bookmark) => bookmark.pinned)
              )
            : []
    );

    const startEditingCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    const getFaviconUrl = (url) => {
        try {
            const hasProtocol =
                url.startsWith("http://") || url.startsWith("https://");
            const fullUrl = hasProtocol ? url : `http://${url}`;

            const domain = new URL(fullUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch (error) {
            console.error("Invalid URL");
            return "";
        }
    };

    const [addDialogVisible, setAddDialogVisible] = useState(false);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
    const [bookmarkData, setBookmarkData] = useState({
        url: "",
        description: "",
        faviconUrl: "",
    });

    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentBookmark, setCurrentBookmark] = useState(null);

    const saveCategoryName = (categoryId) => {
        router.put(
            `/categories/${categoryId}`,
            { name: editingCategoryName },
            {
                onSuccess: () => {
                    // Update the categories array with the new name
                    setCategories((prev) =>
                        prev.map((cat) =>
                            cat.id === categoryId
                                ? { ...cat, name: editingCategoryName }
                                : cat
                        )
                    );
                    setEditingCategoryId(null);
                    setEditingCategoryName("");
                    if (toast.current) {
                        toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Category updated successfully.",
                            life: 3000,
                        });
                    }
                },
                onError: (errors) => {
                    console.error(errors);
                    if (toast.current) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to update category name.",
                            life: 3000,
                        });
                    }
                },
            }
        );
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) {
            if (toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Category name cannot be empty.",
                    life: 3000,
                });
            }
            return;
        }

        router.post(
            "/categories",
            { name: newCategoryName },
            {
                onSuccess: () => {
                    // Reload categories or update state if you prefer to do so via response
                    router.reload({ only: ["categories"] });
                    setNewCategoryName("");
                    setAddingCategory(false);
                },
                onError: (errors) => {
                    console.error(errors);
                    if (toast.current) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to create category.",
                            life: 3000,
                        });
                    }
                },
            }
        );
    };

    const openAddDialog = (categoryId) => {
        setCurrentCategoryId(categoryId);
        setBookmarkData({ url: "", description: "", faviconUrl: "" });
        setAddDialogVisible(true);
    };

    useEffect(() => {
        setCategories(initialCategories || []);
    }, [initialCategories]);

    useEffect(() => {
        setPinnedBookmarks(
            categories.flatMap((category) =>
                category.bookmarks.filter((bookmark) => bookmark.pinned)
            )
        );
    }, [categories]);

    const addBookmark = () => {
        if (
            !bookmarkData.url.startsWith("http://") &&
            !bookmarkData.url.startsWith("https://")
        ) {
            bookmarkData.url = "https://" + bookmarkData.url;
        }

        try {
            const urlObject = new URL(bookmarkData.url);
            if (!urlObject.hostname.includes(".")) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Please enter a valid URL.",
                    life: 3000,
                });
                return;
            }
        } catch (error) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Please enter a valid URL.",
                life: 3000,
            });
            return;
        }

        const faviconUrl = getFaviconUrl(bookmarkData.url);

        router.post(
            "/bookmarks",
            {
                category_id: currentCategoryId,
                url: bookmarkData.url,
                description: bookmarkData.description,
                favicon_url: faviconUrl,
            },
            {
                onSuccess: () => {
                    router.reload({ only: ["categories"] });
                    setAddDialogVisible(false);
                    setBookmarkData({
                        url: "",
                        description: "",
                        faviconUrl: "",
                    });
                    setCurrentCategoryId(null);
                },
                onError: (errors) => {
                    console.error("Error updating bookmark:", errors);
                    if (toast.current) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to update bookmark.",
                            life: 3000,
                        });
                    }
                },
            }
        );
    };

    const openEditDialog = (bookmark, categoryId) => {
        setCurrentCategoryId(categoryId);
        setCurrentBookmark(bookmark);
        setBookmarkData({
            url: bookmark.url,
            description: bookmark.description,
            faviconUrl: bookmark.faviconUrl,
        });
        setEditDialogVisible(true);
    };

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
                        setCategories((prevCategories) =>
                            prevCategories.filter(
                                (cat) => cat.id !== categoryId
                            )
                        );
                        if (toast.current) {
                            toast.current.show({
                                severity: "success",
                                summary: "Success",
                                detail: "Category deleted successfully.",
                                life: 3000,
                            });
                        }
                    },
                    onError: (errors) => {
                        console.error(errors);
                        if (toast.current) {
                            toast.current.show({
                                severity: "error",
                                summary: "Error",
                                detail: "Failed to delete category.",
                                life: 3000,
                            });
                        }
                    },
                });
            },
        });
    };

    const saveBookmarkChanges = () => {
        if (
            !bookmarkData.url.startsWith("http://") &&
            !bookmarkData.url.startsWith("https://")
        ) {
            bookmarkData.url = "https://" + bookmarkData.url;
        }

        try {
            const urlObject = new URL(bookmarkData.url);
            if (!urlObject.hostname.includes(".")) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Please enter a valid URL.",
                    life: 3000,
                });
                return;
            }
        } catch (error) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Please enter a valid URL.",
                life: 3000,
            });
            return;
        }

        const faviconUrl = getFaviconUrl(bookmarkData.url);

        router.put(
            `/bookmarks/${currentBookmark.id}`,
            {
                url: bookmarkData.url,
                description: bookmarkData.description,
                favicon_url: faviconUrl,
                pinned: currentBookmark.pinned,
            },
            {
                onSuccess: () => {
                    setEditDialogVisible(false);
                    setBookmarkData({
                        url: "",
                        description: "",
                        faviconUrl: "",
                    });
                    setCurrentBookmark(null);
                    setCurrentCategoryId(null);

                    if (toast.current) {
                        toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Bookmark updated successfully.",
                            life: 3000,
                        });
                    }
                },
                onError: (errors) => {
                    console.error("Error updating bookmark:", errors);
                    if (toast.current) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to update bookmark.",
                            life: 3000,
                        });
                    }
                },
            }
        );
    };

    const deleteBookmark = (bookmarkId, categoryId) => {
        confirmDialog({
            message: "Are you sure you want to delete this bookmark?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Yes",
            rejectLabel: "No",
            accept: () => {
                router.delete(`/bookmarks/${bookmarkId}`, {
                    onSuccess: () => {
                        setCategories((prevCategories) =>
                            prevCategories.map((category) => {
                                if (category.id === categoryId) {
                                    return {
                                        ...category,
                                        bookmarks: category.bookmarks.filter(
                                            (bookmark) =>
                                                bookmark.id !== bookmarkId
                                        ),
                                    };
                                } else {
                                    return category;
                                }
                            })
                        );
                        setPinnedBookmarks((prevPinned) =>
                            prevPinned.filter(
                                (bookmark) => bookmark.id !== bookmarkId
                            )
                        );
                    },
                    onError: (errors) => {
                        console.error(errors);
                    },
                });
            },
        });
    };

    const togglePinBookmark = (bookmark, categoryId) => {
        const newPinnedStatus = !bookmark.pinned;

        router.put(
            `/bookmarks/${bookmark.id}`,
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
                                        b.id === bookmark.id
                                            ? { ...b, pinned: newPinnedStatus }
                                            : b
                                    ),
                                };
                            } else {
                                return category;
                            }
                        })
                    );

                    if (newPinnedStatus) {
                        setPinnedBookmarks((prevPinned) => [
                            ...prevPinned,
                            { ...bookmark, pinned: true },
                        ]);
                    } else {
                        setPinnedBookmarks((prevPinned) =>
                            prevPinned.filter((b) => b.id !== bookmark.id)
                        );
                    }
                },
                onError: (errors) => {
                    console.error(errors);
                },
            }
        );
    };

    // Helper function to reorder an array
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === "category") {
            // Reorder categories in local state
            const newCategories = reorder(
                categories,
                source.index,
                destination.index
            );
            setCategories(newCategories);

            // Prepare data for the backend
            const reorderData = newCategories.map((cat, idx) => ({
                id: cat.id,
                order: idx, // or idx + 1, depending on how you count
            }));

            // Send updated order to the backend
            router.put(
                "/categories/reorder",
                { categories: reorderData },
                {
                    onSuccess: () => {
                        console.log("Categories reordered successfully");
                        // Optionally show a toast if needed:
                        // toast.current.show({ severity: 'success', summary: 'Success', detail: 'Categories order updated.', life: 3000 });
                    },
                    onError: (errors) => {
                        console.error("Error reordering categories:", errors);
                        // Optionally show a toast:
                        // toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to reorder categories.', life: 3000 });
                    },
                }
            );

            return;
        }

        if (type === "bookmark") {
            // Handle bookmarks (either pinned or within categories)
            if (
                source.droppableId === "pinned" &&
                destination.droppableId === "pinned"
            ) {
                // Reordering pinned bookmarks
                const newPinned = reorder(
                    pinnedBookmarks,
                    source.index,
                    destination.index
                );
                setPinnedBookmarks(newPinned);
                return;
            }

            // It's a bookmark in a category
            const sourceCategory = categories.find(
                (category) => category.id.toString() === source.droppableId
            );
            const destCategory = categories.find(
                (category) => category.id.toString() === destination.droppableId
            );

            if (!sourceCategory || !destCategory) return;

            const movingItem = sourceCategory.bookmarks[source.index];

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
                {
                    category_id: destCategory.id,
                },
                {
                    onSuccess: () => {
                        console.log("Bookmark category updated successfully");
                    },
                    onError: (errors) => {
                        console.error(
                            "Error updating bookmark category:",
                            errors
                        );
                    },
                }
            );
        }
    };

    return (
        <Layout>
            <Toast ref={toast} />
            <div className="grid">
                <ConfirmDialog />

                {pinnedBookmarks.length > 0 && (
                    <div className="col-12">
                        <div className="card">
                            <h5>Pinned Bookmarks</h5>
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
                                            {pinnedBookmarks.map(
                                                (bookmark, index) => (
                                                    <Draggable
                                                        key={bookmark.id}
                                                        draggableId={bookmark.id.toString()}
                                                        index={index}
                                                        type="bookmark"
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot
                                                        ) => (
                                                            <div
                                                                className={`p-2 m-1 border-round flex-none w-48 ${
                                                                    snapshot.isDragging
                                                                        ? "surface-200"
                                                                        : "surface-100"
                                                                }`}
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <div className="flex align-items-center">
                                                                    {bookmark.favicon_url && (
                                                                        <img
                                                                            src={
                                                                                bookmark.favicon_url
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
                                                                                width: "16px",
                                                                                height: "16px",
                                                                                marginRight:
                                                                                    "8px",
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <a
                                                                        href={
                                                                            bookmark.url.startsWith(
                                                                                "http://"
                                                                            ) ||
                                                                            bookmark.url.startsWith(
                                                                                "https://"
                                                                            )
                                                                                ? bookmark.url
                                                                                : `http://${bookmark.url}`
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {bookmark.description ||
                                                                            bookmark.url}
                                                                    </a>
                                                                    <Button
                                                                        icon="pi pi-times"
                                                                        className="p-button-text p-button-sm p-button-rounded p-button-danger ml-2"
                                                                        onClick={() =>
                                                                            togglePinBookmark(
                                                                                bookmark,
                                                                                categories.find(
                                                                                    (
                                                                                        cat
                                                                                    ) =>
                                                                                        cat.bookmarks.some(
                                                                                            (
                                                                                                b
                                                                                            ) =>
                                                                                                b.id ===
                                                                                                bookmark.id
                                                                                        )
                                                                                )
                                                                                    ?.id
                                                                            )
                                                                        }
                                                                        tooltip="Unpin Bookmark"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    </div>
                )}

                {/* 
                  NEW: Wrap categories in a Droppable with type="category"
                  This will allow us to reorder categories themselves.
                */}
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
                                className="grid"
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
                                                className="bookmarks-list col-12 md:col-6 lg:col-4"
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <div className="card">
                                                    {/* Use dragHandleProps on a drag handle - for example, the header */}
                                                    <div
                                                        className="flex justify-content-between align-items-center"
                                                        {...provided.dragHandleProps}
                                                    >
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
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    )
                                                                        saveCategoryName(
                                                                            category.id
                                                                        );
                                                                }}
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
                                                        <Button
                                                            icon="pi pi-plus"
                                                            className="p-button-rounded p-button-text"
                                                            onClick={() =>
                                                                openAddDialog(
                                                                    category.id
                                                                )
                                                            }
                                                            tooltip="Add Bookmark"
                                                            tooltipOptions={{
                                                                position: "top",
                                                            }}
                                                        />
                                                    </div>

                                                    {/* The droppable for bookmarks within this category */}
                                                    <Droppable
                                                        droppableId={category.id.toString()}
                                                        type="bookmark"
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot
                                                        ) => (
                                                            <div
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.droppableProps}
                                                                className={`min-h-20 ${
                                                                    snapshot.isDraggingOver
                                                                        ? "border-primary border-dashed"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {category
                                                                    .bookmarks
                                                                    .length ===
                                                                0 ? (
                                                                    <div>
                                                                        <p>
                                                                            No
                                                                            bookmarks
                                                                            yet.
                                                                            Add
                                                                            one!
                                                                        </p>
                                                                        <div
                                                                            style={{
                                                                                marginTop:
                                                                                    "1rem",
                                                                            }}
                                                                        >
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
                                                                        {category.bookmarks.map(
                                                                            (
                                                                                bookmark,
                                                                                index
                                                                            ) => (
                                                                                <Draggable
                                                                                    key={
                                                                                        bookmark.id
                                                                                    }
                                                                                    draggableId={bookmark.id.toString()}
                                                                                    index={
                                                                                        index
                                                                                    }
                                                                                    type="bookmark"
                                                                                >
                                                                                    {(
                                                                                        provided,
                                                                                        snapshot
                                                                                    ) => (
                                                                                        <li
                                                                                            className={`list-none mb-2 p-2 border-round ${
                                                                                                snapshot.isDragging
                                                                                                    ? "surface-200"
                                                                                                    : "surface-100"
                                                                                            }`}
                                                                                            ref={
                                                                                                provided.innerRef
                                                                                            }
                                                                                            {...provided.draggableProps}
                                                                                            {...provided.dragHandleProps}
                                                                                        >
                                                                                            <div className="flex justify-content-between align-items-start">
                                                                                                <div className="flex">
                                                                                                    {bookmark.favicon_url && (
                                                                                                        <img
                                                                                                            src={
                                                                                                                bookmark.favicon_url
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
                                                                                                                width: "16px",
                                                                                                                height: "16px",
                                                                                                                marginRight:
                                                                                                                    "8px",
                                                                                                            }}
                                                                                                        />
                                                                                                    )}
                                                                                                    <div>
                                                                                                        <a
                                                                                                            href={
                                                                                                                bookmark.url.startsWith(
                                                                                                                    "http://"
                                                                                                                ) ||
                                                                                                                bookmark.url.startsWith(
                                                                                                                    "https://"
                                                                                                                )
                                                                                                                    ? bookmark.url
                                                                                                                    : `http://${bookmark.url}`
                                                                                                            }
                                                                                                            target="_blank"
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="text-primary hover:underline"
                                                                                                        >
                                                                                                            {bookmark.description ||
                                                                                                                bookmark.url}
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex">
                                                                                                    <Button
                                                                                                        icon={
                                                                                                            bookmark.pinned
                                                                                                                ? "pi pi-bookmark-fill"
                                                                                                                : "pi pi-bookmark"
                                                                                                        }
                                                                                                        className={`p-button-text p-button-sm p-button-rounded ${
                                                                                                            bookmark.pinned
                                                                                                                ? "text-warning"
                                                                                                                : ""
                                                                                                        }`}
                                                                                                        onClick={() =>
                                                                                                            togglePinBookmark(
                                                                                                                bookmark,
                                                                                                                category.id
                                                                                                            )
                                                                                                        }
                                                                                                        tooltip={
                                                                                                            bookmark.pinned
                                                                                                                ? "Unpin Bookmark"
                                                                                                                : "Pin Bookmark"
                                                                                                        }
                                                                                                        tooltipOptions={{
                                                                                                            position:
                                                                                                                "top",
                                                                                                        }}
                                                                                                    />
                                                                                                    <Button
                                                                                                        icon="pi pi-pencil"
                                                                                                        className="p-button-text p-button-sm p-button-rounded"
                                                                                                        onClick={() =>
                                                                                                            openEditDialog(
                                                                                                                bookmark,
                                                                                                                category.id
                                                                                                            )
                                                                                                        }
                                                                                                        tooltip="Edit Bookmark"
                                                                                                        tooltipOptions={{
                                                                                                            position:
                                                                                                                "top",
                                                                                                        }}
                                                                                                    />
                                                                                                    <Button
                                                                                                        icon="pi pi-trash"
                                                                                                        className="p-button-text p-button-sm p-button-rounded p-button-danger"
                                                                                                        onClick={() =>
                                                                                                            deleteBookmark(
                                                                                                                bookmark.id,
                                                                                                                category.id
                                                                                                            )
                                                                                                        }
                                                                                                        tooltip="Delete Bookmark"
                                                                                                        tooltipOptions={{
                                                                                                            position:
                                                                                                                "top",
                                                                                                        }}
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
                        <div className="col-12" style={{ marginTop: "1rem" }}>
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
                        <div className="col-12" style={{ marginTop: "1rem" }}>
                            <Button
                                label="Add New Category"
                                icon="pi pi-plus"
                                onClick={() => setAddingCategory(true)}
                            />
                        </div>
                    )}
                </DragDropContext>

                {/* Add Bookmark Dialog */}
                <Dialog
                    header="Add Bookmark"
                    visible={addDialogVisible}
                    style={{ width: "400px" }}
                    modal
                    onHide={() => {
                        setAddDialogVisible(false);
                        setBookmarkData({
                            url: "",
                            description: "",
                            faviconUrl: "",
                        });
                        setCurrentCategoryId(null);
                    }}
                >
                    <div className="p-fluid">
                        <div className="field">
                            <label htmlFor="url">URL</label>
                            <InputText
                                id="url"
                                value={bookmarkData.url}
                                onChange={(e) =>
                                    setBookmarkData({
                                        ...bookmarkData,
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
                                value={bookmarkData.description}
                                onChange={(e) =>
                                    setBookmarkData({
                                        ...bookmarkData,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="Enter a description"
                            />
                        </div>
                        <Button label="Add Bookmark" onClick={addBookmark} />
                    </div>
                </Dialog>

                {/* Edit Bookmark Dialog */}
                <Dialog
                    header="Edit Bookmark"
                    visible={editDialogVisible}
                    style={{ width: "400px" }}
                    modal
                    onHide={() => {
                        setEditDialogVisible(false);
                        setBookmarkData({
                            url: "",
                            description: "",
                            faviconUrl: "",
                        });
                        setCurrentBookmark(null);
                        setCurrentCategoryId(null);
                    }}
                >
                    <div className="p-fluid">
                        <div className="field">
                            <label htmlFor="url">URL</label>
                            <InputText
                                id="url"
                                value={bookmarkData.url}
                                onChange={(e) =>
                                    setBookmarkData({
                                        ...bookmarkData,
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
                                value={bookmarkData.description}
                                onChange={(e) =>
                                    setBookmarkData({
                                        ...bookmarkData,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="Enter a description"
                            />
                        </div>
                        <Button
                            label="Save Changes"
                            onClick={saveBookmarkChanges}
                        />
                    </div>
                </Dialog>
            </div>
        </Layout>
    );
};

export default Dashboard;
