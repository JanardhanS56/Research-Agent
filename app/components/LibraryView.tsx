"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getSavedResearches,
  getResearchTopics,
  deleteSavedResearch,
  togglePinResearch,
  updateSavedResearch,
  addResearchTopic,
  updateResearchTopic,
  deleteResearchTopic,
  filterResearches,
  filterTopics,
  exportLibraryJSON,
  importLibraryJSON,
  type SavedResearch,
  type ResearchTopic,
  type TopicPriority,
  type TopicStatus,
} from "../lib/library";

interface LibraryViewProps {
  onLoadResearchToWorkspace: (query: string, report: string) => void;
  onLaunchTopicResearch: (topicQuery: string) => void;
  onBackToWorkspace: () => void;
}

export default function LibraryView({
  onLoadResearchToWorkspace,
  onLaunchTopicResearch,
  onBackToWorkspace,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<"researches" | "topics">("researches");

  // Research state
  const [researches, setResearches] = useState<SavedResearch[]>([]);
  const [researchSearch, setResearchSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [researchSort, setResearchSort] = useState<"pinned" | "recent" | "words" | "alpha">("pinned");

  // Topics backlog state
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New topic form state
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicPriority, setNewTopicPriority] = useState<TopicPriority>("medium");
  const [newTopicNotes, setNewTopicNotes] = useState("");
  const [newTopicTags, setNewTopicTags] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Modal / Reader state
  const [readingResearch, setReadingResearch] = useState<SavedResearch | null>(null);
  const [editingResearch, setEditingResearch] = useState<SavedResearch | null>(null);
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editNotesInput, setEditNotesInput] = useState("");

  // Notification / Toast
  const [notification, setNotification] = useState<string | null>(null);

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function reloadData() {
    setResearches(getSavedResearches());
    setTopics(getResearchTopics());
  }

  useEffect(() => {
    reloadData();
  }, []);

  // Compute all unique tags from saved researches
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of researches) {
      r.tags?.forEach((t) => set.add(t));
    }
    return Array.from(set).sort();
  }, [researches]);

  // Filtered lists
  const filteredResearches = useMemo(() => {
    return filterResearches(researches, researchSearch, selectedTag, researchSort);
  }, [researches, researchSearch, selectedTag, researchSort]);

  const filteredTopics = useMemo(() => {
    return filterTopics(topics, topicSearch, priorityFilter, statusFilter);
  }, [topics, topicSearch, priorityFilter, statusFilter]);

  // Handlers for research
  function handleDeleteResearch(id: string, query: string) {
    if (window.confirm(`Delete saved research "${query}"?`)) {
      deleteSavedResearch(id);
      reloadData();
      showToast("Research deleted from library");
      if (readingResearch?.id === id) setReadingResearch(null);
    }
  }

  function handleTogglePin(id: string) {
    togglePinResearch(id);
    reloadData();
  }

  function handleOpenEditResearch(item: SavedResearch) {
    setEditingResearch(item);
    setEditTagsInput(item.tags.join(", "));
    setEditNotesInput(item.notes || "");
  }

  function handleSaveEditResearch() {
    if (!editingResearch) return;
    const tags = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    updateSavedResearch(editingResearch.id, {
      tags,
      notes: editNotesInput.trim() || undefined,
    });
    setEditingResearch(null);
    reloadData();
    showToast("Research metadata updated");
  }

  // Handlers for topics
  function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const tags = newTopicTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    addResearchTopic({
      topic: newTopicTitle.trim(),
      priority: newTopicPriority,
      notes: newTopicNotes.trim() || undefined,
      tags,
    });

    setNewTopicTitle("");
    setNewTopicNotes("");
    setNewTopicTags("");
    setIsAddingTopic(false);
    reloadData();
    showToast("New research topic added to backlog");
  }

  function handleDeleteTopic(id: string) {
    deleteResearchTopic(id);
    reloadData();
    showToast("Topic deleted");
  }

  function handleToggleTopicStatus(id: string, currentStatus: TopicStatus) {
    const nextStatus: TopicStatus = currentStatus === "completed" ? "queued" : "completed";
    updateResearchTopic(id, { status: nextStatus });
    reloadData();
  }

  // Backup / Export
  function handleExport() {
    const jsonStr = exportLibraryJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-library-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Library exported as JSON");
  }

  // Import
  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importLibraryJSON(content);
        if (result.success) {
          reloadData();
          showToast(`Imported ${result.importedResearches} researches and ${result.importedTopics} topics`);
        } else {
          alert(`Import failed: ${result.error || "Unknown error"}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadMarkdownReport(content: string, query: string) {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    a.download = `research-${slug || "report"}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#20232c] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Research Library & Backlog
            </h2>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              {researches.length} saved · {topics.length} backlog
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Access previous investigation briefs, manage upcoming research topics, and organize notes.
          </p>
        </div>

        {/* Global Library Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToWorkspace}
            className="px-3 py-1.5 rounded-lg border border-[#2a2e3a] bg-[#14161d] hover:bg-[#1c202a] text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Workspace
          </button>

          <button
            type="button"
            onClick={handleExport}
            title="Download JSON backup of all saved items and topics"
            className="px-2.5 py-1.5 rounded-lg border border-[#262832] bg-[#121419] hover:bg-[#1a1d24] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import library items from JSON backup"
            className="px-2.5 py-1.5 rounded-lg border border-[#262832] bg-[#121419] hover:bg-[#1a1d24] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-2.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 text-cyan-200 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          {notification}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#20222a]">
        <button
          type="button"
          onClick={() => setActiveTab("researches")}
          className={`pb-3 px-3 text-xs font-medium font-mono border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "researches"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Saved Research ({researches.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("topics")}
          className={`pb-3 px-3 text-xs font-medium font-mono border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "topics"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Topics to Research ({topics.filter((t) => t.status !== "completed").length})
        </button>
      </div>

      {/* ─── TAB 1: SAVED RESEARCH ────────────────────────────────────────── */}
      {activeTab === "researches" && (
        <div className="space-y-4">
          {/* Controls: Search, Tag Filter, Sorting */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={researchSearch}
                onChange={(e) => setResearchSearch(e.target.value)}
                placeholder="Search queries, findings, notes, tags..."
                className="w-full text-xs font-mono bg-[#111317] border border-[#20232c] focus:border-cyan-500 rounded-lg px-3 py-2 pl-9 text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {researchSearch && (
                <button
                  type="button"
                  onClick={() => setResearchSearch("")}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tag selector */}
              {allTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="text-xs font-mono bg-[#111317] border border-[#20232c] rounded-lg px-2.5 py-1.8 text-zinc-300 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              )}

              {/* Sort selector */}
              <select
                value={researchSort}
                onChange={(e) => setResearchSort(e.target.value as typeof researchSort)}
                className="text-xs font-mono bg-[#111317] border border-[#20232c] rounded-lg px-2.5 py-1.8 text-zinc-300 outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="pinned">Pinned & Recent</option>
                <option value="recent">Most Recent</option>
                <option value="words">Word Count</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Tag Filter Pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedTag === "all"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-[#14161d] text-zinc-400 border border-[#20232c] hover:text-zinc-200"
                }`}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === t ? "all" : t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedTag === t
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-[#14161d] text-zinc-400 border border-[#20232c] hover:text-zinc-200"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* Researches List */}
          {filteredResearches.length === 0 ? (
            <div className="panel p-8 text-center bg-[#111317]/40 border-[#20232c] rounded-xl">
              <svg className="w-10 h-10 mx-auto text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-sm font-semibold text-zinc-300">
                {researchSearch || selectedTag !== "all" ? "No matching saved research" : "Your Library is Empty"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                {researchSearch || selectedTag !== "all"
                  ? "Try adjusting your query or resetting tag filters."
                  : "When you run an autonomous research investigation in the workspace, click 'Save to Library' to store and index it here."}
              </p>
              {!researchSearch && selectedTag === "all" && (
                <button
                  type="button"
                  onClick={onBackToWorkspace}
                  className="mt-4 px-3.5 py-1.5 rounded-lg border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-xs font-mono transition-colors"
                >
                  Go to Workspace
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredResearches.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.pinned
                      ? "border-cyan-800/40 bg-[#12161f]/80"
                      : "border-[#20232c] bg-[#111317]/70 hover:border-[#2a2f3d]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item.id)}
                          title={item.pinned ? "Unpin research" : "Pin research to top"}
                          className={`p-1 rounded text-xs transition-colors ${
                            item.pinned
                              ? "text-amber-400 hover:text-amber-300"
                              : "text-zinc-600 hover:text-zinc-400"
                          }`}
                        >
                          ★
                        </button>

                        <h3
                          onClick={() => setReadingResearch(item)}
                          className="text-sm font-semibold text-zinc-100 hover:text-cyan-300 cursor-pointer transition-colors"
                        >
                          {item.query}
                        </h3>

                        {item.pinned && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-800/30 px-1.5 py-0.2 rounded">
                            Pinned
                          </span>
                        )}
                      </div>

                      {/* Meta badges */}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-2 flex-wrap">
                        <span>{new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                        <span className="text-zinc-700">·</span>
                        <span>{item.wordCount} words</span>
                        <span className="text-zinc-700">·</span>
                        <span>{item.citationsCount} citations</span>

                        {item.tags?.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className="text-[10px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/30 px-1.5 py-0.2 rounded cursor-pointer hover:bg-cyan-900/40"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {item.notes && (
                        <p className="mt-2 text-xs text-zinc-300 bg-[#0c0d11] p-2 rounded border border-[#1b1e26] font-mono">
                          <span className="text-zinc-500 font-semibold mr-1">Note:</span>
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReadingResearch(item)}
                        className="px-2.5 py-1 rounded border border-[#262832] bg-[#14161e] hover:bg-[#1c202a] text-zinc-300 text-xs font-mono transition-colors"
                      >
                        Read
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadResearchToWorkspace(item.query, item.report)}
                        title="Load into workspace investigation"
                        className="px-2.5 py-1 rounded border border-cyan-700/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 text-xs font-mono transition-colors"
                      >
                        Load in Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditResearch(item)}
                        title="Edit tags or personal notes"
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteResearch(item.id, item.query)}
                        title="Delete from library"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TOPICS BACKLOG ────────────────────────────────────────── */}
      {activeTab === "topics" && (
        <div className="space-y-4">
          {/* Quick-Add Topic Bar */}
          <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]/80">
            {!isAddingTopic ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide font-mono">
                    Research Queue & Idea Backlog
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Save curiosity sparks, future research tasks, or sub-questions to investigate later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(true)}
                  className="px-3 py-1.5 rounded-lg border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <span>+</span> Add Topic
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddTopic} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-200 font-mono">
                    New Research Topic
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingTopic(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Topic inquiry (e.g. Sodium-ion battery commercialization timeline)..."
                    autoFocus
                    required
                    className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-3 py-2 text-zinc-100 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newTopicPriority}
                      onChange={(e) => setNewTopicPriority(e.target.value as TopicPriority)}
                      className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-cyan-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTopicTags}
                      onChange={(e) => setNewTopicTags(e.target.value)}
                      placeholder="e.g. Energy, Hardware, Physics"
                      className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-100 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    value={newTopicNotes}
                    onChange={(e) => setNewTopicNotes(e.target.value)}
                    placeholder="Specific questions to answer, context, or hypothesis..."
                    rows={2}
                    className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-100 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTopic(false)}
                    className="px-3 py-1.5 rounded border border-[#262832] bg-[#14161e] text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-xs font-mono font-medium"
                  >
                    Save to Backlog
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Topics Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search backlog topics..."
                className="w-full text-xs font-mono bg-[#111317] border border-[#20232c] focus:border-cyan-500 rounded-lg px-3 py-2 pl-9 text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs font-mono bg-[#111317] border border-[#20232c] rounded-lg px-2.5 py-1.8 text-zinc-300 outline-none focus:border-cyan-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-mono bg-[#111317] border border-[#20232c] rounded-lg px-2.5 py-1.8 text-zinc-300 outline-none focus:border-cyan-500"
              >
                <option value="all">All Status</option>
                <option value="queued">Queued</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Topics List */}
          {filteredTopics.length === 0 ? (
            <div className="panel p-8 text-center bg-[#111317]/40 border-[#20232c] rounded-xl">
              <p className="text-xs text-zinc-500">
                {topicSearch || priorityFilter !== "all" || statusFilter !== "all"
                  ? "No topics match the selected filters."
                  : "No research topics queued yet. Add topics above to build your research backlog."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredTopics.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    t.status === "completed"
                      ? "border-[#1b1e26] bg-[#0d0e12] opacity-60"
                      : "border-[#20232c] bg-[#111317]/70 hover:border-[#2a2f3d]"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleTopicStatus(t.id, t.status)}
                        title={t.status === "completed" ? "Mark as queued" : "Mark as completed"}
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                          t.status === "completed"
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "border-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        {t.status === "completed" && "✓"}
                      </button>

                      <span
                        className={`text-xs font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                          t.priority === "high"
                            ? "text-rose-400 bg-rose-950/30 border border-rose-800/40"
                            : t.priority === "medium"
                            ? "text-amber-400 bg-amber-950/30 border border-amber-800/40"
                            : "text-zinc-400 bg-zinc-800/30 border border-zinc-700/40"
                        }`}
                      >
                        {t.priority}
                      </span>

                      <h4
                        className={`text-xs font-semibold ${
                          t.status === "completed"
                            ? "line-through text-zinc-500"
                            : "text-zinc-200"
                        }`}
                      >
                        {t.topic}
                      </h4>
                    </div>

                    {t.notes && (
                      <p className="text-[11px] text-zinc-400 mt-1 pl-6">
                        {t.notes}
                      </p>
                    )}

                    {t.tags?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 pl-6">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono text-zinc-400 bg-[#161820] border border-[#20222a] px-1.5 py-0.2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => onLaunchTopicResearch(t.topic)}
                      title="Run autonomous research on this topic immediately"
                      className="px-2.5 py-1 rounded border border-emerald-600/40 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 text-xs font-mono transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Launch Research
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(t.id)}
                      title="Delete topic"
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: FULL REPORT READER ────────────────────────────────────── */}
      {readingResearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#2b303c] bg-[#101217] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:px-6 border-b border-[#20222a] bg-[#14161e]">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  {readingResearch.query}
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-1">
                  <span>{new Date(readingResearch.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{readingResearch.wordCount} words</span>
                  <span>·</span>
                  <span>{readingResearch.citationsCount} citations</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadResearchToWorkspace(readingResearch.query, readingResearch.report)}
                  className="px-2.5 py-1 rounded border border-cyan-600/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 text-xs font-mono transition-colors"
                >
                  Load in Workspace
                </button>
                <button
                  type="button"
                  onClick={() => downloadMarkdownReport(readingResearch.report, readingResearch.query)}
                  className="px-2.5 py-1 rounded border border-[#262832] bg-[#16181e] hover:bg-[#1f222a] text-zinc-300 text-xs font-mono transition-colors"
                >
                  Export .md
                </button>
                <button
                  type="button"
                  onClick={() => setReadingResearch(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 report-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {readingResearch.report}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT RESEARCH METADATA ────────────────────────────────── */}
      {editingResearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-5 rounded-2xl border border-[#2b303c] bg-[#111318] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#20222a]">
              <h3 className="text-xs font-semibold text-zinc-100 font-mono uppercase tracking-wide">
                Edit Research Metadata
              </h3>
              <button
                type="button"
                onClick={() => setEditingResearch(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Query
              </label>
              <p className="text-xs text-zinc-300 bg-[#0c0d11] p-2 rounded border border-[#1e2129] font-mono">
                {editingResearch.query}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
                className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Personal Notes
              </label>
              <textarea
                value={editNotesInput}
                onChange={(e) => setEditNotesInput(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-100 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2129]">
              <button
                type="button"
                onClick={() => setEditingResearch(null)}
                className="px-3 py-1.5 rounded border border-[#262832] bg-[#14161e] text-zinc-400 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditResearch}
                className="px-3.5 py-1.5 rounded border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-xs font-mono font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
