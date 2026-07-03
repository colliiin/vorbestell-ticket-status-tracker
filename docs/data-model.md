# Datenmodell

Alembic verwaltet die Tabellen:

- `users`: Mitarbeiterkonten mit Rolle `owner` oder `admin`.
- `products`: Produktstamm mit `name`, `description`, `price`, optionaler `image_url`, `is_active`, `sort_order`, `created_at`, `updated_at`. Demo-Produkte werden per `python -m app.cli.seed_demo_data` erzeugt, nicht per Migration.
- `tickets`: privater Token, Kundenname, Status sowie Zeitpunkte fuer letzte Kunden- und Staff-Aktivitaet.
- `ticket_items`: Bestellpositionen mit Produktname- und Preis-Snapshot.
- `chat_messages`: persistente Chat- und Systemnachrichten.
- `ticket_status_history`: Audit-Trail fuer Statuswechsel.
- `idempotency_keys`: Schutz gegen doppelte Bestellverarbeitung.

Indizes und Constraints: eindeutiger Benutzername, eindeutiger `public_token`, eindeutiger Idempotency-Key, Statusindex und Ticket-Beziehungsindizes.

Status `completed` und `not_completed` schliessen den Chat fuer neue Nachrichten. Die Historie und vorhandene Nachrichten bleiben lesbar.

Produkte werden im MVP nicht regulaer hart geloescht. Deaktivierte Produkte bleiben in `products` erhalten und koennen spaeter wieder aktiviert werden. Der oeffentliche Produktendpunkt und die Bestellanlage beruecksichtigen nur `is_active=True`.

`ticket_items` speichert `product_name_snapshot` und `unit_price_snapshot`. Dadurch behalten alte Tickets den damaligen Produktnamen und Preis, auch wenn das Produkt spaeter umbenannt, verteuert oder deaktiviert wird. Produktaktionen veraendern `ticket_stats` nicht.

Die Admin-Statistik verwendet ohne Zeitraumfilter die persistenten Zaehler in `ticket_stats`, inklusive `total_revenue_cents` fuer den Allzeit-Umsatz. Mit `from_date` und/oder `to_date` zaehlt sie dagegen aktuelle Zeilen aus `tickets` anhand von `created_at` und berechnet den Umsatz aus `ticket_items`; bereits geloeschte Tickets erscheinen daher nur noch in den Allzeitwerten.

Es gibt aktuell keine Lagerverwaltung, keine automatische Bestandsreduzierung, keine Kategorien, keine Varianten und keinen Datei-Upload fuer Produktbilder. Bild-URLs sind externe `http`-/`https`-Adressen.
