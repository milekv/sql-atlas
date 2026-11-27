<p align="center"><img src="docs/assets/banner.svg" alt="SQL Atlas: lokalna diagnostyka SQL i analiza planów wykonania" width="100%"></p>

# SQL Atlas

**Znajdź problemy w zapytaniu i sprawdź jego plan wykonania.** SQL Atlas oferuje lokalną diagnostykę w VS Code, CI, terminalu i przeglądarce oraz przegląd planów PostgreSQL, SQL Server i Oracle. Nie wymaga połączenia z bazą ani konta w usłudze AI.

[English](README.md) · [Polski](README.pl.md) · [Demo](https://milekv.github.io/sql-atlas/) · [npm](https://www.npmjs.com/package/sql-atlas) · [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Milosz.sql-atlas) · [GitHub Action](https://github.com/marketplace/actions/sql-atlas)

[![CI](https://github.com/milekv/sql-atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/milekv/sql-atlas/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/sql-atlas)](https://www.npmjs.com/package/sql-atlas) [![MIT](https://img.shields.io/badge/license-MIT-249b73)](LICENSE)

> **Stan wydań:** Demo w przeglądarce odpowiada gałęzi `main`. Opublikowany pakiet npm i tag GitHub Action mają wersję 0.8.0; rozszerzenie w VS Code Marketplace jest wydawane osobno i może być starsze od kodu w repozytorium. Przed użyciem nowej funkcji sprawdź wersję na danej platformie. Projekt nie jest wydaniem 1.0.

## Wypróbuj

```bash
npx --yes sql-atlas@0.8.0 analyze examples/safe-query.sql --dialect postgresql
```

Możesz też otworzyć [demo w przeglądarce](https://milekv.github.io/sql-atlas/), wybrać dialekt i wkleić zapytanie. Kliknięcie problemu przenosi do odpowiedniej linii kodu. W **Wizualizatorze EXPLAIN** zaimportujesz plan PostgreSQL w JSON, SQL Server w Showplan XML albo tekst Oracle DBMS_XPLAN. Aby uruchomić aplikację lokalnie, wykonaj `npm ci && npm run dev` i otwórz adres pokazany przez Vite.

```sql
SELECT * FROM users WHERE LOWER(email) LIKE '%example.com';
```

Analizator oznacza `SELECT *`, funkcję na filtrowanej kolumnie oraz znak `%` na początku wzorca. Każde trafienie prowadzi do miejsca w kodzie i wyjaśnia, co warto sprawdzić. To, czy zmiana warunku lub indeks pomoże, zależy od schematu, danych i planu wykonania. SQL Atlas **nie wykonuje** tego zapytania.

## W przeglądarce

Zrzuty wykonano w Chromium z bieżącej wersji kodu uruchomionej lokalnie. Te same funkcje są dostępne w publicznym demo.

| Diagnostyka zapytań i przejście do kodu | Plan SQL Server Showplan XML |
| --- | --- |
| ![Analizator SQL ze znacznikami Monaco i zaleceniami](public/screenshots/query-analyzer-pl.png) | ![Zaimportowany plan SQL Server z drzewem i szczegółami operatora](public/screenshots/sql-server-showplan.png) |

[Kandydaci na indeksy](public/screenshots/index-advisor.png) · [PostgreSQL EXPLAIN](public/screenshots/postgresql-explain.png) · [Angielski analizator](public/screenshots/query-analyzer.png)

Aby przeanalizować plan, wczytaj wynik `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` z PostgreSQL, plik `.sqlplan` z SQL Server albo tekst zwrócony przez Oracle `DBMS_XPLAN.DISPLAY_CURSOR`. Wybierz operator, aby zobaczyć metryki i predykaty **obecne w planie**. Liczba wierszy oszacowana przez optymalizator i liczba rzeczywiście odczytanych wierszy to różne dane; plan szacowany nie zawiera liczników wykonania. [Przewodnik po planach](docs/PLAN_FORMATS.md) opisuje obsługiwane dane i przykłady.

## Dostępne narzędzia

| Miejsce użycia | Działanie w bieżącym kodzie |
| --- | --- |
| Przeglądarka | Diagnostyka Monaco z nawigacją do kodu, kandydaci na indeksy, baza wiedzy, PostgreSQL EXPLAIN JSON, SQL Server Showplan XML, tekst Oracle DBMS_XPLAN i osobny import STATISTICS IO/TIME, wizualizacja DDL PostgreSQL; interfejs polski i angielski. |
| CLI | Lokalna analiza pliku lub stdin; raporty tekstowe, JSON, Markdown i SARIF; ustawienia języka, dialektu i progów. |
| VS Code | Diagnostyka w edytorze i panelu Problemy, wybór języka, filtrowanie ważności, szybka poprawka wyciszająca regułę w pliku. |
| GitHub Action | Adnotacje przy plikach SQL, podsumowanie zadania i progi powodujące niepowodzenie kontroli PR. |

Import Showplan pokazuje drzewo operatorów, estymacje, zgłoszone liczniki dla poszczególnych wątków, nazwy obiektów, pamięć i wybrane ostrzeżenia. Można wczytać drugi plan do porównania struktury; różne wartości `QueryHash` są sygnalizowane. Narzędzie nie wyprowadza czasu wykonania z kosztu optymalizatora ani przyczyny spowolnienia z samej nazwy operatora. Szczegóły: [formaty planów i próbki](docs/PLAN_FORMATS.md).

| Dialekt wejściowego SQL | Reguły statyczne | Import planu |
| --- | --- | --- |
| PostgreSQL | Tak, heurystyczne | EXPLAIN JSON |
| SQL Server / T-SQL | Tak, heurystyczne | Showplan XML i osobno komunikaty IO/TIME |
| Oracle | Tak, heurystyczne | Import tekstu DBMS_XPLAN (jeden plan) |
| MySQL, SQLite, ogólny | Tak, heurystyczne | Jeszcze niedostępny |

Wybór dialektu nie oznacza pełnego parsera wszystkich rozszerzeń danego silnika. Silnik reguł używa maskowania leksykalnego i wybranych wzorców; złożone bloki proceduralne i zagnieżdżenia wymagają przeglądu człowieka.

## Instalacja i integracja

CLI:

```bash
npm install --save-dev sql-atlas@0.8.0
npx sql-atlas analyze 'migrations/**/*.sql' --dialect postgresql --format sarif --output sql-atlas.sarif
```

Konfigurację progów i wyciszeń opisuje [przewodnik CLI i Action](docs/INTEGRATIONS.md). Kody zakończenia CLI: `0` oznacza powodzenie, `1` przekroczenie skonfigurowanego progu, `2` błąd wejścia lub konfiguracji.

GitHub Actions (opublikowany tag):

```yaml
name: SQL review
on: [pull_request]
permissions:
  contents: read
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: milekv/sql-atlas@v0.8.0
        with:
          paths: '**/*.sql'
          dialect: postgresql
          fail-on: critical
```

Zainstaluj [SQL Atlas dla VS Code](https://marketplace.visualstudio.com/items?itemName=Milosz.sql-atlas) albo zbuduj rozszerzenie z kodu poleceniem `npm run package:vscode`. Przeglądarka, CLI, Action i rozszerzenie współdzielą reguły analizatora w repozytorium; publikowane wersje mogą być starsze.

## Zastosowanie w pracy

- Kontroluj migracje w CI i przechodź do dokładnej pozycji znalezionego problemu.
- Sprawdź podejrzany filtr dat lub szeroki odczyt, a potem porównaj alternatywne zapytania na reprezentatywnej bazie.
- Importuj wynik PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` lub plik SQL Server `.sqlplan` do lokalnej aplikacji.
- Czytaj tekstowy plan Oracle `DBMS_XPLAN`, w tym predykaty i uwagi do operatorów; wnioski potwierdź w bazie i na reprezentatywnym obciążeniu.
- Wklej komunikaty SQL Server `SET STATISTICS IO/TIME` jako osobne pomiary. Nie zakładaj, że pochodzą z tego samego wykonania co zaimportowany plan.

[Benchmark filtra dat PostgreSQL](benchmarks/postgresql/README.md) zawiera odtwarzalny scenariusz serwerowy oraz [pomiar w PGlite WASM](benchmarks/postgresql/pglite-0.6.0-measurement.json) na 200 000 syntetycznych wierszy. W tym pomiarze oba warianty zapytania zwróciły ten sam zbiór z uwzględnieniem powtórzeń: 49 894 identyfikatory; zapisano sześć planów i pomiarów czasu. PGlite jest osadzonym PostgreSQL, więc te czasy nie opisują wydajności serwera produkcyjnego. [Scenariusz SQL Server](benchmarks/sqlserver/README.md) jest przygotowany dla testowej instancji; nie ma jeszcze pomiarów SQL Server.

## Prywatność i ograniczenia

Analizator i wizualizator działają lokalnie w przeglądarce lub na Twoim komputerze albo runnerze CI. Projekt nie wymaga backendu, konta ani AI. Aplikacja nie wysyła wklejonego SQL lub planów do usługi analizującej. Plany mogą zawierać nazwy obiektów, treść zapytań i literały; traktuj je jako dane poufne. Publiczne demo pobiera zasoby statyczne z GitHub Pages.

Ocena statyczna mierzy trafienia reguł, **nie** czas wykonania, bezpieczeństwo ani poprawność. Sugestie indeksów nie znają istniejącego schematu, kosztu zapisu ani rozkładu danych. Przykłady zmian SQL wymagają sprawdzenia semantyki. [Stan implementacji](docs/IMPLEMENTATION_STATUS.md) podaje wyniki testów i otwarte problemy.

## Architektura i rozwój

```mermaid
flowchart TD
  C["Wspólny analizator i reguły"] --> W["Przeglądarka i Monaco"]
  C --> V["VS Code"]
  C --> L["CLI i raporty"]
  C --> A["GitHub Action"]
  P["PostgreSQL JSON / SQL Server XML + IO/TIME / Oracle DBMS_XPLAN"] --> W
```

Wymagane są Node.js 20+ i npm. Uruchom `npm ci`, `npm test`, `npm run typecheck` i `npm run build`. Aplikacja przeglądarkowa jest w `src/features`, wspólne parsery i reguły w `src/core`, adaptery w `src/{cli,action,vscode}`, a testy w `src/tests`. Zobacz [architekturę](ARCHITECTURE.md), [zasady współtworzenia](CONTRIBUTING.md), [plan rozwoju](ROADMAP.md), [bezpieczeństwo](SECURITY.md), [przewodnik integracji](docs/INTEGRATIONS.md) i [proces wydania](docs/RELEASING.md). Zgłoszenie błędu powinno zawierać minimalny przykład SQL lub plan bez danych poufnych, dialekt oraz wynik oczekiwany i otrzymany.

## Licencja

[MIT](LICENSE). Przykładowy plan Microsoftu ma osobną [informację o licencji MIT](docs/THIRD_PARTY_NOTICES.md).
