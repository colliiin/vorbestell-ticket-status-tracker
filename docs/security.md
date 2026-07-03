# Sicherheit

- Sessions sind zeitlich begrenzt und mit `URLSafeTimedSerializer` signiert.
- Session-Cookie ist HttpOnly; `Secure` ist in Produktion Pflicht.
- Schreibende Staff-Aktionen nutzen einen CSRF-Double-Submit-Token.
- Rollen werden serverseitig geprueft; Admin-Statistiken sind nur fuer `admin`, Produktverwaltung ist fuer `owner` und `admin`.
- Der initiale Admin wird per CLI erstellt, nicht beim App-Start.
- `APP_ENV=production` erzwingt starke Session-Secrets, sichere Cookies, echte Domain und explizite Origins ohne Wildcard oder localhost.
- CORS akzeptiert nur konfigurierte Origins und keine Wildcard mit Credentials.
- Login und Bestellungen sind durch einfache In-Memory-Rate-Limits begrenzt.
- Private Ticketlinks bleiben im MVP Zugriffsschluessel. Jeder mit Link kann das Ticket oeffnen.
- Public-Ticket-Antworten enthalten keine interne Ticket-ID und keinen Public-Token.
- Staff-Ticketlisten zeigen neue Kundennachrichten ueber `has_unread_customer_message`, ohne private Tokens offenzulegen.
- Nicht eingeloggte Benutzer koennen nur die oeffentliche Produktliste abrufen. Staff-Produktliste, Produktanlage und Produktaenderungen verlangen Login; POST/PATCH verlangen zusaetzlich CSRF.
- Produktvalidierung passiert serverseitig: getrimmter nicht leerer Name, Decimal-Preis ohne NaN/Infinity und mit maximal zwei Nachkommastellen, optionale `http`-/`https`-Bild-URL, begrenzte Sortierreihenfolge und Boolean-Aktivstatus.
- Deaktivieren statt Loeschen verhindert, dass bestehende Ticketpositionen ihre Produktreferenz verlieren. Alte Ticket-Snapshots bleiben unveraendert.
- WebSocket-Verbindungen mit ungueltiger Origin, Session oder Ticket-ID werden akzeptiert und direkt mit einem klaren Close-Code geschlossen, damit das Backend nicht dauerhaft HTTP-403-Spam loggt.
- Der In-Memory-WebSocket-Manager und der In-Memory-Rate-Limiter sind nur fuer eine Backend-Instanz geeignet.
