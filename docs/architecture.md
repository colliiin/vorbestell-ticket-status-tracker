# Architektur

Die Anwendung bleibt ein bewusst schlanker Monolith mit vier Docker-Services:

```text
Internet -> Caddy :80/:443
  /api/* -> FastAPI
  /ws/*  -> FastAPI WebSockets
  /*     -> React SPA via Nginx
FastAPI -> PostgreSQL
```

Nur Caddy veroeffentlicht Ports. Backend, Frontend und PostgreSQL kommunizieren intern ueber das Compose-Netzwerk.

## Backend-Struktur

`app/main.py` konfiguriert nur die FastAPI-App. Modelle, Schemas, Routen, Services, Security und WebSocket-Manager liegen in eigenen Paketen. Geschaeftslogik fuer Bestellung, Tickets, Chat, Statistik und Produktverwaltung liegt in Services.

Public- und Staff-Ticket-Schemas sind getrennt. Kundenantworten enthalten keine interne ID und keinen Token, sondern eine formatierte Ticketnummer sowie Tracker-Metadaten und den aus Positions-Snapshots berechneten Gesamtpreis. Staff-Details bleiben intern. WebSocket-Ausgaben verwenden feste Event-Typen, damit das Frontend Statuswechsel und Fehler stabil behandeln kann.

Produkte sind ebenfalls in Public- und Staff-Sichten getrennt. `routes/products.py` liefert nur aktive oeffentliche Produkte. `routes/staff_products.py` ist serverseitig fuer `owner` und `admin` geschuetzt und nutzt `ProductService` fuer Suche, Aktivfilter, Pagination, Erstellen und Aktualisieren. Deaktivieren ist eine normale Produktaktualisierung von `is_active`; es gibt im MVP keinen Hard-Delete-Endpunkt fuer Produkte.

## Frontend-Struktur

`src/main.tsx` rendert `App` im AuthProvider. Seiten, Komponenten, API-Clients und Hooks sind getrennt. Das Dashboard enthaelt Tickets, Statistik und Produktverwaltung. Die private Kundenansicht kombiniert den wiederverwendbaren `TicketStatusTracker`, die Bestellzusammenfassung und den bestehenden Chat. Die Statistik nutzt einfache CSS-Grafiken und haelt Zeitraumfilter als Query-Parameter in der URL. Die Produktverwaltung nutzt eigene Komponenten fuer Liste, Status-Badge, Bildvorschau und Formular; die URL haelt Suche, Aktivfilter und Seite als Query-Parameter.

Der Chat verwendet einen typisierten `useChat`-Hook, dedupliziert empfangene Nachrichten, stoppt Reconnects bei Auth-/Origin-Fehlern und zeigt abgeschlossene Tickets als read-only an. Derselbe Hook leitet `status_changed`-Ereignisse inklusive Aenderungszeit an den Kunden-Tracker weiter; es wird keine zweite WebSocket-Verbindung aufgebaut.

## Laufzeitgrenzen

ConnectionManager und Rate-Limits liegen im Speicher der Backend-Instanz. Das ist fuer das MVP lokal einfach und schnell, aber nicht horizontal skalierbar. Fuer mehrere Backend-Instanzen sollten WebSocket-Broadcasts und Rate-Limits ueber Redis oder einen vergleichbaren zentralen Dienst laufen.
