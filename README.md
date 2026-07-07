# Vorbestell-Ticket-MVP

Responsive MVP fuer Produkt-Vorbestellungen mit automatischer Ticketanlage, Staff-Bereich und Live-Chat.

## Voraussetzungen

- Docker Desktop
- Docker Compose

## Lokal starten

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

Lokal ist die Anwendung unter `http://localhost` erreichbar. Der Staff-Bereich liegt unter `http://localhost/login` und nach dem Login unter `http://localhost/dashboard`.

## Migrationen und Demo-Daten

Das Backend fuehrt beim Containerstart kontrolliert aus:

```bash
alembic upgrade head
```

Manuell:

```bash
docker compose exec backend alembic upgrade head
```

Die Initialmigration legt nur das Schema an. Demo-Produkte werden nicht mehr automatisch migriert, sondern explizit geseedet:

```bash
docker compose exec backend python -m app.cli.seed_demo_data
```

Bestehende lokale MVP-Datenbanken, die noch per `create_all()` erstellt wurden, werden beim ersten Start auf die Initialrevision gestempelt. Neue Datenbanken werden ueber Alembic angelegt.

## Initialen Admin erstellen

Es wird kein Admin automatisch aus Standardpasswoertern erzeugt. Erstelle Benutzer explizit:

```bash
docker compose exec backend python -m app.cli.create_admin --username admin --role admin
```

Das Passwort wird interaktiv abgefragt. Alternativ fuer lokale Tests:

```bash
docker compose exec backend python -m app.cli.create_admin --username owner --role owner --password sehr-langes-passwort
```

## Tests

Backend:

```bash
docker compose exec backend python -m pytest
```

Frontend:

```bash
docker build --target build -t vorbestell-frontend-test ./frontend
docker run --rm vorbestell-frontend-test npm run test -- --run
```

E2E-Smoke-Tests mit Playwright laufen gegen die bereits gestartete lokale Anwendung unter `http://localhost`.

Testbenutzer einmalig anlegen:

```bash
docker compose exec backend python -m app.cli.create_admin --username e2e-admin --role admin --password sehr-langes-e2e-passwort --ignore-existing
```

PowerShell:

```powershell
$env:E2E_ADMIN_USERNAME="e2e-admin"
$env:E2E_ADMIN_PASSWORD="sehr-langes-e2e-passwort"
```

Bash:

```bash
export E2E_ADMIN_USERNAME=e2e-admin
export E2E_ADMIN_PASSWORD=sehr-langes-e2e-passwort
```

Playwright lokal installieren und ausfuehren:

```bash
cd frontend
npm ci
npx playwright install chromium
npm run test:e2e
```

Headed-Modus:

```bash
npm run test:e2e:headed
```

Bei Fehlern speichert Playwright Screenshots, Videos bei Fehlern und Traces beim ersten Retry unter `frontend/test-results/`. Der Smoke-Test verwendet eindeutig markierte `E2E Produkt ...`- und `E2E Kunde ...`-Daten. Produkte werden im Cleanup nur anhand des exakten E2E-Namens deaktiviert; normale Produkte werden nicht veraendert und Tickets werden nicht geloescht.

## CI / GitHub Actions

Die GitHub-Actions-CI laeuft bei jedem Push auf `main` und bei Pull Requests gegen `main`. Es gibt keine Deployment-Schritte und keine Produktions-Secrets im Workflow.

Die CI fuehrt diese Jobs aus:

- Backend-Tests mit Python 3.12 und `python -m pytest` im Ordner `backend`.
- Frontend-Tests und Frontend-Build mit Node.js 22, `npm ci`, `npm run test -- --run` und `npm run build` im Ordner `frontend`.
- Einen leichten Docker-Compose-Check mit `docker compose config`.

Die gleichen Pruefungen koennen lokal so ausgefuehrt werden:

```bash
docker compose exec backend python -m pytest
cd frontend
npm ci
npm run test -- --run
npm run build
```

Optionaler Compose-Check:

