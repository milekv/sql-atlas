import { Command, FileDown, Languages, Moon, Search, Sun } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useApp } from "../../app/AppProvider";
import type { AppPage } from "../../types";
import type { TranslationKey } from "../../i18n/types";
import { cn } from "../../lib/cn";
import { sqlSamples } from "../../samples/sqlSamples";

type CommandSection = "navigation" | "actions" | "samples";

interface PaletteCommand {
  id: string;
  labelKey: TranslationKey;
  section: CommandSection;
  disabled?: boolean;
  icon?: "command" | "download" | "language" | "theme";
  run: () => void | Promise<void>;
}

const sectionLabelKeys: Record<CommandSection, TranslationKey> = {
  navigation: "commandPalette.section.navigation",
  actions: "commandPalette.section.actions",
  samples: "commandPalette.section.samples",
};

const iconByName = {
  command: Command,
  download: FileDown,
  language: Languages,
  theme: Moon,
};

export const CommandPalette = () => {
  const {
    analyzerDialect,
    analyzeCurrentSql,
    language,
    latestAnalysis,
    setAnalyzerSql,
    setLanguage,
    setLatestAnalysis,
    setPage,
    setTheme,
    t,
    theme,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const loadSample = async (sampleId: string) => {
    const sample = sqlSamples.find((item) => item.id === sampleId);

    if (!sample) {
      return;
    }

    const { analyzeQuery } = await import("../../core/analyzer/analyzeQuery");
    setAnalyzerSql(sample.sql);
    setLatestAnalysis(analyzeQuery(sample.sql, analyzerDialect));
    setPage("query-analyzer");
  };

  const navigate = (page: AppPage) => {
    setPage(page);
  };

  const commands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: "analyze-sql",
        labelKey: "commandPalette.analyzeSql",
        section: "actions",
        icon: "command",
        run: () => {
          analyzeCurrentSql();
          setPage("query-analyzer");
        },
      },
      {
        id: "open-knowledge",
        labelKey: "commandPalette.openKnowledge",
        section: "navigation",
        icon: "command",
        run: () => navigate("knowledge-base"),
      },
      {
        id: "open-antipatterns",
        labelKey: "commandPalette.openAntiPatterns",
        section: "navigation",
        icon: "command",
        run: () => navigate("anti-patterns"),
      },
      {
        id: "open-dialect-compare",
        labelKey: "commandPalette.openDialectCompare",
        section: "navigation",
        icon: "command",
        run: () => navigate("dialect-compare"),
      },
      {
        id: "toggle-language",
        labelKey: "commandPalette.toggleLanguage",
        section: "actions",
        icon: "language",
        run: () => setLanguage(language === "en" ? "pl" : "en"),
      },
      {
        id: "toggle-theme",
        labelKey: "commandPalette.toggleTheme",
        section: "actions",
        icon: "theme",
        run: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "load-select-star",
        labelKey: "commandPalette.loadSelectStar",
        section: "samples",
        icon: "command",
        run: () => loadSample("simple-select-star"),
      },
      {
        id: "load-delete",
        labelKey: "commandPalette.loadDelete",
        section: "samples",
        icon: "command",
        run: () => loadSample("dangerous-delete"),
      },
      {
        id: "load-functional-index",
        labelKey: "commandPalette.loadFunctionalIndex",
        section: "samples",
        icon: "command",
        run: () => loadSample("lower-email"),
      },
      {
        id: "export-markdown",
        labelKey: latestAnalysis
          ? "commandPalette.exportMarkdown"
          : "commandPalette.exportUnavailable",
        section: "actions",
        icon: "download",
        disabled: !latestAnalysis,
        run: async () => {
          if (!latestAnalysis) {
            return;
          }

          const { createMarkdownReport } = await import(
            "../../core/report-export/markdownReport"
          );
          await navigator.clipboard.writeText(
            createMarkdownReport({ analysis: latestAnalysis, language, t }),
          );
        },
      },
    ],
    [
      analyzerDialect,
      analyzeCurrentSql,
      language,
      latestAnalysis,
      setAnalyzerSql,
      setLanguage,
      setLatestAnalysis,
      setPage,
      setTheme,
      t,
      theme,
    ],
  );

  const visibleCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter((commandItem) =>
      t(commandItem.labelKey).toLowerCase().includes(normalizedQuery),
    );
  }, [commands, query, t]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  const enabledCommands = visibleCommands.filter((commandItem) => !commandItem.disabled);
  const activeCommand = enabledCommands[activeIndex] ?? enabledCommands[0];

  const runCommand = async (commandItem: PaletteCommand) => {
    if (commandItem.disabled) {
      return;
    }

    await commandItem.run();
    setIsOpen(false);
  };

  const handleModalKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(enabledCommands.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeCommand) {
      event.preventDefault();
      void runCommand(activeCommand);
    }
  };

  const groupedCommands = visibleCommands.reduce<Record<CommandSection, PaletteCommand[]>>(
    (groups, commandItem) => {
      groups[commandItem.section].push(commandItem);
      return groups;
    },
    { navigation: [], actions: [], samples: [] },
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-atlas-border bg-atlas-panelStrong px-3 text-sm text-atlas-muted transition hover:border-atlas-cyan/60 hover:text-atlas-text"
      >
        <Command size={15} />
        <span>{t("commandPalette.title")}</span>
        <kbd className="rounded border border-atlas-border bg-atlas-bg px-1.5 py-0.5 text-[10px] text-atlas-muted">
          {t("commandPalette.shortcutHint")}
        </kbd>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 py-20 backdrop-blur-sm atlas-modal-enter"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-atlas-border bg-atlas-panel shadow-atlas"
            role="dialog"
            aria-modal="true"
            aria-label={t("commandPalette.title")}
            onKeyDown={handleModalKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-atlas-border px-4 py-3">
              <Search size={18} className="text-atlas-cyan" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("commandPalette.placeholder")}
                className="h-9 flex-1 border-0 bg-transparent text-sm text-atlas-text outline-none placeholder:text-atlas-muted"
              />
              <kbd className="rounded border border-atlas-border bg-atlas-bg px-2 py-1 text-xs text-atlas-muted">
                Esc
              </kbd>
            </div>

            <div className="max-h-[460px] overflow-auto p-3">
              {visibleCommands.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-atlas-muted">
                  {t("commandPalette.noResults")}
                </p>
              ) : (
                (Object.keys(groupedCommands) as CommandSection[]).map((section) =>
                  groupedCommands[section].length > 0 ? (
                    <div key={section} className="mb-3 last:mb-0">
                      <p className="mb-2 px-2 text-xs font-semibold uppercase text-atlas-muted">
                        {t(sectionLabelKeys[section])}
                      </p>
                      <div className="space-y-1">
                        {groupedCommands[section].map((commandItem) => {
                          const Icon =
                            commandItem.icon === "theme" && theme === "dark"
                              ? Sun
                              : iconByName[commandItem.icon ?? "command"];
                          const enabledIndex = enabledCommands.findIndex(
                            (item) => item.id === commandItem.id,
                          );
                          const isActive =
                            enabledIndex >= 0 && activeIndex === enabledIndex;

                          return (
                            <button
                              key={commandItem.id}
                              type="button"
                              disabled={commandItem.disabled}
                              onMouseEnter={() => {
                                if (enabledIndex >= 0) {
                                  setActiveIndex(enabledIndex);
                                }
                              }}
                              onClick={() => void runCommand(commandItem)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                                isActive
                                  ? "border-atlas-cyan/60 bg-atlas-cyan/10 text-atlas-text"
                                  : "border-transparent text-atlas-muted hover:bg-atlas-panelStrong hover:text-atlas-text",
                              )}
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-atlas-border bg-atlas-bg">
                                <Icon size={16} />
                              </span>
                              <span>{t(commandItem.labelKey)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
