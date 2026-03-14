# image-hosting

一个基于 Next.js App Router 的图片展示项目，前端界面参考了 EdgeOne Random Picture 的结构风格：

- `/` 首页使用全屏随机背景图和极简入口布局
- `/gallery` 提供独立图库页和图片预览弹层
- `/api/random` 支持随机跳转图片，也支持 `?redirect=false` 返回 JSON

## Start

```bash
npm install
npm run dev
```

把图片文件放进 `public/image-scenery/` 即可。

- 本地运行 `npm run dev` 前会自动生成 `public/image-scenery/images.json`
- EdgeOne Pages 部署时只要执行 `npm run build`，构建前也会自动刷新图片元数据
- 生成内容包含文件名、文件大小、宽高、方向和前端可直接使用的访问路径