```bash
docker compose config
```

## Chat und Tickets

WebSocket-Events sind typisiert (`chat_message`, `status_changed`, `error`). Statuswechsel erscheinen live im Kunden- und Staff-Chat. Abgeschlossene Tickets (`completed`, `not_completed`) bleiben lesbar, aber neue Chatnachrichten werden abgelehnt, bis das Ticket wieder geoeffnet wird.

## Statistik

Admins sehen unter `/dashboard/admin` Ticketzaehler, Umsatz, einfache Statusgrafiken und Zeitraumfilter. Ohne Filter zeigt die Seite persistente Allzeitwerte; mit Zeitraumfilter werden aktuelle Tickets nach Erstellungsdatum ausgewertet.

## Produktverwaltung

Eingeloggte Benutzer mit Rolle `owner` oder `admin` verwalten Produkte unter `/dashboard/products`. Produkte koennen erstellt, bearbeitet, aktiviert, deaktiviert, gesucht, gefiltert und sortiert werden. Es gibt in diesem MVP kein regulaeres Hard-Delete fuer Produkte: Stattdessen werden Produkte deaktiviert, damit bestehende Ticketpositionen nachvollziehbar bleiben.

Der oeffentliche Endpunkt `/api/products` liefert nur aktive Produkte, sortiert nach `sort_order` und Name. Deaktivierte Produkte bleiben in der Staff-Verwaltung sichtbar, verschwinden aber aus der oeffentlichen Produktuebersicht und koennen nicht neu bestellt werden. Alte Tickets behalten weiterhin `product_name_snapshot` und `unit_price_snapshot`.

Produktbilder werden als optionale externe `http`-/`https`-Bild-URL gespeichert. Datei-Upload, Bildspeicher, Lagerverwaltung, Varianten, Kategorien und Rabatte gehoeren nicht zum aktuellen MVP. Demo-Produkte werden weiterhin ausschliesslich per `python -m app.cli.seed_demo_data` erzeugt.

## Caddy lokal und Produktion

Lokal verwendet `caddy/Caddyfile` bewusst HTTP fuer `http://localhost`.

Fuer Produktion `caddy/Caddyfile.production.example` als Vorlage verwenden, `DOMAIN=echte-domain.de`, `APP_ENV=production`, `COOKIE_SECURE=true`, explizite `ALLOWED_ORIGINS` und einen starken `SESSION_SECRET` setzen. Die App verweigert unsichere Produktionswerte wie localhost-Domain, Wildcard-Origin oder Platzhalter-Secret.

## Wichtige Sicherheitshinweise

- Kunden haben kein Konto. Der private Ticketlink `/ticket/{public_token}/chat` ist der Zugriffsschluessel.
- Mitarbeitende verwenden ein zeitlich begrenztes, signiertes HttpOnly-Cookie.
- Schreibende Staff-Aktionen verwenden zusaetzlich einen CSRF-Double-Submit-Token.
- Login und Bestellungen haben einfache In-Memory-Rate-Limits.
- Admin-Endpunkte pruefen die Rolle serverseitig.
- Staff-Produktendpunkte erlauben `owner` und `admin`; POST/PATCH benoetigen CSRF.
- Public-Ticket-Antworten geben keine interne ID und keinen Token zurueck.
- Tokens werden in Listen nicht vollstaendig angezeigt und die Mitarbeitersuche sucht nicht ueber private Tokens.

## Chat-Skalierung

Der aktuelle In-Memory-ConnectionManager und die In-Memory-Rate-Limits funktionieren nur sauber mit einer Backend-Instanz. Fuer mehrere Backend-Instanzen waere spaeter Redis Pub/Sub plus ein verteilter Rate-Limiter erforderlich.

## Backups

Vor Produktion regelmaessige PostgreSQL-Backups einrichten, z. B. per `pg_dump` und Hetzner-Volume-/Server-Snapshots.

## Nuetzliche Befehle

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs backend --tail=100
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed_demo_data
docker compose exec backend python -m pytest
```
