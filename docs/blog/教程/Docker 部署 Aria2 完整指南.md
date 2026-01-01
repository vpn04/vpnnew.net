---
title: Docker 部署 Aria2 完整指南
createTime: 2025/10/17 14:19:20
permalink: /article/DockerbushuAria2/
tags:
  - 电脑VPN
  - Aria2
  - Docker
  - Aria2 Explorer

---
# 🤷‍♂️遇到的问题
由于小区宽带不提供公网IP，我不得不依靠内网穿透技术来远程访问家中的网络服务。
某天偶然查看NPS服务端的监控数据时，惊讶地发现CPU使用率竟然高达90%。经过层层排查，最终定位到问题确实出在NPS服务本身的资源消耗上。

## [2026年性价比翻墙机场推荐评测（长期更新）](https://vpnnew.net/article/VPN/ )
### 📍纯小白请看以下教程，老鸟略过

👉[2025年安卓VPN完全指南：从选购到实战](https://vpnnew.net/article/anzhuoVPNzhinan/ )

👉[电脑用VPN怎么选？实用攻略与建议](https://vpnnew.net/article/diannanvpnzenmexuan/ )

👉[iPhone上装哪款VPN iOS版本？避坑指南](https://vpnnew.net/article/iphoneVPN/ )

那么，为什么一个轻量级的NPS服务会出现如此异常的资源占用呢？
真相令人哭笑不得——问题竟然源于我使用的Aria2 Explorer浏览器插件。为了图省事，我在配置时直接选择了HTTP协议，而这个看似不起眼的选择，却成为了系统资源被大量占用的罪魁祸首。

![alt text](<images/Docker 部署 Aria2 完整指南/image-3.png>)

这样在使用 Aria2 Explorer 查看下载进度时，会无限轮询后端 Aria2 服务，导致 CPU 占用率飙升。
我赶紧修改了配置，改为 ws 协议，果然 CPU 使用率下降了。
考虑到会有人和我一样使用 Aria2 Explorer，所以写了这篇文章，希望能帮到大家。

# 📲 Docker 部署 Aria2 完整指南
使用 Docker 部署 Aria2 可避免复杂的环境配置，实现“一键启动”和跨平台运行，同时便于管理数据和版本。以下是 **详细部署步骤**（含基础配置、Web 管理界面集成、数据持久化），适用于 Windows、macOS、Linux 等所有支持 Docker 的系统。

## 🔌一、前置准备：安装 Docker 环境
首先确保本地已安装 Docker 和 Docker Compose（推荐使用 Compose 简化部署，无需手动输入复杂命令）：
1. **安装 Docker**：
   - Windows/macOS：下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)，按向导安装（需开启虚拟化功能）。
   - Linux（以 Ubuntu 为例）：执行以下命令：
     ```bash
     sudo apt update
     sudo apt install apt-transport-https - -ca-certificates curl software-properties-common
     curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
     sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
     sudo apt update && sudo apt install docker-ce
     sudo usermod -aG docker $USER
     ```
2. **验证 Docker 安装**：  
   终端执行 `docker --version` 和 `docker-compose --version`，若显示版本信息则说明安装成功（Linux 需重启终端生效非 root 权限）。


## 🖲️二、两种部署方式：Docker Run 快速启动 vs Docker Compose 持久化部署
### 方式 1：Docker Run 快速启动（适合临时测试）
若仅需快速体验 Aria2，可通过 `docker run` 命令直接启动容器（但数据默认不持久化，容器删除后下载文件和配置会丢失）：
```bash
docker run -d \
  --name aria2 \
  -p 6800:6800 \  # Aria2 RPC 端口（扩展连接用）
  -p 6888:6888 \  # Aria2 下载端口（TCP）
  -p 6888:6888/udp \  # Aria2 下载端口（UDP，BT 下载用）
  -v /本地路径/下载目录:/downloads \  # 本地目录映射到容器下载目录（替换为实际路径）
  -v /本地路径/配置目录:/config \  # 本地目录映射到容器配置目录（替换为实际路径）
  -e PUID=1000 \  # 容器内用户 ID（通常为 1000，避免权限问题）
  -e PGID=1000 \  # 容器内用户组 ID（与 PUID 一致）
  -e TZ=Asia/Shanghai \  # 时区（避免日志时间错乱）
  -e ARIA2_RPC_SECRET=your_secret \  # Aria2 RPC 密钥（可选，建议设置，增强安全性）
  --restart unless-stopped \  # 容器退出后自动重启（除非手动停止）
  p3terx/aria2-pro  # 推荐使用 p3terx/aria2-pro 镜像（优化版，支持自动更新 Tracker）

推荐使用 p3terx/aria2-pro 镜像（优化版，支持自动更新 Tracker）

- **参数说明**：
  - `-p 6800:6800`：必须映射，Aria2 Explorer 扩展需通过此端口连接 Aria2 服务。
  - `-v /本地路径:/容器路径`：`/本地路径` 需替换为你本地的实际目录（如 Windows 为 `D:/Aria2/Downloads`，Linux/macOS 为 `~/Aria2/Downloads`），用于持久化保存下载文件和配置。
  - `ARIA2_RPC_SECRET`：自定义 RPC 密钥（如 `MyAria2Secret123`），后续配置扩展时需填写，若不设置则留空。

```
### 方式 2：Docker Compose 持久化部署（推荐，适合长期使用）
通过 `docker-compose.yml` 文件统一管理容器配置，便于修改和重启，且数据持久化更稳定。

#### 步骤 1：创建目录结构
先在本地创建如下目录（以 Linux/macOS 为例，Windows 可在 D 盘创建类似结构）：
```bash
~/Aria2/         
├── docker-compose.yml  
├── config/       
└── downloads/    
```
- Windows 目录示例：`D:\Aria2\docker-compose.yml`、`D:\Aria2\config`、`D:\Aria2\downloads`。

#### 步骤 2：编写 docker-compose.yml 文件
在 `~/Aria2/`（或 Windows 对应目录）下创建 `docker-compose.yml` 文件，内容如下：
```bash
version: '3.8' 

services:
  aria2:
    image: p3terx/aria2-pro  
    container_name: aria2-pro 
    restart: unless-stopped  
    ports:
      - "6800:6800" 
      - "6888:6888"  
      - "6888:6888/udp"  
    volumes:
      - ./downloads:/downloads  
      - ./config:/config        
    environment:
      - PUID=1000  
      - PGID=1000  
      - TZ=Asia/Shanghai  
      - ARIA2_RPC_SECRET=MyAria2Secret123  
      - ARIA2_MAX_CONCURRENT_DOWNLOADS=5 
      - ARIA2_MAX_CONNECTIONS_PER_SERVER=16 
```
- **参数可按需调整**：
  - `ARIA2_MAX_CONCURRENT_DOWNLOADS`：若需同时下载更多文件，可改为 10 等。
  - 若不需要 BT 下载，可删除 `6888` 端口的映射（但建议保留，增强兼容性）。

#### 步骤 3：启动容器
进入 `docker-compose.yml` 所在目录（如 `cd ~/Aria2/` 或 Windows 下 `cd D:\Aria2`），执行以下命令启动容器：
```bash
# 启动容器（后台运行）
docker-compose up -d

# 查看容器运行状态（确认是否启动成功）
docker-compose ps
```
- 若输出中 `State` 为 `Up`，说明容器启动成功；若为 `Exited`，可执行 `docker-compose logs` 查看错误日志（常见问题：目录权限不足，Linux 可执行 `chmod 777 ./downloads ./config` 临时解决）。


## 🖱️三、关键配置：Aria2 核心参数（可选）
默认情况下，`p3terx/aria2-pro` 镜像已优化配置，但如需自定义下载规则（如下载速度限制、BT 端口等），可在 `./config` 目录下创建 `aria2.conf` 文件，添加自定义参数（配置会覆盖镜像默认值）。

常用自定义参数示例（`aria2.conf`）：
```bash
# 下载速度限制（单位：K 或 M，0 表示无限制）
max-download-limit=0
max-upload-limit=100K  # BT 上传限速，避免占用过多带宽

# BT 相关配置
enable-dht=true  # 启用 DHT 网络（BT 下载必需）
enable-peer-exchange=true  # 启用 PEX 协议（加速 BT 下载）
bt-max-open-files=100  # BT 最大打开文件数
bt-tracker-update-interval=600  # Tracker 自动更新间隔（秒，默认 600，无需修改）

# 断点续传（默认开启，确保开启）
continue=true
```
- 修改 `aria2.conf` 后，需重启容器生效：`docker-compose restart`。


## 💽四、集成 Web 管理界面（可选：AriaNG）
Aria2 本身无图形界面，推荐用 **AriaNG**（轻量 Web 管理工具）查看下载进度、管理任务，支持通过浏览器访问。

### 快速部署 AriaNG（同样用 Docker）
在原 `docker-compose.yml` 中添加 `ariang` 服务（无需额外目录，直接扩展配置）：
```yaml
version: '3.8'

services:
  # 原有 Aria2 服务（不变）
  aria2:
    ...（同上，保持不变）...

  # 新增 AriaNG 服务
  ariang:
    image: p3terx/ariang  # AriaNG 官方镜像
    container_name: ariang
    restart: unless-stopped
    ports:
      - "6880:6880"  # Web 访问端口（自定义，如 8080:6880）
    depends_on:
      - aria2  # 确保 Aria2 先启动
```
修改后重新启动容器：
```bash
docker-compose up -d
```
- **访问 AriaNG**：打开浏览器，输入 `http://localhost:6880`（若为远程服务器，替换 `localhost` 为服务器 IP），即可看到 Aria2 管理界面。
- **关联 Aria2 服务**：首次打开 AriaNG 时，点击左侧“设置”→“RPC”，填写：
  - RPC 地址：`localhost`（本地部署）或服务器 IP。
  - RPC 端口：`6800`（与 Aria2 容器映射的端口一致）。
  - RPC 密钥：填写 `docker-compose.yml` 中设置的 `ARIA2_RPC_SECRET`（如 `MyAria2Secret123`）。
  点击“保存”后，即可在 AriaNG 中管理下载任务。


## 🖨️五、验证 Aria2 服务可用性
部署完成后，需确认 Aria2 服务可正常访问（后续 Aria2 Explorer 扩展需连接此服务）：
1. 执行以下命令，测试 RPC 端口是否开放：
   ```bash
   # 本地测试（Windows 用 PowerShell，Linux/macOS 用终端）
   telnet localhost 6800
   # 或用 curl 测试（更简洁）
   curl http://localhost:6800/jsonrpc -X POST -d '{"jsonrpc":"2.0","id":"test","method":"aria2.getVersion"}'
   ```
   - 若返回类似 `{"jsonrpc":"2.0","id":"test","result":{"version":"1.36.0"...}}` 的内容，说明 RPC 服务正常。
2. 若测试失败，检查：
   - 容器是否正常运行（`docker-compose ps`）。
   - 端口是否被占用（Windows 用 `netstat -ano | findstr 6800`，Linux 用 `netstat -tulpn | grep 6800`）。
   - 防火墙是否开放 6800 端口（Linux 用 `sudo ufw allow 6800`，Windows 需在防火墙高级设置中添加规则）。


## 六、容器管理常用命令
后续如需重启、停止或更新 Aria2 容器，可执行以下命令（均在 `docker-compose.yml` 所在目录执行）：
```bash
# 重启容器（修改配置后需执行）
docker-compose restart

# 停止容器（临时关闭）
docker-compose stop

# 启动已停止的容器
docker-compose start

# 删除容器（需先停止，数据不会丢失，因为已持久化到本地目录）
docker-compose down

# 更新镜像（获取最新版 Aria2）
docker-compose pull && docker-compose up -d
```


## 七、对接 Aria2 Explorer 扩展
部署完成后，回到浏览器的 Aria2 Explorer 扩展配置，填写以下信息（与 Docker 配置对应）：
| 扩展配置项       | 填写内容                                  |
|------------------|-------------------------------------------|
| RPC 协议         | HTTP                                      |
| RPC 地址         | localhost（本地部署）或服务器 IP           |
| RPC 端口         | 6800（与容器映射的端口一致）               |
| RPC 密钥         | 填写 `ARIA2_RPC_SECRET` 的值（如 MyAria2Secret123） |
点击“测试连接”，若提示“连接成功”，即可正常使用扩展下载文件。


通过 Docker 部署的 Aria2 不仅配置简单，还能确保环境一致性，后续迁移到其他设备时，只需复制 `docker-compose.yml` 和数据目录即可快速恢复。若需远程访问（如在手机上管理下载），只需确保服务器开放 6800（RPC）和 6880（AriaNG）端口，并通过公网 IP 访问即可。
