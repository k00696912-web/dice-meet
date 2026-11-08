#!/bin/bash

# DiceMeet 项目启动脚本

NODE_PATH="/c/Users/lenovo/.box-agent-kanshan/box-agent-runtime/runtimes/node/versions/node-v24.15.0-win-x64"
export PATH="$NODE_PATH:$PATH"

cd "$(dirname "$0")"

case "$1" in
    install)
        echo "Installing dependencies..."
        node "$NODE_PATH/node_modules/npm/bin/npm-cli.js" install
        ;;
    dev)
        echo "Starting development server..."
        echo "Open http://localhost:3000"
        npx next dev
        ;;
    build)
        echo "Building for production..."
        npx next build
        ;;
    *)
        echo "Usage: ./run.sh [install|dev|build]"
        echo ""
        echo "  install  - Install dependencies"
        echo "  dev      - Start development server"
        echo "  build    - Build for production"
        ;;
esac
