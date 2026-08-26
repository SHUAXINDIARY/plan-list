#!/usr/bin/env bash

# 任何错误、未定义变量或管道失败都会立即停止，避免只完成部分子模块更新。
set -euo pipefail

# 以脚本所在的父仓库为准，支持从任意工作目录调用该脚本。
SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(git -C "$SCRIPT_DIRECTORY" rev-parse --show-toplevel)"

cd "$REPOSITORY_ROOT"

if [[ ! -f ".gitmodules" ]]; then
    printf '当前仓库没有配置 Git 子模块。\n'
    exit 0
fi

printf '同步子模块远端地址...\n'
git submodule sync --recursive

printf '更新所有子模块到各自远端跟踪分支的最新提交...\n'
git submodule update --init --recursive --remote

printf '子模块更新完成：\n'
git submodule status --recursive
