# API

## Public

- `GET /api/products`: liefert nur aktive Produkte, sortiert nach `sort_order` und Name. Felder: `id`, `name`, `description`, `price`, `image_url`.
- `POST /api/orders` mit optionalem `Idempotency-Key`; Rate-Limit: 10 Bestellungen pro 10 Minuten und Client-IP.
- `GET /api/public/tickets/{token}`: liefert nur oeffentliche Ticketdaten, keine interne ID und keinen Token. Zusaetzlich enthalten sind eine formatierte `ticket_number`, `status_changed_at`, Positions-Snapshots und `total_price`.
- `GET /api/public/tickets/{token}/messages`

## Auth

- `POST /api/auth/login`: setzt HttpOnly-Session-Cookie und CSRF-Cookie; Rate-Limit: 5 Fehlversuche pro Minute und Client-IP.
- `GET /api/auth/me`
- `POST /api/auth/logout`: benoetigt `X-CSRF-Token`.

## Staff

- `GET /api/staff/tickets?status=&search=&page=&page_size=`: liefert Listenitems mit letzter Aktivitaet und `has_unread_customer_message`.
- `GET /api/staff/tickets/{id}`: liefert interne Staff-Details ohne privaten Public-Token.
- `PATCH /api/staff/tickets/{id}/status`: benoetigt `X-CSRF-Token`, speichert Statushistorie und Systemnachricht und sendet erst danach das `status_changed`-WebSocket-Event.
- `GET /api/staff/tickets/{id}/messages`

### Staff-Produkte

Alle Staff-Produktendpunkte verlangen einen gueltigen Mitarbeiter-Login mit Rolle `owner` oder `admin`. Schreibende Aktionen benoetigen zusaetzlich `X-CSRF-Token`.

- `GET /api/staff/products?search=&active=&page=&page_size=`: liefert aktive und inaktive Produkte fuer die Verwaltung. `active` akzeptiert `true` oder `false`; ohne Filter werden alle Produkte geliefert.
- `GET /api/staff/products/{product_id}`: liefert ein Produkt inklusive `is_active`, `sort_order`, `created_at`, `updated_at`.
- `POST /api/staff/products`: erstellt ein Produkt.
- `PATCH /api/staff/products/{product_id}`: aktualisiert einzelne Felder; auch Aktivieren/Deaktivieren laeuft ueber diesen Endpunkt.

Listenformat:

```json
{"items":[],"page":1,"page_size":25,"total":0}
```

Validierung: Name ist Pflicht und maximal 120 Zeichen lang, Beschreibung maximal 2000 Zeichen, Preis ist ein `Decimal` von 0 bis 999999.99 mit maximal zwei Nachkommastellen, Bild-URL ist optional und muss `http` oder `https` nutzen, `sort_order` liegt zwischen -10000 und 10000. Leere Bild-URL wird als `null` gespeichert.

## Admin

- `GET /api/admin/stats?from_date=&to_date=`: liefert Ticketzaehler fuer Gesamt und alle Status plus `total_revenue` als Dezimalstring. Ohne Datumsfilter kommen die persistenten Allzeitwerte aus `ticket_stats`; mit `from_date` und/oder `to_date` werden aktuelle Tickets nach `created_at` im Zeitraum gezaehlt und der Umsatz aus den gespeicherten Positionspreisen berechnet.

## WebSockets

- `WS /ws/tickets/{public_token}` fuer Kunden.
- `WS /ws/staff/tickets/{ticket_id}` fuer eingeloggte Mitarbeiter.

Ausgehende Events:

```json
{"type":"chat_message","data":{"id":1,"ticket_id":1,"sender_type":"customer","message":"Hallo","created_at":"2026-07-02T18:00:00"}}
{"type":"status_changed","data":{"ticket_id":1,"old_status":"open","new_status":"in_progress","message":"Status geaendert: open -> in_progress","created_at":"2026-07-02T18:01:00"}}
{"type":"error","data":{"message":"Dieses Ticket ist abgeschlossen. Der Chat ist nur noch lesbar."}}
```

Eingehende Chat-Nachrichten sind JSON mit `message` und maximal 2000 Zeichen. Abgeschlossene Tickets (`completed`, `not_completed`) akzeptieren keine neuen Chatnachrichten.
