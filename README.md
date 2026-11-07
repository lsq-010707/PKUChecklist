# PKUChecklist · 北京大学校园鸟类名录

[在线名录](https://lsq-010707.github.io/PKUChecklist/)

## 日常更新

编辑 `PKUChecklist.csv`（物种）和 `PKURecords.csv`（重要记录），上传证据文件，然后提交到 GitHub 的 main 分支。GitHub Pages 自动发布，无需 R、Markdown 生成或自定义 Actions。

保留现有表头，使用 UTF-8 标准 CSV；包含逗号、换行或双引号的单元格需按 CSV 规则转义。taxon_id 关联两个表，record_id 唯一。空状态显示“未标注”，不代表确认；统计包含排除条目。

证据放在 `evidence/`，在记录的 evidence 列填写一个相对路径（例如 `evidence/276/20250319.jpg`）或 HTTP(S) 地址。使用 `/`，路径区分大小写，不支持 `..` 或一格多个地址。图片 jpg/jpeg/png/gif/webp、音频 mp3/wav/ogg/m4a 自动内嵌，其他资源显示链接。备注按纯文本显示。

## 本地预览

在本目录运行 `python -m http.server 8000 --bind 127.0.0.1`，打开 http://localhost:8000 。需要 Python 3；在线网站无需安装软件。不要双击 HTML，浏览器需要通过 HTTP 读取 CSV，并启用 JavaScript。

## 发布设置与文件

GitHub Settings → Pages → Deploy from a branch → main → /(root)。

- `index.html`、`assets/`：网页与交互，无外部 CDN 依赖。
- 两个 CSV：权威数据源。
- `evidence/`：证据素材。
- `.nojekyll`：直接发布静态文件。
- `.gitignore`：忽略本机临时文件。

布局参考 [XizangAvifauna](https://github.com/lsq-010707/XizangAvifauna)。物种详情支持 `#species=276` 链接。
