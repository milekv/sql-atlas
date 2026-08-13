const escapeData = (value: string): string =>
  value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

const escapeProperty = (value: string): string =>
  escapeData(value).replace(/:/g, "%3A").replace(/,/g, "%2C");

export const annotation = ({
  file,
  level,
  line,
  message,
  title,
}: {
  file: string;
  level: "error" | "warning" | "notice";
  line?: number;
  message: string;
  title: string;
}): string =>
  `::${level} file=${escapeProperty(file)}${line === undefined ? "" : `,line=${line}`},title=${escapeProperty(title)}::${escapeData(message)}`;

export const outputLine = (name: string, value: string | number): string =>
  `${name}=${String(value)}\n`;
