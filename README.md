# PKUChecklist · 北京大学校园鸟类名录

直接读取 CSV 的静态网站，无需 R、构建工具或外部 CDN。日常只需更新 CSV 与证据文件，网页会在访问时读取数据。

## 文件

- `index.html`：主页与物种详情抽屉。
- `assets/style.css`、`assets/app.js`：展示与交互；维护者无需编写 JavaScript。
- `PKUChecklist.csv`、`PKURecords.csv`：唯一权威数据源，保留原字段。
- `evidence/`：照片、录音等证据。

页面提供状态统计、目科联动筛选、搜索、排序与详情。点击物种打开抽屉；Esc、关闭按钮或遮罩可关闭。`#species=276` 可直接定位物种，支持浏览器后退。空状态显示“未标注”，统计包含排除条目，不自动推断记录状态。

## 本地预览

在项目根目录运行（需要 Python 3）：

```sh
python -m http.server 8000 --bind 127.0.0.1
```

打开 http://localhost:8000 。不能直接双击 HTML：浏览器通常禁止本地文件读取旁边的 CSV。部署后不需要 Python。浏览器必须启用 JavaScript。

## GitHub Pages

将项目文件提交到自己的仓库；Settings → Pages → Deploy from a branch → 选择 main、/(root) → Save。无需 Actions 构建。访问 Pages 给出的地址。内部文件使用相对路径，兼容仓库子路径。网站从 main 分支根目录发布。

## 维护数据

保持 UTF-8 CSV 编码和原表头。带逗号、换行或双引号的内容必须使用标准 CSV 引号规则（建议用表格软件导出）。物种编号唯一，重要记录通过 taxon_id 关联。不要直接编辑网页中的数据。

evidence 每格填写一个 HTTP(S) 地址或相对项目根目录的路径，例如 `evidence/276/20250319.jpg`；路径区分大小写，使用 `/`，不支持 `..`。jpg/jpeg/png/gif/webp 图片和 mp3/wav/ogg/m4a 音频内嵌；其他资源显示证据链接。外部网页链接不会自动提取里面的媒体。无证据时留空，不支持一格多个路径。备注按纯文本展示，避免将 CSV 内容作为 HTML 执行。

## 审阅与旧脚本

网站直接展示 CSV，无中间生成层，也无需上传 R 脚本。此前 R 脚本与旧 Actions 已移出仓库并备份到本次工作目录；如需 Markdown 审阅，可另行在本机运行备份脚本，不影响网站。当前数据没有媒体，真实媒体播放尚待加入素材后验证。

## 设计参考

布局参考作者另一个项目 [XizangAvifauna](https://github.com/lsq-010707/XizangAvifauna)：深绿色页头、侧栏筛选、物种列表与详情抽屉。
