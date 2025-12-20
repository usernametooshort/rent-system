# 🏠 My 租客宝 (Rent Management System)

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/yourusername/rent-system)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/yourusername/rent-system)

一款面向小型房东的、移动优先的现代化房屋租赁管理平台。

## 🌟 Version 2.0 Highlights

- **全终端响应式设计**: 深度优化的移动/桌面端适配。
- **身份证 OCR 识别**: 集成 Tesseract.js，实现办理入住时的自动化登记。
- **租客历史档案**: 完善的离职租客记录管理，确保数据全生命周期可追溯。
- **极致视觉体验**: 现代化 UI 设计，包含“电磁边缘”卡片特效。
- **流程优化**: 更加直观的退租管理模块（三步工作法）。

## 🛠️ 技术架构

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Fastify + TypeScript + Prisma
- **Database**: SQLite
- **Deployment**: Docker Compose / Nginx

## 🚀 快速启动

### 1. 准备环境

确保已安装 Docker 和 Docker Compose。

### 2. 克隆项目

```bash
git clone https://github.com/yourusername/rent-system.git
cd rent-system
```

### 3. 配置环境

复制并修改根目录及子目录下的 `.env.example` 为 `.env`。

### 4. 启动服务

```bash
./deploy.sh
```

系统默认访问地址：`http://localhost:8280`

## 📖 文档

详细的系统说明和功能手册请参考：

- [系统介绍 (HTML 版)](./uploads/system_introduction.html)

---
© 2025 My 租客宝. 保留所有权利。
