# 校园鸟类名录

维护根目录的 `PKUChecklist.csv` 和 `PKURecords.csv`（UTF-8 编码），生成结果为同目录的 [checklist.md](checklist.md)。请勿直接编辑生成文件。

## 目录

- `scripts/generate_markdown.R`：校验数据并生成 Markdown，无额外 R 包依赖。
- `evidence/`：照片、录音及其他证据文件。
- `.github/workflows/build.yml`：自动生成流程。

## 更新和测试

修改 CSV 或上传证据并提交到 main 后，Actions 自动运行并将更新后的 checklist.md 提交回来。也可进入 Actions → Build checklist → Run workflow 手动运行。提交合并请求时只校验和生成，不写回分支。

本地运行：`Rscript scripts/generate_markdown.R`。

`taxon_id` 关联两个表，物种按编号数值升序排列；重要记录按日期升序排列。保留源数据，不自动补写或修改 CSV。

## 证据

证据列 `evidence` 每格填写一个 HTTP(S) 链接或相对仓库根目录的路径，例如 `evidence/276/20250319.jpg`；路径区分大小写，使用 `/`。没有证据时留空。多证据分隔规则尚未定义，不要用分号拼接多个路径。
