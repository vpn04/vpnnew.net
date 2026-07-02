---
title: 使用vim摸鱼
createTime: 2025/10/10 10:40:16
permalink: /article/moyu/
tags:
  - 中文
  - Vim
  - 摸鱼
  - 科学上网
  - 小说
description: "职场社畜必备技巧：教你如何在工作中使用 Vim 编辑器偷偷看小说、缓解压力。适合上班族轻松摸鱼，同时掌握 Vim 基础操作。"
keywords: "Vim 摸鱼, 上班摸鱼, Vim 小说阅读, 职场减压技巧, Vim 编辑器, 工作摸鱼方法, 科学上网, 上班娱乐, Vim 使用指南"
head:
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "使用 Vim 摸鱼",
        "description": "职场社畜必备技巧：教你如何在工作中使用 Vim 编辑器偷偷看小说、缓解压力。",
        "author": {
          "@type": "Person",
          "name": "Admin"
        },
        "datePublished": "2025-10-10T10:40:16+08:00",
        "dateModified": "2025-10-10T10:40:16+08:00",
        "publisher": {
          "@type": "Organization",
          "name": "vpnnew.net"
        }
      }
---

随着高校毕业生人数逐年攀升，职场竞争愈发激烈。对于在职社畜来说，如何在工作中适度“摸鱼”，不仅能缓解压力，还能为更多人创造就业机会。今天就分享一个实用技巧——用 Vim 编辑器在上班时偷偷看小说。
<!-- more -->
---

###  📢摸鱼必备： 👉[2026年翻墙机场推荐评测 稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）](/vpn-recommend/)  

## 一、声明

本教程主要适用于程序开发相关岗位。如果你是 HR、医生、教师、设计师、警察、财务等平时很少用代码编辑器的职业，请谨慎参考。因使用本教程而被领导批评，作者概不负责。

---

## 二、下载并安装 Vim

这里以 Windows 系统为例，介绍 Vim 的下载安装流程。

- 官方下载地址：[https://www.vim.org/download.php#pc](https://www.vim.org/download.php#pc)
![alt text](images/使用vim摸鱼/image.png)
- 找到 `gvimxx.exe` 文件，点击下载。
- 下载完成后直接运行安装程序。若系统提示风险，选择“更多信息”并继续安装即可。
- 按照提示一路“下一步”完成安装。

![alt text](images/使用vim摸鱼/image-1.png)

![alt text](images/使用vim摸鱼/image-2.png)


### 设置环境变量

1. 在桌面 Vim 快捷方式上右键，选择“打开文件所在位置”。

   ![alt text](images/使用vim摸鱼/image-3.png)

2. 复制该目录路径。
![alt text](images/使用vim摸鱼/image-4.png)
3. 按 Win 键，输入“环境变量”，点击“编辑系统环境变量”。
![alt text](images/使用vim摸鱼/image-5.png)
4. 依次点击“环境变量” → 双击“Path” → 双击空白处 → 粘贴 Vim 目录路径 → 一路点击“确定”。
![alt text](images/使用vim摸鱼/image-6.png)

### 检查安装

1. 按 Win 键，输入“powershell”，回车进入 PowerShell。
2. 输入 `vim --version` 检查 Vim 是否安装成功。
![alt text](images/使用vim摸鱼/image-7.png)

---

## 三、配置 Vim

1. 在 PowerShell 中输入 `vim ~/.vimrc` 打开 Vim 配置文件。
2. 按 `:` 键，输入 `set paste` 并回车，进入粘贴模式（可保留原有文本格式）。
3. 按 `i` 键进入编辑模式，将下面的内容敲进去，（懒得写的评论留言找我获取）。
![alt text](images/使用vim摸鱼/image-8.png)


完事后按下 `Esc` 键，输入 `:wp!` 并回车即可保存并退出。注意，冒号和叹号都要用英文符号！

   ![alt text](images/使用vim摸鱼/image-9.png)

这样 Vim 的配置就完成了。

---

## 四、用编辑器看小说

其实不仅 Vim，任何带命令窗口的编辑器或 IDE 都可以用来看小说，比如 VS Code、PyCharm、Eclipse。这里以 VS Code 为例：

1. 在命令窗口输入： ”vim 小说的绝对路径“
![alt text](images/使用vim摸鱼/image-10.png)
就能打开小说文件。

2. 效果如下图所示：

   ![alt text](images/使用vim摸鱼/image-10.png)

- 按空格键可以向下翻两行。
- 按 F2 可以保存并退出。
- 下次打开还能自动跳转到上次阅读的位置，继续看。

---

通过这些方法，你可以在工作时用 Vim 或编辑器轻松摸鱼看小说，既能伪装认真工作，又能享受阅读乐趣。

---
## 五、在 PowerShell 下更优雅地看小说

你可以通过配置 PowerShell 的 profile 文件，让看小说更加便捷。

1. 首先，在 PowerShell 中执行以下命令，创建 profile 文件：

   ```powershell
   New-Item -Type file -Force $profile
然后用 Vim 打开 profile 文件，并切换到粘贴编辑模式将下放内容敲进去（懒得写评论留言获取）。
![alt text](images/使用vim摸鱼/image-11.png)

完成配置后，保存并退出 Vim，然后重新打开 PowerShell。

在 PowerShell 中执行 `rn -o` 可以打开小说存放目录。

![alt text](images/使用vim摸鱼/image-12.png)

使用 `rn -l` 可以列出该目录下的所有小说文件，如果目录为空会有提示。

![alt text](images/使用vim摸鱼/image-13.png)

通过 `rn -s 小说名` 可以设置默认小说。

![alt text](images/使用vim摸鱼/image-14.png)

之后只需输入 `rn`，就能直接开始阅读默认小说了！

---

这样一来，你就能在 PowerShell 下优雅地管理和阅读小说，摸鱼体验更上一层楼。既能伪装成认真工作，又能享受摸鱼时光，轻松应对职场压力。

---

## 📢机场推荐汇总： 👉[2026年翻墙机场推荐评测 稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）](/vpn-recommend/)  

## 📌 延伸阅读

👉iOS手机：[Shadowrocket （小火箭）2026年使用指南：iOS/macOS全平台配置教程(含非国区ID)](/article/Shadowrocket/)

👉Android手机：[Clash for Android 2026年使用指南：终极配置指南教程](/article/ClashforAndroid/)

👉Windows/Linux/Mac：[2026年 Clash Verge （Windows/Linux/Mac）全平台配置指南](/article/ClashVerge/)

👉每天免费更新Apple ID：[2026年 最新最全免费共享美区 Apple ID |Shadowrocket/小火箭下载|每日更新](/article/freeAppleID/)  

---

>评测数据基于实际测试结果，服务表现可能因网络环境而异。建议你根据自身需求进行实际测试验证。

>📝 免责声明：本文仅供信息参考，建议均为个人经验与观点，不构成法律意见。实际情况以最新政策和主管部门解释为准，请在合法合规框架内使用相关服务。任何违法使用行为与本站无关。