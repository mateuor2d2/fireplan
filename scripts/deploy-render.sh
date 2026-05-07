#!/bin/bash
# Script de deploy manual a Render
# Uso: ./scripts/deploy-render.sh

set -e

echo "=========================================="
echo "  DEPLOY MANUAL A RENDER - PREVENIUS"
echo "=========================================="
echo ""

# Verificar que estamos en main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "ERROR: No estás en la rama main. Actual: $CURRENT_BRANCH"
    echo "Cambiate a main: git checkout main"
    exit 1
fi

# Verificar que no hay cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Hay cambios sin commit. Haz commit primero:"
    git status --short
    exit 1
fi

# Hacer push a GitHub
echo "1. Haciendo push a GitHub..."
git push origin main
echo "   ✅ Push completado"
echo ""

# Deploy a Render via CLI (si está instalado) o instrucciones manuales
if command -v render &> /dev/null; then
    echo "2. Deploy a Render via CLI..."
    render deploy --service prevenius
    echo "   ✅ Deploy iniciado"
else
    echo "2. Render CLI no instalado. Deploy manual requerido:"
    echo "   Ve a: https://dashboard.render.com/web/srv-prevenius"
    echo "   Haz clic en 'Manual Deploy' → 'Deploy latest commit'"
fi

echo ""
echo "=========================================="
echo "  DEPLOY COMPLETADO"
echo "=========================================="
