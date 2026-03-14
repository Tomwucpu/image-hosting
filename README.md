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

图片数据来自 `public/image-scenery/images.json`，图片文件放在 `public/image-scenery/` 下即可。
