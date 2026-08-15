# dsh-eva-skin

DeepSeek Harness Web GUI 的 EVA 皮肤——明日香(EVA-02)红黑主题、壁纸、机械装饰与输入框特效。

[English](README.md)

## 功能

- **EVA 红黑主题** — 通过主题注册表 `overrideTokens` 叠加 token 层(以 inline 变量写入 body,优先级高于所有样式表):半透明深红表面、EVA 红 `#ff3355` 强调、暖白文字、红色边框、琥珀警示、EVA 绿成功态。插件会把配色锁定为深色模式(经典红黑,不会发粉);卸载插件即可恢复之前的主题选择。
- **明日香壁纸** — 全视口背景图(以 data URI 内嵌进 bundle,无需静态路由)+ 两团红色光晕。
- **机械装饰** — 点击穿透的固定装饰层(z-index 15):左上 `02 / ASUKA / SECOND CHILD` 驾驶员铭牌、右上 `NERV / UNIT-02` 铭牌、上下黄黑警示条、四角红色角标、右下 `EVA-02 // SYSTEM ONLINE` 等宽状态字。
- **输入框特效** — 发消息的输入框:红色描边 + 聚焦红光、顶部黄黑警示条、上沿 `TRANSMIT` 铭牌。

## 环境要求

- 一份 `deepseek-harness` 检出,并运行着 `dsh web` GUI(皮肤通过 web profile 的用户 patch 层挂载)。
- 插件的构建产物已随仓库附带在 `lib/` —— 直接使用无需构建。

## 安装

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

### macOS / Linux

```bash
./install.sh
```

脚本会把本目录链接到 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-eva`(profile 模块回退目录),并在 `$DSH_HOME/profiles/<profile>/cordis.patch.yml` 注册 `ui-eva` 行(默认 profile:`web`,可通过第一个参数指定)。然后**刷新 GUI 页面(F5)**。

> 运行中的服务器会热挂载用户 patch 层的新行;如果皮肤没出现,重启 `dsh web` 再刷新。

### 手动安装(任意平台)

1. 把本包复制到 harness 检出的 `packages/client/ui-eva`。
2. 注册三处(参见 harness 的 `packages/client/AGENTS.md`):`tsconfig.client.json` 引用、`packages/bundle/web-app/package.json` 依赖、web profile 的 `cordis.patch.yml` 行:

   ```yaml
   - insert:
       - id: ui-eva
         name: '@deepseek-ai/dsh-client-ui-eva'
   ```

3. 构建 bundle:`pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle`(需要 harness 工具链,见下)。

## 自定义

- **壁纸** — 替换 `assets/asuka.jpg`,然后 `pnpm run embed`(重新生成 `src/client/asuka.data.ts`)并重新构建。
- **配色** — `src/client/eva-theme.ts`(DARK 与 LIGHT 两套,按 token 分组)。
- **装饰** — 结构在 `src/client/eva-chrome.ts`;样式在 `src/client/eva.css.ts` 的 `#dsh-eva-chrome` 与输入框区块。

## 从源码构建

bundle 使用 harness 的共享 `tsdown.client.ts` 预设构建,因此独立仓库里构建需要一份 `deepseek-harness` 检出:把包放到 `packages/client/ui-eva`,然后在仓库根执行

```sh
pnpm install
pnpm exec tsc -b packages/client/ui-eva/tsconfig.json
pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle
```

## 卸载

删除 `$DSH_HOME/profiles/*/cordis.patch.yml` 中的 `ui-eva` 行和 `profiles/node_modules/@deepseek-ai/dsh-client-ui-eva` 链接,然后刷新 GUI(或重启 `dsh web`)。

## 说明

- `assets/asuka.jpg` 是《新世纪福音战士》角色明日香的同人图;发布或再分发本皮肤时请注意图片来源与版权。
- 皮肤只影响展示:不渲染工具、不注册命令、不产生会话事件——GUI 的模型可见面不受影响。

## License

MIT
