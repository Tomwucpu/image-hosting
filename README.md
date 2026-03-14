# image-hosting

一个基于 Next.js App Router 的图片展示项目，前端界面参考了 EdgeOne Random Picture 的结构风格：

- `/` 首页使用全屏随机背景图和极简入口布局
- `/gallery` 提供独立图库页和图片预览弹层
- `/api/random` 支持随机跳转图片，也支持 `?redirect=false` 返回精简 JSON

## Start

```bash
npm install
npm run dev
```

把图片文件放进 `public/image-scenery/` 即可。

- 本地运行 `npm run dev` 前会自动生成 `public/image-scenery/images.json`
- EdgeOne Pages 部署时只要执行 `npm run build`，构建前也会自动刷新图片元数据
- 清单只保留文件名、文件大小和宽高等核心原始信息，运行时再计算方向、展示文案和访问路径
- `?redirect=false` 默认只返回 `filename`、`url`、`type`、`orientation` 这几个核心字段
