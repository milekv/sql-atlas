import { Network } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { Card } from "../../components/ui/Card";

export const SchemaVisualizerPage = () => {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("schema.title")} subtitle={t("schema.subtitle")} />
      <Card className="flex min-h-72 flex-col items-center justify-center text-center">
        <Network size={42} className="text-atlas-cyan" />
        <p className="mt-4 max-w-2xl text-atlas-muted">{t("schema.placeholder")}</p>
      </Card>
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
