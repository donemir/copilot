import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import Layout from "@/Layouts/layout/layout.jsx";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const Dashboard = () => {
    // State for categories and bookmarks
    const [categories, setCategories] = useState([
        { id: 1, name: "Category 1", bookmarks: [] },
        { id: 2, name: "Category 2", bookmarks: [] },
        { id: 3, name: "Category 3", bookmarks: [] },
    ]);

    // State for the add bookmark dialog
    const [addDialogVisible, setAddDialogVisible] = useState(false);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
    const [bookmarkData, setBookmarkData] = useState({
        url: "",
        description: "",
    });

    // State for the edit bookmark dialog
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentBookmark, setCurrentBookmark] = useState(null);

    // Function to open the add bookmark dialog
    const openAddDialog = (categoryId) => {
        setCurrentCategoryId(categoryId);
        setBookmarkData({ url: "", description: "" });
        setAddDialogVisible(true);
    };

    // Function to add a new bookmark
    const addBookmark = () => {
        if (!bookmarkData.url) {
            alert("Please enter a URL.");
            return;
        }

        setCategories((prevCategories) =>
            prevCategories.map((category) =>
                category.id === currentCategoryId
                    ? {
                          ...category,
                          bookmarks: [
                              ...category.bookmarks,
                              {
                                  id: Date.now(), // Unique ID
                                  url: bookmarkData.url,
                                  description: bookmarkData.description,
                              },
                          ],
                      }
                    : category
            )
        );

        setAddDialogVisible(false);
        setBookmarkData({ url: "", description: "" });
        setCurrentCategoryId(null);
    };

    // Function to open the edit bookmark dialog
    const openEditDialog = (bookmark, categoryId) => {
        setCurrentCategoryId(categoryId);
        setCurrentBookmark(bookmark);
        setBookmarkData({
            url: bookmark.url,
            description: bookmark.description,
        });
        setEditDialogVisible(true);
    };

    // Function to save changes to an existing bookmark
    const saveBookmarkChanges = () => {
        if (!bookmarkData.url) {
            alert("Please enter a URL.");
            return;
        }

        setCategories((prevCategories) =>
            prevCategories.map((category) => {
                if (category.id === currentCategoryId) {
                    return {
                        ...category,
                        bookmarks: category.bookmarks.map((bookmark) =>
                            bookmark.id === currentBookmark.id
                                ? {
                                      ...bookmark,
                                      url: bookmarkData.url,
                                      description: bookmarkData.description,
                                  }
                                : bookmark
                        ),
                    };
                }
                return category;
            })
        );

        setEditDialogVisible(false);
        setBookmarkData({ url: "", description: "" });
        setCurrentBookmark(null);
        setCurrentCategoryId(null);
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
                setCategories((prevCategories) =>
                    prevCategories.map((category) => {
                        if (category.id === categoryId) {
                            return {
                                ...category,
                                bookmarks: category.bookmarks.filter(
                                    (bookmark) => bookmark.id !== bookmarkId
                                ),
                            };
                        }
                        return category;
                    })
                );
            },
        });
    };

    // Handler for drag end
    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // If the item is dropped in the same place, do nothing
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Get source and destination categories
        const sourceCategory = categories.find(
            (category) => category.id.toString() === source.droppableId
        );
        const destCategory = categories.find(
            (category) => category.id.toString() === destination.droppableId
        );

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
    };

    return (
        <Layout>
            <div className="grid">
                {/* Confirm Dialog (for deletion confirmation) */}
                <ConfirmDialog />

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
                                <Droppable droppableId={category.id.toString()}>
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
                                                                    <div>
                                                                        <a
                                                                            href={
                                                                                bookmark.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary hover:underline"
                                                                        >
                                                                            {
                                                                                bookmark.url
                                                                            }
                                                                        </a>
                                                                        <p className="mt-1 mb-0">
                                                                            {
                                                                                bookmark.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex">
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
                        setBookmarkData({ url: "", description: "" });
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
                        setBookmarkData({ url: "", description: "" });
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
