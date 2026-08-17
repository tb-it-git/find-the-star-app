#!/bin/bash
# Fahrzeug-Programmierer starten

echo ""
echo "🚗  Fahrzeug-Programmierer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Eigene IP ermitteln
IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I | awk '{print $1}')
PORT=${PORT:-4000}

echo ""
echo "👩‍🏫  Lehrer-URL:   http://${IP}:${PORT}/lehrer"
echo "📱   Schüler-URLs werden im Lehrer-Interface generiert"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node server.js
