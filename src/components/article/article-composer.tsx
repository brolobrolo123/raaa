"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { articleSchema } from "@/lib/validators";
import {
  PRIMARY_SECTION_SLUGS,
  SECTION_DEFINITIONS,
  SECTION_SLUGS,
  getSectionParentSlug,
  getSectionTopics,
  isPrimarySectionSlug,
  type PrimarySectionSlug,
  type SectionSlug,
} from "@/lib/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeHtml } from "@/lib/sanitizer";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { FormMessage } from "../forms/form-message";
import { Bold, Film, Image as ImageIcon, Italic, List, PaintBucket, Palette, Upload } from "lucide-react";

const colorPresets = ["#2563eb", "#0d9488", "#f97316", "#db2777", "#22d3ee", "#a855f7", "#facc15"];
const textColorPresets = ["#f8fafc", "#f97316", "#facc15", "#0ea5e9", "#22d3ee", "#a855f7", "#10b981", "#f472b6"];
const GIPHY_KEY = (process.env.NEXT_PUBLIC_GIPHY_KEY ?? "dc6zaTOxFJmzC").trim();
const MIN_CONTENT_CHARS = 100;
const TITLE_MAX_CHARS = 12;
const SUMMARY_MAX_CHARS = 30;

const getPlainTextLength = (html: string) =>
  html
    .replace(/<style.*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script.*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;

type GifResult = {
  id: string;
  previewUrl: string;
  fullUrl: string;
};

type GiphyApiImages = {
  original?: { url: string };
  fixed_height_small?: { url: string };
};

type GiphyApiResponse = {
  data?: Array<{
    id: string;
    images?: GiphyApiImages;
  }>;
};

type ArticleValues = z.infer<typeof articleSchema>;
type ColorInputElement = HTMLInputElement & { showPicker?: () => void };

export function ArticleComposer({ initialSectionSlug = null }: { initialSectionSlug?: SectionSlug | null }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const editorRef = useRef<HTMLDivElement>(null);
  const textPaletteRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverColorInputRef = useRef<ColorInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isTextPaletteOpen, setIsTextPaletteOpen] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState(textColorPresets[0]);
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifQuery, setGifQuery] = useState(() => (locale === "es" ? "conspiracion" : "conspiracy"));
  const [isGifLoading, setIsGifLoading] = useState(false);
  const [contentChars, setContentChars] = useState(0);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadMessage, setCoverUploadMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const textColorHistoryTimer = useRef<number | null>(null);
  const lastEmptyListItemRef = useRef<HTMLLIElement | null>(null);

  const normalizedInitialSectionSlug = initialSectionSlug && (SECTION_SLUGS as string[]).includes(initialSectionSlug)
    ? (initialSectionSlug as SectionSlug)
    : undefined;
  const derivedInitialPrimarySection: PrimarySectionSlug = normalizedInitialSectionSlug
    ? isPrimarySectionSlug(normalizedInitialSectionSlug)
      ? normalizedInitialSectionSlug
      : getSectionParentSlug(normalizedInitialSectionSlug) ?? PRIMARY_SECTION_SLUGS[0]
    : PRIMARY_SECTION_SLUGS[0];
  const initialTopics = getSectionTopics(derivedInitialPrimarySection);
  const derivedInitialTopic: SectionSlug = normalizedInitialSectionSlug && !isPrimarySectionSlug(normalizedInitialSectionSlug)
    ? normalizedInitialSectionSlug
    : initialTopics[0] ?? derivedInitialPrimarySection;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
    setValue,
    control,
  } = useForm<ArticleValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      summary: "",
      section: derivedInitialTopic,
      content: "",
      coverColor: colorPresets[0],
      coverImage: null,
    },
  });

  const [selectedPrimarySection, setSelectedPrimarySection] = useState<PrimarySectionSlug>(
    derivedInitialPrimarySection,
  );
  const [selectedTopic, setSelectedTopic] = useState<SectionSlug>(derivedInitialTopic);
  const activeTopics = useMemo(() => getSectionTopics(selectedPrimarySection), [selectedPrimarySection]);

  useEffect(() => {
    if (activeTopics.length === 0) {
      if (selectedTopic !== selectedPrimarySection) {
        setSelectedTopic(selectedPrimarySection);
      }
      return;
    }
    if (!activeTopics.includes(selectedTopic)) {
      setSelectedTopic(activeTopics[0]);
    }
  }, [activeTopics, selectedPrimarySection, selectedTopic]);

  useEffect(() => {
    setValue("section", selectedTopic, { shouldValidate: true });
  }, [selectedTopic, setValue]);

  const selectedColor = useWatch({ control, name: "coverColor" });
  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const coverImage = useWatch({ control, name: "coverImage" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("recent-text-colors");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setRecentTextColors(parsed.slice(0, 8));
      }
    } catch {
      // ignore corrupted values
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("recent-text-colors", JSON.stringify(recentTextColors));
  }, [recentTextColors]);

  useEffect(() => {
    return () => {
      if (textColorHistoryTimer.current) {
        window.clearTimeout(textColorHistoryTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isListMenuOpen) {
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      if (!listMenuRef.current) return;
      if (!listMenuRef.current.contains(event.target as Node)) {
        setIsListMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListMenuOpen]);

  useEffect(() => {
    if (!isTextPaletteOpen) {
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      if (!textPaletteRef.current) return;
      if (!textPaletteRef.current.contains(event.target as Node)) {
        setIsTextPaletteOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isTextPaletteOpen]);

  useEffect(() => {
    if (!isGifPickerOpen) {
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      if (!gifPickerRef.current) return;
      if (!gifPickerRef.current.contains(event.target as Node)) {
        setIsGifPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isGifPickerOpen]);

  const fetchGifs = useCallback(async (query: string) => {
    setIsGifLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=g&lang=${locale}`,
      );
      const data = (await response.json()) as GiphyApiResponse;
      const parsed: GifResult[] = (data.data ?? []).map((item) => ({
        id: item.id,
        previewUrl: item.images?.fixed_height_small?.url ?? item.images?.original?.url ?? "",
        fullUrl: item.images?.original?.url ?? item.images?.fixed_height_small?.url ?? "",
      }));
      setGifResults(parsed.filter((gif) => gif.fullUrl));
    } catch (error) {
      console.error("Error fetching GIFs", error);
      setGifResults([]);
    } finally {
      setIsGifLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (isGifPickerOpen && gifResults.length === 0) {
      void fetchGifs(gifQuery);
    }
  }, [fetchGifs, gifResults.length, gifQuery, isGifPickerOpen]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleLocalImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      exec("insertImage", result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const openCoverColorPicker = () => {
    const picker = coverColorInputRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.click();
  };

  const handleCoverColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue("coverColor", event.target.value);
  };

  const openCoverImagePicker = () => {
    coverImageInputRef.current?.click();
  };

  const handleCoverImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverUploadMessage(null);
    setIsCoverUploading(true);
    const uploadErrorMessage = t("newArticlePage.form.cover.uploadError");
    const uploadSuccessMessage = t("newArticlePage.form.cover.uploadSuccess");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/articles/cover", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? uploadErrorMessage);
      }
      setValue("coverImage", data.url, { shouldValidate: true });
      setCoverUploadMessage({ text: uploadSuccessMessage, tone: "success" });
    } catch (error) {
      const fallback = error instanceof Error ? error.message : uploadErrorMessage;
      setCoverUploadMessage({ text: fallback, tone: "error" });
    } finally {
      setIsCoverUploading(false);
      event.target.value = "";
    }
  };

  const clearCoverImage = () => {
    setValue("coverImage", null, { shouldValidate: false });
    setCoverUploadMessage(null);
  };

  const applyTextColor = (
    color: string,
    options?: {
      closePalette?: boolean;
      trackHistory?: boolean;
    },
  ) => {
    setSelectedTextColor(color);
    exec("foreColor", color);
    const closePalette = options?.closePalette ?? true;
    const trackHistory = options?.trackHistory ?? false;
    if (trackHistory) {
      setRecentTextColors((prev) => {
        const filtered = prev.filter((entry) => entry !== color);
        return [color, ...filtered].slice(0, 8);
      });
    }
    if (closePalette) {
      setIsTextPaletteOpen(false);
    }
  };

  const scheduleTextColorHistory = (color: string) => {
    if (textColorHistoryTimer.current) {
      window.clearTimeout(textColorHistoryTimer.current);
    }
    textColorHistoryTimer.current = window.setTimeout(() => {
      applyTextColor(color, { closePalette: false, trackHistory: true });
      textColorHistoryTimer.current = null;
    }, 200);
  };

  const handleCustomTextColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    applyTextColor(color, { closePalette: false, trackHistory: false });
    scheduleTextColorHistory(color);
  };

  const handleGifSelect = (gif: GifResult) => {
    exec("insertImage", gif.fullUrl);
    setIsGifPickerOpen(false);
  };

  const getElementFromNode = (node: Node | null) => {
    if (!node) return null;
    if (node instanceof Element) return node;
    return node.parentElement;
  };

  const applyList = (mode: "points" | "numbers" | "classic") => {
    editorRef.current?.focus();
    if (mode === "numbers") {
      document.execCommand("insertOrderedList");
      const selection = window.getSelection();
      const element = getElementFromNode(selection?.anchorNode ?? null);
      const ordered = element?.closest("ol") as HTMLOListElement | null;
      if (ordered) {
        ordered.style.listStyleType = "decimal";
      }
      setIsListMenuOpen(false);
      return;
    }

    document.execCommand("insertUnorderedList");
    const selection = window.getSelection();
    const element = getElementFromNode(selection?.anchorNode ?? null);
    const list = element?.closest("ul") as HTMLUListElement | null;
    if (list) {
      list.style.listStyleType = mode === "points" ? "disc" : "square";
    }
    setIsListMenuOpen(false);
  };

  const triggerGifSearch = () => {
    void fetchGifs(gifQuery);
  };

  const handleGifInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      triggerGifSearch();
    }
  };

  const isListItemEmpty = (item: HTMLLIElement) => {
    const text = item.textContent ?? "";
    return text.replace(/\u200b/gi, "").replace(/\u00a0/g, "").trim().length === 0;
  };

  const focusNodeStart = (node: Node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(true);
    const selectionInstance = window.getSelection();
    selectionInstance?.removeAllRanges();
    selectionInstance?.addRange(range);
  };

  const insertNewListItem = (current: HTMLLIElement, markPlaceholder = true) => {
    const parentList = current.parentElement;
    if (!parentList) return;
    const newItem = document.createElement("li");
    newItem.innerHTML = "<br />";
    parentList.insertBefore(newItem, current.nextSibling);
    focusNodeStart(newItem);
    if (markPlaceholder) {
      lastEmptyListItemRef.current = newItem;
    }
  };

  const exitListFromItem = (item: HTMLLIElement) => {
    const parentList = item.parentElement;
    if (!parentList) return;
    const listParent = parentList.parentElement;
    const afterList = parentList.nextSibling;
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br />";
    item.remove();
    if (listParent) {
      listParent.insertBefore(paragraph, afterList);
    } else {
      editorRef.current?.appendChild(paragraph);
    }
    if (parentList.childElementCount === 0) {
      parentList.remove();
    }
    focusNodeStart(paragraph);
  };

  const onSubmit = async (values: ArticleValues) => {
    setMessage(null);
    setIsError(false);
    const cleanHtml = sanitizeHtml(contentHtml);
    const plainTextLength = getPlainTextLength(cleanHtml);
    if (plainTextLength < MIN_CONTENT_CHARS) {
      setIsError(true);
      setMessage(t("newArticlePage.form.errors.contentMin").replace("{count}", String(MIN_CONTENT_CHARS)));
      return;
    }

    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, content: cleanHtml }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setIsError(true);
      setMessage(data?.error ?? t("newArticlePage.form.errors.publishFailed"));
      return;
    }

    const data = await response.json();
    setMessage(t("newArticlePage.form.status.success"));
    if (typeof window !== "undefined") {
      window.location.href = `/articles/${data.id}`;
    } else {
      router.push(`/articles/${data.id}`);
    }
  };

  const syncEditorState = (options?: { preserveEmptyMarker?: boolean }) => {
    const html = editorRef.current?.innerHTML ?? "";
    setContentHtml(html);
    setContentChars(getPlainTextLength(html));
    setValue("content", html, { shouldValidate: false });
    if (!options?.preserveEmptyMarker) {
      lastEmptyListItemRef.current = null;
    }
  };

  const handleEditorInput = () => {
    syncEditorState();
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    const selection = window.getSelection();
    const element = getElementFromNode(selection?.anchorNode ?? null);
    const listItem = element?.closest("li");

    if (!listItem) {
      lastEmptyListItemRef.current = null;
      return;
    }

    if (isListItemEmpty(listItem)) {
      event.preventDefault();
      if (lastEmptyListItemRef.current === listItem) {
        lastEmptyListItemRef.current = null;
        exitListFromItem(listItem);
        syncEditorState();
        return;
      }

      insertNewListItem(listItem);
      syncEditorState({ preserveEmptyMarker: true });
      return;
    }

    event.preventDefault();
    lastEmptyListItemRef.current = null;
    insertNewListItem(listItem);
    syncEditorState({ preserveEmptyMarker: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-white">
      <div className="grid gap-3">
        <label className="text-sm uppercase tracking-wide text-slate-300">{t("newArticlePage.form.titleLabel")}</label>
        <Input
          placeholder={t("newArticlePage.form.titlePlaceholder")}
          maxLength={TITLE_MAX_CHARS}
          {...register("title")}
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{t("newArticlePage.form.titleHint").replace("{max}", String(TITLE_MAX_CHARS))}</span>
          <span>
            {titleValue.length}/{TITLE_MAX_CHARS}
          </span>
        </div>
        {errors.title && <p className="text-xs text-rose-200">{errors.title.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm uppercase tracking-wide text-slate-300">{t("newArticlePage.form.summaryLabel")}</label>
        <Textarea
          rows={2}
          maxLength={SUMMARY_MAX_CHARS}
          placeholder={t("newArticlePage.form.summaryPlaceholder").replace(
            "{max}",
            String(SUMMARY_MAX_CHARS),
          )}
          {...register("summary")}
        />
        {errors.summary && <p className="text-xs text-rose-200">{errors.summary.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm uppercase tracking-wide text-slate-300">{t("newArticlePage.form.clubLabel")}</label>
        <select
          value={selectedPrimarySection}
          onChange={(event) => setSelectedPrimarySection(event.target.value as PrimarySectionSlug)}
          className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white"
        >
          {PRIMARY_SECTION_SLUGS.map((slug) => (
            <option key={slug} value={slug} className="bg-slate-900 text-white">
              {SECTION_DEFINITIONS[slug].name[locale]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3">
        <label className="text-sm uppercase tracking-wide text-slate-300">{t("newArticlePage.form.topicsLabel")}</label>
        <select
          value={selectedTopic}
          onChange={(event) => setSelectedTopic(event.target.value as SectionSlug)}
          className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white"
        >
          {(activeTopics.length > 0 ? activeTopics : [selectedPrimarySection]).map((slug) => (
            <option key={slug} value={slug} className="bg-slate-900 text-white">
              {SECTION_DEFINITIONS[slug].name[locale]}
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" {...register("section")} value={selectedTopic} readOnly />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-sm uppercase tracking-wide text-slate-300">{t("newArticlePage.form.contentLabel")}</label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={openCoverColorPicker}
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                <PaintBucket className="h-5 w-5" />
                <span>{t("newArticlePage.form.cover.colorLabel")}</span>
                <span
                  className="h-5 w-5 rounded-full border border-white/30"
                  style={{ backgroundColor: selectedColor }}
                  aria-hidden
                />
              </button>
              <input
                ref={coverColorInputRef}
                type="color"
                value={selectedColor}
                onChange={handleCoverColorChange}
                className="absolute left-0 top-0 h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              onClick={openCoverImagePicker}
              disabled={isCoverUploading}
              className="flex items-center gap-2 rounded-2xl border border-dashed border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImageIcon className="h-5 w-5" />
              <span>
                {isCoverUploading
                  ? t("newArticlePage.form.cover.uploading")
                  : coverImage
                    ? t("newArticlePage.form.cover.change")
                    : t("newArticlePage.form.cover.upload")}
              </span>
            </button>
            <input
              ref={coverImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverImageChange}
            />
          </div>
        </div>
        {coverUploadMessage && (
          <p className={`text-xs ${coverUploadMessage.tone === "error" ? "text-rose-200" : "text-emerald-200"}`}>
            {coverUploadMessage.text}
          </p>
        )}
        {coverImage && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Image
              src={coverImage}
              alt={t("newArticlePage.form.cover.previewAlt")}
              width={180}
              height={110}
              unoptimized
              className="h-24 w-40 rounded-2xl object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 text-sm text-white/80">
              <p>{t("newArticlePage.form.cover.previewDescription")}</p>
              <Button
                type="button"
                variant="ghost"
                onClick={clearCoverImage}
                className="w-fit border border-transparent text-rose-200 hover:border-rose-200/30 hover:bg-white/5"
              >
                {t("newArticlePage.form.cover.clear")}
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
          <div className="flex flex-wrap gap-2">
            <ToolbarButton label={t("newArticlePage.form.toolbar.bold")} icon={<Bold className="h-4 w-4" />} onClick={() => exec("bold")} />
            <ToolbarButton label={t("newArticlePage.form.toolbar.italic")} icon={<Italic className="h-4 w-4" />} onClick={() => exec("italic")} />
            <div className="relative" ref={listMenuRef}>
              <button
                type="button"
                onClick={() => setIsListMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10"
              >
                <List className="h-4 w-4" />
                <span>{t("newArticlePage.form.toolbar.bullets")}</span>
              </button>
              {isListMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-3 w-48 rounded-2xl border border-white/15 bg-slate-900/95 p-2 text-sm text-white shadow-2xl backdrop-blur">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
                    onClick={() => applyList("points")}
                  >
                    {t("newArticlePage.form.toolbar.list.points")}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
                    onClick={() => applyList("numbers")}
                  >
                    {t("newArticlePage.form.toolbar.list.numbers")}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
                    onClick={() => applyList("classic")}
                  >
                    {t("newArticlePage.form.toolbar.list.classic")}
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={textPaletteRef}>
              <button
                type="button"
                onClick={() => setIsTextPaletteOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10"
              >
                <Palette className="h-4 w-4" />
                <span>{t("newArticlePage.form.toolbar.textColor")}</span>
                <span
                  className="h-3 w-3 rounded-full border border-white/30"
                  style={{ backgroundColor: selectedTextColor }}
                  aria-hidden
                />
              </button>

              {isTextPaletteOpen && (
                <div className="absolute left-0 top-full z-20 mt-3 w-56 rounded-3xl border border-white/15 bg-slate-900/95 p-4 text-sm text-white shadow-2xl backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{t("newArticlePage.form.toolbar.recent")}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {(recentTextColors.length > 0 ? recentTextColors : textColorPresets).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          selectedTextColor === color ? "border-white" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => applyTextColor(color, { trackHistory: true })}
                        aria-label={t("newArticlePage.form.textColor.apply").replace("{color}", color)}
                      />
                    ))}
                  </div>
                  {recentTextColors.length === 0 && (
                    <p className="mt-2 text-[11px] text-white/50">{t("newArticlePage.form.toolbar.historyEmpty")}</p>
                  )}
                  <label className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-[11px] uppercase tracking-wide text-slate-300">
                    {t("newArticlePage.form.toolbar.customLabel")}
                    <input
                      type="color"
                      value={selectedTextColor}
                      onChange={handleCustomTextColorChange}
                      className="h-8 w-16 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="relative" ref={gifPickerRef}>
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label={t("newArticlePage.form.toolbar.localImage")} icon={<Upload className="h-4 w-4" />} onClick={handleLocalImageClick} />
              <ToolbarButton label={t("newArticlePage.form.toolbar.gifs")} icon={<Film className="h-4 w-4" />} onClick={() => setIsGifPickerOpen((prev) => !prev)} />
            </div>
            {isGifPickerOpen && (
              <div className="absolute left-0 top-full z-30 mt-3 w-[min(420px,80vw)] rounded-3xl border border-white/15 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur">
                <div role="search" aria-label={t("newArticlePage.form.gifs.searchAria")} className="flex items-center gap-2">
                  <Input
                    placeholder={t("newArticlePage.form.gifs.searchPlaceholder")}
                    value={gifQuery}
                    onChange={(event) => setGifQuery(event.target.value)}
                    onKeyDown={handleGifInputKeyDown}
                    className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={triggerGifSearch}
                  >
                    {t("newArticlePage.form.gifs.searchButton")}
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {isGifLoading && <p className="col-span-3 text-center text-xs text-slate-300">{t("newArticlePage.form.gifs.loading")}</p>}
                  {!isGifLoading &&
                    gifResults.map((gif) => (
                      <button
                        type="button"
                        key={gif.id}
                        className="overflow-hidden rounded-xl border border-white/10"
                        onClick={() => handleGifSelect(gif)}
                      >
                        <Image
                          src={gif.previewUrl}
                          alt={t("newArticlePage.form.gifs.alt")}
                          width={160}
                          height={100}
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    ))}
                  {!isGifLoading && gifResults.length === 0 && (
                    <p className="col-span-3 text-center text-xs text-slate-300">{t("newArticlePage.form.gifs.empty")}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          ref={editorRef}
          contentEditable
          className="min-h-80 rounded-3xl border border-white/10 bg-white/10 p-6 text-base text-white outline-none"
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
        />
        <p
          className={`text-xs ${
            contentChars < MIN_CONTENT_CHARS && isSubmitted ? "text-rose-200" : "text-slate-400"
          }`}
        >
          {t("newArticlePage.form.counter")
            .replace("{current}", String(contentChars))
            .replace("{min}", String(MIN_CONTENT_CHARS))}
        </p>
      </div>

      {message && <FormMessage type={isError ? "error" : "success"} message={message} />}
      <input type="hidden" {...register("coverImage")} />

      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("newArticlePage.form.submit")}
      </Button>
    </form>
  );
}

type ToolbarButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  sampleColor?: string;
};

function ToolbarButton({ label, icon, onClick, sampleColor }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10"
    >
      {icon}
      <span>{label}</span>
      {sampleColor && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sampleColor }} aria-hidden />}
    </button>
  );
}
