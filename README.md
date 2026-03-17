# 🚗 Fahrzeug-Programmierer

Web-App für die Lego-Fahrzeug-AG. Lehrer erstellt Spielfelder, Schüler programmieren ihr Fahrzeug im Browser.

## Starten

```bash
cd fahrprogramm
npm install        # einmalig
bash start.sh      # Server starten
```

Oder direkt:
```bash
node server.js
```

## URLs

| Wer | URL |
|-----|-----|
| Lehrer | `http://[IP]:3000/lehrer` |
| Schüler | `http://[IP]:3000/schueler/[name]` |

Die Schüler-URLs und QR-Codes werden automatisch im Lehrer-Interface generiert.

## Funktionen

### Lehrer-Interface (`/lehrer`)

**Tab: Spielfeld-Editor**
- Rasterfeld 4×4 bis 16×16
- Werkzeuge: Start, Ziel (★), Hindernisse, Farbfelder (Rot/Blau/Grün/Gelb), Löschen
- Linksklick = platzieren, Rechtsklick = löschen, Gedrückt halten = malen
- „Spielfeld freigeben" → alle verbundenen Schüler erhalten sofort das neue Feld

**Tab: Schüler-Verwaltung**
- Schüler anlegen → automatisch eindeutiger Link + QR-Code
- Link per Klick in Zwischenablage kopieren
- Reset-Button: setzt das Auto eines Schülers auf Startposition zurück
- Schüler löschen

**Tab: Live-Monitor**
- Alle Schüler als Miniatur-Karten in Echtzeit
- Zeigt: aktuelle Auto-Position, Programm-Blöcke, Status
- Klick auf Karte → Detailansicht (großes Feld + komplettes Programm)

### Schüler-Interface (`/schueler/[name]`)
- Bausteine per Klick hinzufügen: Vorwärts, Rückwärts, Links/Rechts drehen, Stopp, Warten
- Schrittanzahl mit +/− einstellen
- Programm starten → Auto fährt animiert
- Tempo-Regler (1–5)
- Spielfeld kommt automatisch vom Lehrer (kein Laden nötig)

## Technologie
- **Backend:** Node.js, Express, Socket.io
- **QR-Codes:** qrcode (npm)
- **Frontend:** Vanilla HTML/CSS/JS, Canvas
- **Daten:** In-Memory (kein Datenbankserver nötig)

## Netzwerk
Alle Geräte müssen im gleichen WLAN sein. Der Server läuft auf Port 3000.
Firewall ggf. anpassen: `sudo ufw allow 3000`
