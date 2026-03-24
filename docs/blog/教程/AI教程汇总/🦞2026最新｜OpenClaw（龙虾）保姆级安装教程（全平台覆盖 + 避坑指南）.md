---
title: 🦞2026最新｜OpenClaw（龙虾）保姆级安装教程（全平台覆盖 + 避坑指南）
createTime: '2026/03/09 06:32:51'
permalink: /scamvpn/OpenClaw/
tags:
  - OpenClaw
  - 龙虾
  - 教程
  - 科学上网
  - 避坑指南
  - AI代理框架
  - 多模型接入
  - 零门槛搭建
  - 机场
  - 零门槛搭建
  - OpenClaw龙虾
  - 私人AI助理
description: OpenClaw（业内俗称“龙虾”）是一款开源的AI代理框架，具备强大的扩展能力，多模型接入，支持阿里云百炼、MiniMax、DeepSeek、Claude等主流大模型，多端集成，可接入飞书、Telegram等办公与社交平台，灵活部署，支持本地运行、云端托管、Docker容器化，零门槛搭建，无需深厚技术背景，按向导操作即可拥有私人AI助理
---
OpenClaw（业内俗称“龙虾”）AI代理框架，具备强大的扩展能力，多模型接入，支持阿里云百炼、MiniMax、DeepSeek、Claude等主流大模型，多端集成，可接入飞书、Telegram等办公与社交平台，灵活部署，支持本地运行、云端托管、Docker容器化，零门槛搭建，无需深厚技术背景，按向导操作即可拥有==私人AI助理==，==从小白到老鸟手把手教你完美部署==。
==本文将覆盖 **Windows/macOS/Linux/Docker** 四种安装方式==，从环境准备到启动验证全流程拆解，确保新手也能一次成功。
<!-- more -->

![alt text](<images/🦞2026最新｜OpenClaw（龙虾）保姆级安装教程（全平台覆盖 + 避坑指南）/image.png>)

## 📑 目录

