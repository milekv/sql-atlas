import { Database } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { cn } from "../../lib/cn";
import { navigationItems } from "./navigation";

export const Sidebar = () => {
  const { page, setPage, t } = useApp();

  return (
    <aside className="border-r border-atlas-border bg-atlas-panel/95 lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-16 items-center gap-3 border-b border-atlas-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-atlas-cyan/50 bg-atlas-cyan/15">
          <Database size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-atlas-text">
            {t("app.name")}
          </p>
          <p className="truncate text-xs text-atlas-muted">{t("app.promise")}</p>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.page;

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => setPage(item.page)}
              className={cn(
                "flex h-10 min-w-max items-center gap-3 rounded-md border px-3 text-sm transition lg:w-full",
                active
                  ? "border-atlas-cyan/60 bg-atlas-cyan/15 text-atlas-text"
                  : "border-transparent text-atlas-muted hover:bg-atlas-panelStrong hover:text-atlas-text",
              )}
            >
              <Icon size={17} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
