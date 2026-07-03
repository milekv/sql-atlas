import { ShieldCheck } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectInput } from "../../components/ui/Field";
import type { Language, ThemeMode } from "../../types";

export const SettingsPage = () => {
  const { language, setLanguage, theme, setTheme, t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              {t("actions.language")}
            </label>
            <SelectInput
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="w-full"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
            </SelectInput>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("actions.theme")}</p>
            <div className="flex gap-2">
              {(["dark", "light"] as ThemeMode[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={theme === item ? "primary" : "secondary"}
                  onClick={() => setTheme(item)}
                >
                  {item === "dark" ? t("actions.dark") : t("actions.light")}
                </Button>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="text-atlas-green" />
            <div>
              <h2 className="text-xl font-semibold">{t("settings.privacyTitle")}</h2>
              <p className="mt-2 leading-7 text-atlas-muted">
                {t("settings.privacyBody")}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