- [一、部署前核心准备](#一部署前核心准备)
  - [1.1 硬件与系统要求](#11-硬件与系统要求)
  - [1.2 必备工具与凭证](#12-必备工具与凭证)
- [二、全平台基础依赖安装](#二全平台基础依赖安装)
  - [2.1 Windows环境配置](#21-windows环境配置)
  - [2.2 macOS环境配置](#22-macos环境配置)
  - [2.3 Linux环境配置](#23-linux环境配置)
  - [2.4 依赖验证](#24-依赖验证)
- [三、四种安装方式详解](#三四种安装方式详解)
  - [3.1 方式一：一键脚本安装（新手首选）](#31-方式一一键脚本安装新手首选)
  - [3.2 方式二：npm全局安装（稳定兼容）](#32-方式二npm全局安装稳定兼容)
  - [3.3 方式三：Docker部署（无环境冲突）](#33-方式三docker部署无环境冲突)
  - [3.4 方式四：源码编译安装（开发者定制）](#34-方式四源码编译安装开发者定制)
- [四、初始化配置与启动](#四初始化配置与启动)
  - [4.1 启动配置向导](#41-启动配置向导)
  - [4.2 启动服务](#42-启动服务)
  - [4.3 端口放行（远程访问必备）](#43-端口放行远程访问必备)
  - [4.4 访问验证](#44-访问验证)
- [五、进阶配置（可选功能）](#五进阶配置可选功能)
  - [5.1 多模型接入配置](#51-多模型接入配置)
  - [5.2 飞书机器人集成](#52-飞书机器人集成)
- [六、常见问题与避坑指南](#六常见问题与避坑指南)
- [七、卸载方法](#七卸载方法)
- [结语](#结语)

---


## 一、部署前核心准备

### 1.1 硬件与系统要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| **操作系统** | Win10+ / macOS12+ / Ubuntu20.04+ | Win11 / macOS14+ / Ubuntu22.04 |
| **内存** | 4GB | 8GB+ |
| **磁盘** | 2GB可用空间 | 10GB+ SSD |
| **核心依赖** | Node.js ≥ 18.0 | **Node.js 22.x LTS（避坑关键）** |

> ⚠️ **特别提醒**：Node.js版本是安装成功的关键，强烈建议使用22.x LTS版本，可避免90%以上的兼容性问题。

### 1.2 必备工具与凭证

| 项目 | 说明 |
|------|------|
| **Git** | 用于拉取源码、获取更新 |
| **包管理器** | npm / pnpm（推荐pnpm，安装速度更快） |
| **大模型API Key** | 阿里云百炼 / MiniMax / DeepSeek / Claude 任选其一 |
| **网络环境** | 可访问GitHub、npm（国内用户需配置镜像加速） |

---

## 二、全平台基础依赖安装

### 2.1 Windows环境配置

**以管理员身份运行PowerShell**，依次执行以下命令：

#### 安装NVM（Node版本管理工具）
```powershell
iwr -useb https://raw.githubusercontent.com/coreybutler/nvm-windows/master/nvm-setup.exe | iex
```
*NVM可灵活切换Node版本，避免版本冲突问题*

#### 安装并启用Node.js 22
```powershell
nvm install 22
nvm use 22.22.0
```

#### 安装Git与pnpm，配置国内镜像
```powershell
# Git需官网下载安装，安装时勾选“Add to PATH”
npm install -g pnpm
pnpm config set registry https://registry.npmmirror.com/
```

#### 解决执行策略报错（必做）
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2.2 macOS环境配置

**打开终端（Terminal）**，执行以下命令：

#### 安装Homebrew（如已安装可跳过）
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 安装Node.js 22 + Git
```bash
brew install node@22 git
brew link node@22 --overwrite
```

#### 安装pnpm并配置镜像
```bash
npm install -g pnpm
pnpm config set registry https://registry.npmmirror.com/
```

### 2.3 Linux环境配置

**以Ubuntu/Debian为例**，执行以下命令：

#### 添加Node.js 22源并安装
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential
```

#### 安装pnpm与镜像配置
```bash
npm install -g pnpm
pnpm config set registry https://registry.npmmirror.com/
```

### 2.4 依赖验证

执行以下命令，全部输出版本号即表示环境配置成功：

```bash
node -v   # 应显示 ≥22.0
npm -v    # 显示npm版本号
git -v    # 显示git版本号
pnpm -v   # 显示pnpm版本号
```

---

## 三、四种安装方式详解

### 3.1 方式一：一键脚本安装（新手首选，5分钟搞定）

**适用场景**：希望最快速度完成部署，不想手动处理细节

#### 国内加速脚本（解决GitHub访问问题）

**macOS/Linux**
```bash
curl -fsSL -o install.sh https://cdn.jsdelivr.net/gh/1186258278/OpenClawChineseTranslation@main/install.sh && bash install.sh
```

**Windows（PowerShell）**
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

#### 验证安装
```bash
openclaw --version
```
*输出版本号即表示安装成功*

### 3.2 方式二：npm全局安装（稳定兼容）

**适用场景**：熟悉npm生态，希望保持最新版本

#### npm安装
```bash
npm install -g openclaw@latest
```

#### pnpm安装（速度更快）
```bash
pnpm add -g openclaw@latest
```

### 3.3 方式三：Docker部署（无环境冲突）

**适用场景**：服务器部署、避免本地环境干扰、多实例管理

#### 安装Docker与Docker Compose
参考[Docker官方文档](https://docs.docker.com/get-docker/)完成安装

#### 拉取镜像并启动
```bash
# 克隆仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 复制环境配置模板
cp .env.example .env

# 编辑.env文件，填入大模型API Key
# 可使用vim、nano等编辑器修改

# 构建并启动容器
docker-compose up -d
```

#### 验证容器运行状态
```bash
docker ps
```
*查看openclaw容器状态是否为“Up”*

### 3.4 方式四：源码编译安装（开发者定制）

**适用场景**：需要二次开发、自定义功能、研究源码

#### 克隆源码
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

#### 安装项目依赖
```bash
pnpm install
```

#### 构建并链接全局命令
```bash
pnpm build
pnpm link --global
```

---

## 四、初始化配置与启动

### 4.1 启动配置向导

```bash
openclaw onboard
```

**向导交互步骤**：

| 步骤 | 操作说明 |
|------|---------|
| 1️⃣ 同意风险提示 | 输入 `Yes` 确认 |
| 2️⃣ 选择启动模式 | 选择 `Quick Start`（快速启动） |
| 3️⃣ 设置管理员密码 | 自定义8位以上密码 |
| 4️⃣ 填入API Key | 粘贴提前准备的大模型密钥 |
| 5️⃣ 功能开启 | 语音/画布/插件等功能按需选择 |

### 4.2 启动服务

```bash
# 启动网关服务
openclaw gateway start

# 安装系统守护进程（服务器必选，实现开机自启）
openclaw onboard --install-daemon
```

### 4.3 端口放行（远程访问必备）

默认端口：**18789**

**Linux/macOS**
```bash
sudo ufw allow 18789/tcp
sudo ufw reload
```

**Windows**
- 进入“Windows Defender防火墙” → “高级设置”
- 新建“入站规则” → 选择“端口”
- 输入 `18789`，选择“允许连接”

### 4.4 访问验证

| 访问方式 | 地址格式 |
|---------|---------|
| 本地访问 | `http://localhost:18789` |
| 远程访问 | `http://服务器IP:18789` |

登录时输入：
- 管理员密码（向导中设置的密码）
- 或使用生成的Token

---

## 五、进阶配置（可选功能）

### 5.1 多模型接入配置

通过命令行配置Ollama等本地模型：

```bash
openclaw config set 'models.providers.ollama' --json '{
  "baseUrl": "http://localhost:11434/v1",
  "apiKey": "ollama"
}'
```

### 5.2 飞书机器人集成

**步骤一**：在飞书开放平台创建自建应用，开启机器人能力

**步骤二**：安装飞书插件依赖
```bash
cd ~/.openclaw/extensions/feishu
pnpm install
```

**步骤三**：配置应用凭证与事件回调，重启服务生效

---

## 六、常见问题与避坑指南

| 问题现象 | 解决方案 |
|---------|---------|
| **Node版本过低报错** | 使用NVM切换至22.x版本，删除旧版Node后重试 |
| **端口被占用** | `lsof -i:18789` 查看占用进程并杀死，或修改配置文件中的端口 |
| **npm安装失败** | 切换pnpm重试：`pnpm add -g openclaw@latest`；或清理缓存：`pnpm cache clean --force` |
| **远程无法访问** | 检查服务器安全组是否放行18789端口，确认防火墙规则已生效 |
| **API Key无效** | 核对密钥权限，确认所选模型服务商在当前区域可用 |
| **Windows执行策略报错** | 执行 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` 解决 |

---

## 七、卸载方法

如需完全移除OpenClaw，执行以下命令：

#### 全局卸载
```bash
npm uninstall -g openclaw
pnpm remove -g openclaw
```

#### 删除配置文件
```bash
# macOS/Linux
rm -rf ~/.openclaw

# Windows
rm -r $env:USERPROFILE\.openclaw
```

#### Docker卸载
```bash
docker stop openclaw-container
docker rm openclaw-container
docker rmi openclaw-image
```

---

## 🎯 结语

OpenClaw（龙虾）的安装核心门槛主要集中在**Node.js版本选择**与**端口配置**两个环节。只要严格遵循本文步骤操作，新手也能零失败完成部署。

部署完成后，你可以：

- 接入各类大模型，体验不同AI能力
- 集成飞书、Telegram等办公工具
- 打造属于自己的AI工作流
- 二次开发扩展功能

现在就开始你的养龙虾之旅吧！🚀

---
##  📢机场推荐汇总： 👉[2026年翻墙机场推荐评测 稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）]( https://vpnnew.net/article/VPN/ )   

## 📌 延伸阅读

👉iOS手机：[Shadowrocket （小火箭）2026年使用指南：iOS/macOS全平台配置教程(含非国区ID)](https://vpnnew.net/article/Shadowrocket/ )

👉Android手机：[Clash for Android 2026年使用指南：终极配置指南教程](https://vpnnew.net/article/ClashforAndroid/ )

👉Windows/Linux/Mac：[2026年 Clash Verge （Windows/Linux/Mac）全平台配置指南](https://vpnnew.net/article/ClashVerge/ )

👉每天免费更新Apple ID：[2026年 最新最全免费共享美区 Apple ID |Shadowrocket/小火箭下载|每日更新]( https://vpnnew.net/article/freeAppleID/ )  

---

>📝 免责声明：本文仅供信息参考，建议均为个人经验与观点，不构成法律意见。实际情况以最新政策和主管部门解释为准，请在合法合规框架内使用相关服务。任何违法使用行为与本站无关。