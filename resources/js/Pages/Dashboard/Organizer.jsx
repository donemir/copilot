import React, { useState, useEffect } from "react";

import { Inertia } from "@inertiajs/inertia";
import { usePage, router } from "@inertiajs/react";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import Layout from "@/Layouts/layout/layout.jsx";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const Dashboard = () => {
    const { categories: initialCategories } = usePage().props;
    const [categories, setCategories] = useState(initialCategories || []);

    const [pinnedBookmarks, setPinnedBookmarks] = useState(
        initialCategories
            ? initialCategories.flatMap((category) =>
                  category.bookmarks.filter((bookmark) => bookmark.pinned)
              )
            : []
    );

    // Helper function to get favicon URL
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

    // Pre-defined categories and bookmarks

    // State for the add bookmark dialog
    const [addDialogVisible, setAddDialogVisible] = useState(false);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
    const [bookmarkData, setBookmarkData] = useState({
        url: "",
        description: "",
        faviconUrl: "",
    });

    // State for the edit bookmark dialog
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentBookmark, setCurrentBookmark] = useState(null);

    // Function to open the add bookmark dialog
    const openAddDialog = (categoryId) => {
        setCurrentCategoryId(categoryId);
        setBookmarkData({ url: "", description: "", faviconUrl: "" });
        setAddDialogVisible(true);
    };

    // Add this useEffect to synchronize categories
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

    // Function to add a new bookmark
    const addBookmark = () => {
        if (!bookmarkData.url) {
            alert("Please enter a URL.");
            return;
        }

        const faviconUrl = getFaviconUrl(bookmarkData.url);

        // Use router.post instead of Inertia.post
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
                    // Optionally, reload categories from the server
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
                    console.error(errors);
                },
            }
        );
    };

    // Function to open the edit bookmark dialog
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

    // Function to save changes to an existing bookmark
    const saveBookmarkChanges = () => {
        if (!bookmarkData.url) {
            alert("Please enter a URL.");
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
                    console.log("Bookmark updated successfully");

                    // Close the modal
                    setEditDialogVisible(false);

                    // Reset bookmark data
                    setBookmarkData({
                        url: "",
                        description: "",
                        faviconUrl: "",
                    });
                    setCurrentBookmark(null);
                    setCurrentCategoryId(null);

                    // Optionally, trigger a success toast
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

                    // Optionally, trigger an error toast
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

    // Function to delete a bookmark
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
                        // Remove the bookmark from local state
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
                        // Also remove from pinned bookmarks if necessary
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

    // Function to toggle pinning a bookmark
    const togglePinBookmark = (bookmark, categoryId) => {
        const newPinnedStatus = !bookmark.pinned;

        router.put(
            `/bookmarks/${bookmark.id}`,
            {
                pinned: newPinnedStatus,
            },
            {
                onSuccess: () => {
                    // Update the bookmark's pinned status in local state
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

                    // Update pinnedBookmarks array
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

    // Handler for drag end
    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Handle drag and drop within pinned bookmarks (if applicable)
        if (
            source.droppableId === "pinned" &&
            destination.droppableId === "pinned"
        ) {
            // ... existing code for pinned bookmarks
            return;
        }

        // Handle drag and drop within categories
        const sourceCategory = categories.find(
            (category) => category.id.toString() === source.droppableId
        );
        const destCategory = categories.find(
            (category) => category.id.toString() === destination.droppableId
        );

        if (!sourceCategory || !destCategory) return;

        // Get the item being moved
        const movingItem = sourceCategory.bookmarks[source.index];

        // Remove the item from the source category
        const newSourceBookmarks = Array.from(sourceCategory.bookmarks);
        newSourceBookmarks.splice(source.index, 1);

        // Add the item to the destination category
        const newDestBookmarks = Array.from(destCategory.bookmarks);
        newDestBookmarks.splice(destination.index, 0, movingItem);

        // Update the categories
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

        // Update the bookmark's category_id in the backend
        router.put(
            `/bookmarks/${movingItem.id}`,
            {
                category_id: destCategory.id,
            },
            {
                onSuccess: () => {
                    console.log("Bookmark category updated successfully");
                    // Since we've updated the local state optimistically, no further action is needed
                },
                onError: (errors) => {
                    console.error("Error updating bookmark category:", errors);
                    // Optionally, revert state changes if needed
                },
            }
        );
    };

    return (
        <Layout>
            <div className="grid">
                {/* Confirm Dialog (for deletion confirmation) */}
                <ConfirmDialog />

                {/* Pinned Bookmarks Section */}
                {pinnedBookmarks.length > 0 && (
                    <div className="col-12">
                        <div className="card">
                            <h5>Pinned Bookmarks</h5>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable
                                    droppableId="pinned"
                                    direction="horizontal"
                                >
                                    {(provided) => (
                                        <div
                                            className="flex flex-wrap" // Added 'flex-wrap' here
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {pinnedBookmarks.map(
                                                (bookmark, index) => (
                                                    <Draggable
                                                        key={bookmark.id}
                                                        draggableId={bookmark.id.toString()}
                                                        index={index}
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
                                                                                // Find the category ID
                                                                                categories.find(
                                                                                    (
                                                                                        category
                                                                                    ) =>
                                                                                        category.bookmarks.some(
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

                {/* Display Categories and Bookmarks with Drag and Drop */}
                <DragDropContext onDragEnd={onDragEnd}>
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="col-12 md:col-6 lg:col-4"
                        >
                            <div className="card">
                                <div className="flex justify-content-between align-items-center">
                                    <h5>{category.name}</h5>
                                    <Button
                                        icon="pi pi-plus"
                                        className="p-button-rounded p-button-text"
                                        onClick={() =>
                                            openAddDialog(category.id)
                                        }
                                        tooltip="Add Bookmark"
                                        tooltipOptions={{ position: "top" }}
                                    />
                                </div>
                                {category.bookmarks.length === 0 ? (
                                    <p>No bookmarks yet. Add one!</p>
                                ) : (
                                    // Existing code to display bookmarks

                                    <Droppable
                                        droppableId={category.id.toString()}
                                    >
                                        {(provided) => (
                                            <ul
                                                className="list-none p-0 m-0"
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {category.bookmarks.map(
                                                    (bookmark, index) => (
                                                        <Draggable
                                                            key={bookmark.id}
                                                            draggableId={bookmark.id.toString()}
                                                            index={index}
                                                        >
                                                            {(
                                                                provided,
                                                                snapshot
                                                            ) => (
                                                                <li
                                                                    className={`mb-2 p-2 border-round ${
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
                                                {provided.placeholder}
                                            </ul>
                                        )}
                                    </Droppable>
                                )}
                            </div>
                        </div>
                    ))}
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
