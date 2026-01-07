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

    const { sections: initialSections, categoriesWithoutSection: initialCategoriesWithoutSection } = usePage().props;
    
    const [sections, setSections] = useState(initialSections || []);
    const [categoriesWithoutSection, setCategoriesWithoutSection] = useState(initialCategoriesWithoutSection || []);
    
    const [pinnedLinks, setPinnedLinks] = useState([]);

    // Section editing
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingSectionName, setEditingSectionName] = useState("");
    const [addingSection, setAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");

    // Category editing
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Dialog states
    const [addDialogVisible, setAddDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
    const [currentLink, setCurrentLink] = useState(null);

    // Link form data
    const [linkData, setLinkData] = useState({
        url: "",
        description: "",
        faviconUrl: "",
    });

    // Update state when props change
    useEffect(() => {
        setSections(initialSections || []);
        setCategoriesWithoutSection(initialCategoriesWithoutSection || []);
    }, [initialSections, initialCategoriesWithoutSection]);

    useEffect(() => {
        const allCategories = [
            ...categoriesWithoutSection,
            ...sections.flatMap(s => s.categories || [])
        ];
        setPinnedLinks(
            allCategories.flatMap((category) =>
                category.bookmarks.filter((link) => link.pinned)
            )
        );
    }, [sections, categoriesWithoutSection]);

    // Utility to get favicon URL
    const getFaviconUrl = (url) => {
        try {
            const hasProtocol = url.startsWith("http://") || url.startsWith("https://");
            const fullUrl = hasProtocol ? url : `http://${url}`;
            const domain = new URL(fullUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch (error) {
            console.error("Invalid URL", error);
            return "";
        }
    };

    const openLink = (url) => {
        window.open(url, "_blank");
    };

    // Section Management
    const addSection = () => {
        if (!newSectionName.trim()) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Section name cannot be empty.",
                life: 3000,
            });
            return;
        }

        router.post("/sections", { name: newSectionName }, {
            onSuccess: () => {
                router.reload({ only: ["sections"] });
                setNewSectionName("");
                setAddingSection(false);
            },
            onError: (errors) => {
                console.error(errors);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to create section.",
                    life: 3000,
                });
            },
        });
    };

    const startEditingSection = (section) => {
        setEditingSectionId(section.id);
        setEditingSectionName(section.name);
    };

    const saveSectionName = (sectionId) => {
        router.put(`/sections/${sectionId}`, { name: editingSectionName }, {
            onSuccess: () => {
                setSections((prev) =>
                    prev.map((sec) =>
                        sec.id === sectionId ? { ...sec, name: editingSectionName } : sec
                    )
                );
                setEditingSectionId(null);
                setEditingSectionName("");
                toast.current?.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Section updated successfully.",
                    life: 3000,
                });
            },
            onError: (errors) => {
                console.error(errors);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to update section name.",
                    life: 3000,
                });
            },
        });
    };

    const deleteSection = (sectionId) => {
        confirmDialog({
            message: "Categories in this section will be moved out. Continue?",
            header: "Delete Section",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                router.delete(`/sections/${sectionId}`, {
                    onSuccess: () => {
                        router.reload({ only: ["sections", "categoriesWithoutSection"] });
                        toast.current?.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Section deleted successfully.",
                            life: 3000,
                        });
                    },
                    onError: (errors) => {
                        console.error(errors);
                        toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to delete section.",
                            life: 3000,
                        });
                    },
                });
            },
        });
    };

    // Category Management
    const startEditingCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    const saveCategoryName = (categoryId) => {
        router.put(`/categories/${categoryId}`, { name: editingCategoryName }, {
            onSuccess: () => {
                toast.current?.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Category updated successfully.",
                    life: 3000,
                });
                setEditingCategoryId(null);
                setEditingCategoryName("");
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
        });
    };

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

        router.post("/categories", { name: newCategoryName }, {
            onSuccess: () => {
                router.reload({ only: ["categoriesWithoutSection"] });
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
        });
    };

    const deleteCategory = (categoryId) => {
        confirmDialog({
            message: "Are you sure you want to delete this category?",
            header: "Delete Category",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                router.delete(`/categories/${categoryId}`, {
                    onSuccess: () => {
                        router.reload({ only: ["sections", "categoriesWithoutSection"] });
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

    // Link Management
    const openAddDialog = (categoryId) => {
        setCurrentCategoryId(categoryId);
        setLinkData({ url: "", description: "", faviconUrl: "" });
        setAddDialogVisible(true);
    };

    const openEditDialog = (link, categoryId) => {
        setCurrentCategoryId(categoryId);
        setCurrentLink(link);
        setLinkData({
            url: link.url,
            description: link.description,
            faviconUrl: link.favicon_url,
        });
        setEditDialogVisible(true);
    };

    const addLink = () => {
        if (!linkData.url.startsWith("http://") && !linkData.url.startsWith("https://")) {
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

        router.post("/bookmarks", {
            category_id: currentCategoryId,
            url: linkData.url,
            description: linkData.description,
            favicon_url: faviconUrl,
        }, {
            onSuccess: () => {
                router.reload({ only: ["sections", "categoriesWithoutSection"] });
                setAddDialogVisible(false);
                setLinkData({ url: "", description: "", faviconUrl: "" });
                setCurrentCategoryId(null);
            },
            onError: (errors) => {
                console.error("Error adding link:", errors);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to add link.",
                    life: 3000,
                });
            },
        });
    };

    const saveLinkChanges = () => {
        if (!linkData.url.startsWith("http://") && !linkData.url.startsWith("https://")) {
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

        router.put(`/bookmarks/${currentLink.id}`, {
            url: linkData.url,
            description: linkData.description,
            favicon_url: faviconUrl,
        }, {
            onSuccess: () => {
                router.reload({ only: ["sections", "categoriesWithoutSection"] });
                setEditDialogVisible(false);
                setLinkData({ url: "", description: "", faviconUrl: "" });
                setCurrentLink(null);
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
        });
    };

    const deleteLink = (linkId) => {
        confirmDialog({
            message: "Are you sure you want to delete this link?",
            header: "Delete Link",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                router.delete(`/bookmarks/${linkId}`, {
                    onSuccess: () => {
                        router.reload({ only: ["sections", "categoriesWithoutSection"] });
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

    const togglePin = (link, categoryId) => {
        const newPinnedStatus = !link.pinned;
        router.put(`/bookmarks/${link.id}`, { pinned: newPinnedStatus }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ["sections", "categoriesWithoutSection"] });
            },
            onError: (errors) => {
                console.error(errors);
            },
        });
    };

    // Drag and Drop
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination, type } = result;

        if (type === "section") {
            const newSections = reorder(sections, source.index, destination.index);
            setSections(newSections);

            const reorderData = newSections.map((sec, idx) => ({
                id: sec.id,
                order: idx,
            }));
            
            router.put("/sections/reorder", { sections: reorderData }, {
                onSuccess: () => {
                    console.log("Sections reordered successfully");
                },
                onError: (errors) => {
                    console.error("Error reordering sections:", errors);
                },
            });
            return;
        }

        if (type === "category") {
            // Parse draggableId to get section and category info
            const parseDraggableId = (id) => {
                if (id.startsWith("section-")) {
                    const match = id.match(/^section-(\d+)-category-(\d+)$/);
                    return match ? { sectionId: parseInt(match[1]), categoryId: parseInt(match[2]), hasSection: true } : null;
                } else if (id.startsWith("nosection-")) {
                    const match = id.match(/^nosection-category-(\d+)$/);
                    return match ? { categoryId: parseInt(match[1]), hasSection: false } : null;
                }
                return null;
            };

            const sourceInfo = parseDraggableId(result.draggableId);
            if (!sourceInfo) return;

            const sourceIsSection = source.droppableId.startsWith("section-");
            const destIsSection = destination.droppableId.startsWith("section-");

            if (sourceIsSection && destIsSection) {
                const sourceSectionId = parseInt(source.droppableId.replace("section-", ""));
                const destSectionId = parseInt(destination.droppableId.replace("section-", ""));

                if (sourceSectionId === destSectionId) {
                    // Reorder within same section
                    const section = sections.find(s => s.id === sourceSectionId);
                    const newCategories = reorder(section.categories, source.index, destination.index);
                    
                    setSections(prevSections =>
                        prevSections.map(s =>
                            s.id === sourceSectionId ? { ...s, categories: newCategories } : s
                        )
                    );

                    const reorderData = newCategories.map((cat, idx) => ({
                        id: cat.id,
                        order: idx,
                    }));
                    
                    router.put("/categories/reorder", { categories: reorderData });
                    } else {
                        // Move category to different section
                        router.put(`/categories/${sourceInfo.categoryId}/move-to-section`, { section_id: destSectionId }, {
                            onSuccess: () => {
                                router.reload({ only: ["sections", "categoriesWithoutSection"] });
                            },
                            onError: (errors) => {
                                console.error("Error moving category:", errors);
                            }
                        });
                    }
            } else if (source.droppableId === "categories-without-section" && destIsSection) {
                // Move from no section to a section
                const destSectionId = parseInt(destination.droppableId.replace("section-", ""));

                    router.put(`/categories/${sourceInfo.categoryId}/move-to-section`, { section_id: destSectionId }, {
                        onSuccess: () => {
                            router.reload({ only: ["sections", "categoriesWithoutSection"] });
                        },
                        onError: (errors) => {
                            console.error("Error moving category:", errors);
                        }
                    });
            } else if (sourceIsSection && destination.droppableId === "categories-without-section") {
                // Move from section to no section
                router.put(`/categories/${sourceInfo.categoryId}/move-to-section`, { section_id: null }, {
                    onSuccess: () => {
                        router.reload({ only: ["sections", "categoriesWithoutSection"] });
                    },
                });
            } else if (source.droppableId === "categories-without-section" && destination.droppableId === "categories-without-section") {
                // Reorder within categories-without-section
                const newCategories = reorder(categoriesWithoutSection, source.index, destination.index);
                setCategoriesWithoutSection(newCategories);

                const reorderData = newCategories.map((cat, idx) => ({
                    id: cat.id,
                    order: idx,
                }));
                
                router.put("/categories/reorder", { categories: reorderData });
            }
            return;
        }

        if (type === "bookmark") {
            // Handle bookmark drag
            const allCategories = [
                ...categoriesWithoutSection,
                ...sections.flatMap(s => s.categories || [])
            ];

            const sourceCategory = allCategories.find(cat => cat.id.toString() === source.droppableId);
            const destCategory = allCategories.find(cat => cat.id.toString() === destination.droppableId);

            if (!sourceCategory || !destCategory) return;

            const movingItem = sourceCategory.bookmarks[source.index];

            if (sourceCategory.id === destCategory.id) {
                // Reorder within same category
                const reorderedBookmarks = reorder(sourceCategory.bookmarks, source.index, destination.index);
                const updatedBookmarks = reorderedBookmarks.map((bookmark, idx) => ({
                    ...bookmark,
                    order: idx,
                }));

                router.post("/bookmarks/update-order", {
                    bookmarks: updatedBookmarks.map((bookmark) => ({
                        id: bookmark.id,
                        order: bookmark.order,
                    })),
                }, {
                    preserveState: true,
                    preserveScroll: true,
                });
            } else {
                // Move to different category
                router.put(`/bookmarks/${movingItem.id}`, { category_id: destCategory.id }, {
                    onSuccess: () => {
                        router.reload({ only: ["sections", "categoriesWithoutSection"] });
                    },
                });
            }
        }
    };

    // 3-dots menu for links
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
                icon: link.pinned ? "pi pi-lock-open" : "pi pi-lock",
                command: () => togglePin(link, categoryId),
            },
            {
                label: "Delete",
                icon: "pi pi-trash",
                command: () => deleteLink(link.id),
            },
        ];

        return (
            <>
                <Button
                    icon="pi pi-ellipsis-v"
                    className="p-button-text p-button-rounded"
                    onClick={(e) => menuRef.current.toggle(e)}
                />
                <Menu model={items} popup ref={menuRef} />
            </>
        );
    };

    // 3-dots menu for categories
    const CategoryOptions = ({ category }) => {
        const menuRef = useRef(null);

        const items = [
            {
                label: "Edit",
                icon: "pi pi-pencil",
                command: () => startEditingCategory(category),
            },
            {
                label: "Delete",
                icon: "pi pi-trash",
                command: () => deleteCategory(category.id),
            },
        ];

        return (
            <>
                <Button
                    icon="pi pi-ellipsis-v"
                    className="p-button-text p-button-rounded p-button-sm"
                    onClick={(e) => menuRef.current.toggle(e)}
                />
                <Menu model={items} popup ref={menuRef} />
            </>
        );
    };

    // 3-dots menu for sections
    const SectionOptions = ({ section }) => {
        const menuRef = useRef(null);

        const items = [
            {
                label: "Edit",
                icon: "pi pi-pencil",
                command: () => startEditingSection(section),
            },
            {
                label: "Delete",
                icon: "pi pi-trash",
                command: () => deleteSection(section.id),
            },
        ];

        return (
            <>
                <Button
                    icon="pi pi-ellipsis-v"
                    className="p-button-text p-button-rounded p-button-sm"
                    onClick={(e) => menuRef.current.toggle(e)}
                />
                <Menu model={items} popup ref={menuRef} />
            </>
        );
    };

    return (
        <Layout>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>Organizer</h5>

                        <DragDropContext onDragEnd={onDragEnd}>
                            {/* Sections */}
                            <Droppable droppableId="sections" type="section">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {sections.map((section, sectionIdx) => (
                                            <Draggable
                                                key={section.id}
                                                draggableId={`section-${section.id}`}
                                                index={sectionIdx}
                                                type="section"
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            marginBottom: "2rem",
                                                        }}
                                                    >
                                                        {/* Section Header */}
<div className="flex align-items-center mb-3">
    <div 
        {...provided.dragHandleProps} 
        className="cursor-move p-2 mr-2"
        style={{
            background: '#e0e0e0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px'
        }}
    >
        <i className="pi pi-bars" style={{ fontSize: '1.3rem' }} />
    </div>
    
                                                            
                                                            {editingSectionId === section.id ? (
                                                                <InputText
                                                                    value={editingSectionName}
                                                                    onChange={(e) => setEditingSectionName(e.target.value)}
                                                                    onBlur={() => saveSectionName(section.id)}
                                                                    onKeyDown={(e) => e.key === "Enter" && saveSectionName(section.id)}
                                                                    autoFocus
                                                                    className="font-bold text-xl"
                                                                />
                                                            ) : (
                                                                <h3
                                                                    className="font-bold text-xl m-0 cursor-pointer"
                                                                    onDoubleClick={() => startEditingSection(section)}
                                                                >
                                                                    {section.name}
                                                                </h3>
                                                            )}
                                                            
                                                            <div className="ml-auto">
                                                                <SectionOptions section={section} />
                                                            </div>
                                                        </div>

                                                        <div className="border-top-1 border-300 mb-3"></div>

                                                        {/* Categories within Section */}
                                                        <Droppable
                                                            droppableId={`section-${section.id}`}
                                                            type="category"
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className={`grid ${
                                                                        snapshot.isDraggingOver
                                                                            ? "border-2 border-dashed border-blue-500 p-3"
                                                                            : ""
                                                                    }`}
                                                                    style={{ minHeight: "100px" }}
                                                                >
                                                                    {section.categories && section.categories.map((category, catIdx) => (
                                                                        <Draggable
                                                                            key={category.id}
                                                                            draggableId={`section-${section.id}-category-${category.id}`}
                                                                            index={catIdx}
                                                                            type="category"
                                                                        >
                                                                            {(provided, snapshot) => (
                                                                                <div
                                                                                    className="col-12 md:col-6 lg:col-4"
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    style={{
                                                                                        ...provided.draggableProps.style,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        className="card"
                                                                                        style={{
                                                                                            background: snapshot.isDragging ? "#f0f0f0" : "white",
                                                                                        }}
                                                                                    >
                                                                                        {/* Category Header */}
{/* Category Header */}
<div className="flex justify-content-between align-items-center mb-3">
    <div className="flex align-items-center gap-2">
        <div 
            {...provided.dragHandleProps} 
            className="cursor-move p-2"
            style={{
                background: '#f0f0f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
            }}
        >
            <i className="pi pi-bars" style={{ fontSize: '1.2rem' }} />
        </div>
                                                                                                
                                                                                                {editingCategoryId === category.id ? (
                                                                                                    <InputText
                                                                                                        value={editingCategoryName}
                                                                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                                                                        onBlur={() => saveCategoryName(category.id)}
                                                                                                        onKeyDown={(e) => e.key === "Enter" && saveCategoryName(category.id)}
                                                                                                        autoFocus
                                                                                                    />
                                                                                                ) : (
                                                                                                    <h6
                                                                                                        className="m-0 cursor-pointer"
                                                                                                        onDoubleClick={() => startEditingCategory(category)}
                                                                                                    >
                                                                                                        {category.name}
                                                                                                    </h6>
                                                                                                )}
                                                                                            </div>
                                                                                            
                                                                                            <div className="flex gap-1">
                                                                                                <Button
                                                                                                    icon="pi pi-plus"
                                                                                                    className="p-button-rounded p-button-text"
                                                                                                    onClick={() => openAddDialog(category.id)}
                                                                                                    tooltip="Add Link"
                                                                                                    tooltipOptions={{ position: "top" }}
                                                                                                />
                                                                                                <CategoryOptions category={category} />
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Links within category */}
                                                                                        <Droppable
                                                                                            droppableId={category.id.toString()}
                                                                                            type="bookmark"
                                                                                        >
                                                                                            {(provided, snapshot) => (
                                                                                                <div
                                                                                                    ref={provided.innerRef}
                                                                                                    {...provided.droppableProps}
                                                                                                    className={`min-h-20 p-2 rounded ${
                                                                                                        snapshot.isDraggingOver
                                                                                                            ? "border-2 border-dashed border-blue-500"
                                                                                                            : "border-2 border-dashed border-transparent"
                                                                                                    }`}
                                                                                                >
                                                                                                    {category.bookmarks.length === 0 ? (
                                                                                                        <div>
                                                                                                            <p>No links yet. Add one!</p>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <ul style={{ listStyle: "none", padding: 0 }}>
                                                                                                            {category.bookmarks.map((link, idx) => (
                                                                                                                <Draggable
                                                                                                                    key={link.id}
                                                                                                                    draggableId={link.id.toString()}
                                                                                                                    index={idx}
                                                                                                                    type="bookmark"
                                                                                                                >
                                                                                                                    {(provided, snapshot) => (
                                                                                                                        <li
                                                                                                                            ref={provided.innerRef}
                                                                                                                            {...provided.draggableProps}
                                                                                                                            onClick={() => openLink(link.url)}
                                                                                                                            style={{
                                                                                                                                ...provided.draggableProps.style,
                                                                                                                                borderRadius: "8px",
                                                                                                                                background: snapshot.isDragging ? "#fddbdc" : "#8383830d",
                                                                                                                                border: "1px solid #80808042",
                                                                                                                                marginBottom: "0.5rem",
                                                                                                                                padding: "0.5rem",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            <div className="flex justify-content-between align-items-center cursor-pointer">
                                                                                                                                <div
                                                                                                                                    className="flex items-center"
                                                                                                                                    {...provided.dragHandleProps}
                                                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                                                >
                                                                                                                                    <i className="pi pi-arrows mr-2 cursor-move" />
                                                                                                                                    {link.favicon_url && (
                                                                                                                                        <img
                                                                                                                                            src={link.favicon_url}
                                                                                                                                            alt="favicon"
                                                                                                                                            onError={(e) => {
                                                                                                                                                e.target.onerror = null;
                                                                                                                                                e.target.style.display = "none";
                                                                                                                                            }}
                                                                                                                                            style={{
                                                                                                                                                width: "24px",
                                                                                                                                                height: "24px",
                                                                                                                                                marginRight: "8px",
                                                                                                                                            }}
                                                                                                                                        />
                                                                                                                                    )}
                                                                                                                                </div>
                                                                                                                                <span>{link.description || link.url}</span>
                                                                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                                                                    <LinkOptions link={link} categoryId={category.id} />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        </li>
                                                                                                                    )}
                                                                                                                </Draggable>
                                                                                                            ))}
                                                                                                        </ul>
                                                                                                    )}
                                                                                                    {provided.placeholder}
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
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            {/* Add Section Button */}
                            {addingSection ? (
                                <div className="flex gap-2 mb-3">
                                    <InputText
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addSection()}
                                        placeholder="Section name"
                                        autoFocus
                                    />
                                    <Button label="Add" onClick={addSection} />
                                    <Button label="Cancel" className="p-button-secondary" onClick={() => setAddingSection(false)} />
                                </div>
                            ) : (
                                <Button
                                    label="Add Section"
                                    icon="pi pi-plus"
                                    className="p-button-outlined mb-3"
                                    onClick={() => setAddingSection(true)}
                                />
                            )}

                            {/* Categories Without Section */}
                            <div className="mt-4">
                                <h5>Uncategorized Sections</h5>
                                <Droppable droppableId="categories-without-section" type="category">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`grid ${
                                                snapshot.isDraggingOver
                                                    ? "border-2 border-dashed border-blue-500 p-3"
                                                    : ""
                                            }`}
                                            style={{ minHeight: "100px" }}
                                        >
                                            {categoriesWithoutSection.map((category, idx) => (
                                                <Draggable
                                                    key={category.id}
                                                    draggableId={`nosection-category-${category.id}`}
                                                    index={idx}
                                                    type="category"
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            className="col-12 md:col-6 lg:col-4"
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                            }}
                                                        >
                                                            <div
                                                                className="card"
                                                                style={{
                                                                    background: snapshot.isDragging ? "#f0f0f0" : "white",
                                                                }}
                                                            >
                                                                {/* Same category content as in sections */}
{/* Same category content as in sections */}
<div className="flex justify-content-between align-items-center mb-3">
    <div className="flex align-items-center gap-2">
        <div 
            {...provided.dragHandleProps} 
            className="cursor-move p-2"
            style={{
                background: '#f0f0f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
            }}
        >
            <i className="pi pi-bars" style={{ fontSize: '1.2rem' }} />
        </div>
                                                                        
                                                                        {editingCategoryId === category.id ? (
                                                                            <InputText
                                                                                value={editingCategoryName}
                                                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                                                onBlur={() => saveCategoryName(category.id)}
                                                                                onKeyDown={(e) => e.key === "Enter" && saveCategoryName(category.id)}
                                                                                autoFocus
                                                                            />
                                                                        ) : (
                                                                            <h6
                                                                                className="m-0 cursor-pointer"
                                                                                onDoubleClick={() => startEditingCategory(category)}
                                                                            >
                                                                                {category.name}
                                                                            </h6>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            icon="pi pi-plus"
                                                                            className="p-button-rounded p-button-text"
                                                                            onClick={() => openAddDialog(category.id)}
                                                                            tooltip="Add Link"
                                                                            tooltipOptions={{ position: "top" }}
                                                                        />
                                                                        <CategoryOptions category={category} />
                                                                    </div>
                                                                </div>

                                                                <Droppable
                                                                    droppableId={category.id.toString()}
                                                                    type="bookmark"
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.droppableProps}
                                                                            className={`min-h-20 p-2 rounded ${
                                                                                snapshot.isDraggingOver
                                                                                    ? "border-2 border-dashed border-blue-500"
                                                                                    : "border-2 border-dashed border-transparent"
                                                                            }`}
                                                                        >
                                                                            {category.bookmarks.length === 0 ? (
                                                                                <div>
                                                                                    <p>No links yet. Add one!</p>
                                                                                </div>
                                                                            ) : (
                                                                                <ul style={{ listStyle: "none", padding: 0 }}>
                                                                                    {category.bookmarks.map((link, idx) => (
                                                                                        <Draggable
                                                                                            key={link.id}
                                                                                            draggableId={link.id.toString()}
                                                                                            index={idx}
                                                                                            type="bookmark"
                                                                                        >
                                                                                            {(provided, snapshot) => (
                                                                                                <li
                                                                                                    ref={provided.innerRef}
                                                                                                    {...provided.draggableProps}
                                                                                                    onClick={() => openLink(link.url)}
                                                                                                    style={{
                                                                                                        ...provided.draggableProps.style,
                                                                                                        borderRadius: "8px",
                                                                                                        background: snapshot.isDragging ? "#fddbdc" : "#8383830d",
                                                                                                        border: "1px solid #80808042",
                                                                                                        marginBottom: "0.5rem",
                                                                                                        padding: "0.5rem",
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="flex justify-content-between align-items-center cursor-pointer">
                                                                                                        <div
                                                                                                            className="flex items-center"
                                                                                                            {...provided.dragHandleProps}
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            <i className="pi pi-arrows mr-2 cursor-move" />
                                                                                                            {link.favicon_url && (
                                                                                                                <img
                                                                                                                    src={link.favicon_url}
                                                                                                                    alt="favicon"
                                                                                                                    onError={(e) => {
                                                                                                                        e.target.onerror = null;
                                                                                                                        e.target.style.display = "none";
                                                                                                                    }}
                                                                                                                    style={{
                                                                                                                        width: "24px",
                                                                                                                        height: "24px",
                                                                                                                        marginRight: "8px",
                                                                                                                    }}
                                                                                                                />
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <span>{link.description || link.url}</span>
                                                                                                        <div onClick={(e) => e.stopPropagation()}>
                                                                                                            <LinkOptions link={link} categoryId={category.id} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </li>
                                                                                            )}
                                                                                        </Draggable>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                            {provided.placeholder}
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

                                {/* Add Category Button */}
                                {addingCategory ? (
                                    <div className="flex gap-2 mt-3">
                                        <InputText
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                                            placeholder="Category name"
                                            autoFocus
                                        />
                                        <Button label="Add" onClick={addCategory} />
                                        <Button label="Cancel" className="p-button-secondary" onClick={() => setAddingCategory(false)} />
                                    </div>
                                ) : (
                                    <Button
                                        label="Add Category"
                                        icon="pi pi-plus"
                                        className="p-button-outlined mt-3"
                                        onClick={() => setAddingCategory(true)}
                                    />
                                )}
                            </div>
                        </DragDropContext>
                    </div>
                </div>
            </div>

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
                            onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                            placeholder="Enter the URL"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={linkData.description}
                            onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
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
                }}
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="edit-url">URL</label>
                        <InputText
                            id="edit-url"
                            value={linkData.url}
                            onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                            placeholder="Enter the URL"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="edit-description">Description</label>
                        <InputTextarea
                            id="edit-description"
                            value={linkData.description}
                            onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
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