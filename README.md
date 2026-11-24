# Copy Transform + Marker（After Effects 图层属性复制粘贴与标记对齐插件）

一款专为 Adobe After Effects 打造的 CEP 扩展面板（`v2.1.1`），支持**精准勾选复制、粘贴与重置**图层属性（包括变换、3D 材质、效果、图层样式、蒙版、形状内容、图层标记、混合模式开关以及细分的文本属性），并内置图层标记快速导航与播放头对齐、三档关键帧时间偏移粘贴，以及一键**中英文双语切换**。

[English](#english-documentation)

---

## 核心功能

- **中英文双语界面（中文 / EN）**：
  - 面板右上角提供一键切换按钮，点击即可在全中文与全英文之间无缝切换，布局位置完全锁定不偏移，并自动记忆语言偏好。
- **全属性勾选复制 / 粘贴 / 重置**：
  - **变换属性（Transform）**：锚点、位置（自动兼容分离维度 Separate Dimensions）、缩放、旋转、方向、X/Y/Z 轴旋转、不透明度。
  - **3D 与视觉样式**：3D 图层开关、3D 材质选项（3D Material）、效果（Effects）、图层样式（Layer Styles，兼容中英文版 AE 菜单）、蒙版（Masks）、形状内容（Shape Contents）、图层标记（Markers）、混合模式与图层开关（Blend & Switches）。
  - **文本属性（TEXT 独立分类）**：支持单独勾选复制/粘贴/重置**源文本（Source Text）**、**路径选项（Path Options）**、**更多选项（More Options）**以及**文本动画器（Animators）**（精准识别并仅克隆已添加的动画器属性与选择器）。
  - **滑动批量勾选**：在属性面板中按住鼠标左键上下/左右滑动，即可快速批量勾选或取消勾选。
- **三档关键帧时间基准（粘贴位置）**：
  - **合成开始（Comp Start）**：按复制时的原始合成时间点粘贴关键帧。
  - **播放头（Playhead）**：自动计算最早关键帧，将整组关键帧与标记平移对齐到当前时间指示器（CTI）。
  - **图层入点（Layer In）**：将整组关键帧与标记自动平移对齐到每个目标图层的入点。
- **图层标记导航与对齐（Marker Align）**：
  - 支持上/下一个标记切换（`◀` / `▶`），一键平移整个图层使选中标记精准对齐当前播放头。

---

## 安装方法

### 1. 开启未签名 CEP 扩展调试模式（仅需配置一次）
由于本插件为未签名扩展，需在系统中开启 Adobe CSXS 的 `PlayerDebugMode`：

- **Windows 系统**：
  - **方法 A（推荐）**：直接双击本仓库 `scripts/enable_debug_mode_win.reg` 注册表文件并确认导入即可（自动开启 CSXS 9 ~ 12）。
  - **方法 B（手动）**：打开注册表编辑器（`regedit`），定位到 `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`（根据 AE 版本也可能是 `CSXS.9`、`CSXS.10` 或 `CSXS.12`），新建字符串值 `PlayerDebugMode`，将数值数据设为 `1`。
- **macOS 系统**：
  - 打开终端（Terminal），运行以下命令：
    ```bash
    defaults write com.adobe.CSXS.11 PlayerDebugMode 1
    ```

### 2. 复制插件文件夹
将 `CopyTransformMarker_CEP` 文件夹完整复制到系统的 Adobe CEP 扩展目录：

- **Windows 路径**：
  `%APPDATA%\Adobe\CEP\extensions\CopyTransformMarker_CEP`
- **macOS 路径**：
  `~/Library/Application Support/Adobe/CEP/extensions/CopyTransformMarker_CEP`

### 3. 在 After Effects 中打开
重启 After Effects，在顶部菜单栏点击：
**窗口（Window） > 扩展（旧版）（Extensions (Legacy)） > Copy Transform + Marker**

---

## 兼容性
- 支持 Adobe After Effects CC 2020 (17.0) 及以上所有版本（已测试至 AE 2026）。
- 兼容 Windows 与 macOS。

---

<a id="english-documentation"></a>

## English Documentation

An After Effects CEP panel extension (`v2.1.1`) for selectively copying, pasting, and resetting layer properties—including Transform, 3D Material Options, Effects, Layer Styles, Masks, Shape Contents, Markers, Blend & Switches, and granular Text properties—alongside quick layer marker navigation, CTI alignment, and one-click **Chinese / English** UI switching.

### Installation
1. **Enable `PlayerDebugMode`**: Run `scripts/enable_debug_mode_win.reg` on Windows, or execute `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` in macOS Terminal.
2. **Copy Folder**: Place `CopyTransformMarker_CEP` into `%APPDATA%\Adobe\CEP\extensions\` (Windows) or `~/Library/Application Support/Adobe/CEP/extensions/` (macOS).
3. **Launch**: Restart After Effects and open **Window > Extensions (Legacy) > Copy Transform + Marker**.

## License
MIT License — see [LICENSE](LICENSE) for details.
