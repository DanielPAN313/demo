# 24h Agent

24h 个人节律调度 Agent 黑客松前端 Demo。

这是一个纯前端 React + TypeScript 项目，用于演示 Agent 如何根据固定日程、任务、用户状态、外部事件动态生成今日排期，并通过注意力防火墙决定通知是否打扰用户。

## 快速运行

```bash
npm install
npm run dev
```

默认会启动 Vite 开发服务，浏览器打开终端提示的本地地址即可。

## 构建检查

```bash
npm run build
```

## 技术栈

- Vite
- React
- TypeScript
- 纯前端 mock 数据
- 规则型 Agent Pipeline

## Demo 功能

- 今日节律状态 Dashboard
- 一天排期 Timeline
- Agent 建议与解释 AgentPanel
- 注意力防火墙 AttentionFirewall
- Demo 场景按钮：
  - 睡眠差
  - 压力高
  - 插入 GitHub P1
  - 进入夜间模式
  - 生成晨报

## 目录结构

```text
src/
  app/          全局状态与 App 页面
  agents/       Priority / State / Schedule / Event / Interaction / Explain Agents
  components/   控制台 UI 组件
  core/         Agent Orchestrator、运行上下文、Pipeline
  data/         黑客松 mock 数据
  modules/      scheduleEngine、notificationEngine、morningBrief、timeWindows
  types/        核心 TypeScript 类型
  utils/        时间与格式化工具
```

## 复现方式

别人拿到仓库后，只需要在仓库根目录执行：

```bash
npm install
npm run dev
```

不需要后端服务，不需要额外环境变量。
