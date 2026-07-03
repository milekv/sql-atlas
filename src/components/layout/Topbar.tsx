import { Moon, Sun } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import type { Language, ThemeMode } from "../../types";
import { CommandPalette } from "../command-palette/CommandPalette";
import { Button } from "../ui/Button";
import { SelectInput } from "../ui/Field";

export const Topbar = () => {
  const { language, setLanguage, theme, setTheme, t } = useApp();
  const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

  return (
    <header className="flex min-h-16 flex-col gap-3 border-b border-atlas-border bg-atlas-bg/80 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-atlas-text">{t("app.tagline")}</p>
        <p className="text-xs text-atlas-muted">{t("app.privacy")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CommandPalette />
        <label className="sr-only" htmlFor="language">
          {t("actions.language")}
        </label>
        <SelectInput
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          className="w-28"
        >
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </SelectInput>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setTheme(nextTheme)}
          icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        >
          {theme === "dark" ? t("actions.light") : t("actions.dark")}
        </Button>
      </div>
    </header>
  );
};
