# Run: Rscript scripts/generate_markdown.R [project_directory]
# Base R only. Sources are never modified. Output: checklist.md beside the source CSVs (all species accounts in one file).
args <- commandArgs(trailingOnly=TRUE)
root <- if(length(args)) args[1] else {
  f <- grep('^--file=', commandArgs(), value=TRUE)
  if(length(f)) dirname(dirname(normalizePath(sub('^--file=', '', f[1]), mustWork=TRUE))) else getwd()
}
root <- normalizePath(root, mustWork=TRUE)
read_source <- function(name, encoding, required) {
  d <- read.csv(file.path(root,name), fileEncoding=encoding, colClasses='character',
                na.strings=NULL, check.names=FALSE, strip.white=FALSE)
  if(anyDuplicated(names(d)) || !all(required %in% names(d))) stop(name, ': invalid/missing headers')
  for(k in required) if(any(is.na(d[[k]]) | !nzchar(trimws(d[[k]])))) stop(name, ': blank required field ', k)
  d
}
s <- read_source('PKUChecklist.csv','UTF-8-BOM',c('taxon_id','order','family','cn_name','sci_name','en_name','avibase_code'))
r <- read_source('PKURecords.csv','UTF-8-BOM',c('record_id','taxon_id','cn_name','date','observer','description'))
if(!all(c('status','remarks') %in% names(s)) || !all(c('location','evidence','note') %in% names(r))) stop('Missing optional-field columns')
for(k in c('taxon_id','cn_name','sci_name','avibase_code')) if(anyDuplicated(s[[k]])) stop('Duplicate checklist ',k)
if(anyDuplicated(r$record_id)) stop('Duplicate record_id')
if(any(!grepl('^[0-9]+$',s$taxon_id))) stop('taxon_id must contain digits only')
# Sort numerically by taxon_id without changing the source CSV.
s <- s[order(as.numeric(s$taxon_id)), , drop=FALSE]
m <- match(r$taxon_id,s$taxon_id)
if(anyNA(m)) stop('Unknown record taxon_id')
if(any(r$cn_name != s$cn_name[m])) stop('Record/checklist Chinese name mismatch')
date_text <- gsub('年|月','-',sub('日$','',r$date))
dates <- as.Date(date_text,format='%Y-%m-%d')
if(anyNA(dates)) stop('Invalid date: use YYYY-MM-DD or YYYY年M月D日')
esc <- function(x) {
 x <- gsub('&','&amp;',x,fixed=TRUE)
 x <- gsub('<','&lt;',x,fixed=TRUE)
 x <- gsub('>','&gt;',x,fixed=TRUE)
 x <- gsub('|','&#124;',x,fixed=TRUE)
 x <- gsub('[\r\n]+','<br>',x)
 for(ch in c('\\','*','_','[',']','`')) x <- gsub(ch,paste0('\\',ch),x,fixed=TRUE)
 x
}
# Evidence is one URL or project-relative path per cell; no delimiter assumed.
evidence <- function(x) {
 if(!nzchar(x)) return('')
 if(grepl('^https?://',x,ignore.case=TRUE)) target <- x else {
  x <- gsub('\\','/',x,fixed=TRUE)
  if(grepl('^/|^[A-Za-z]:|(^|/)\\.\\.(/|$)',x)) stop('Evidence must be a project-relative path or HTTP(S) URL: ',x)
  if(!file.exists(file.path(root,x))) warning('Missing evidence file: ',x)
  target <- x
 }
 paste0('[证据](<',gsub('>','%3E',gsub('<','%3C',gsub(' ','%20',target,fixed=TRUE),fixed=TRUE),fixed=TRUE),'>)')
}
ev <- vapply(r$evidence,evidence,character(1))
out <- root
write_md <- function(lines,path) { con <- file(path,'w',encoding='UTF-8'); on.exit(close(con)); writeLines(lines,con,useBytes=FALSE) }
# One document containing every species account, sorted numerically by taxon_id.
lines <- c('# 校园鸟类名录','')
for(i in seq_len(nrow(s))) {
 a <- s[i,]
 idx <- which(r$taxon_id==a$taxon_id)
 idx <- idx[order(dates[idx],r$record_id[idx])]
 if(i > 1L) lines <- c(lines,'---','')
 page <- c(paste0('## ',esc(a$cn_name)),'',
   paste0('**学名：** *',esc(a$sci_name),'*  '),
   paste0('**英文名：** ',esc(a$en_name)),'',
   paste0('**目：** ',esc(a$order),'　｜　**科：** ',esc(a$family)),'',
   paste0('**物种编号：** ',a$taxon_id,'　｜　**avibase：** ',esc(a$avibase_code)),'')
 if(nzchar(trimws(a$status))) page <- c(page,paste0('**状态：** ',esc(a$status)),'')
 if(nzchar(trimws(a$remarks))) page <- c(page,'### 概述','',esc(a$remarks),'')
 if(length(idx)) page <- c(page,'### 重要记录','')
 for(j in idx) {
   entry <- paste0('- **',esc(r$date[j]),'**')
   if(nzchar(r$location[j])) entry <- paste0(entry,'，',esc(r$location[j]))
   entry <- paste0(entry,'：',esc(r$description[j]),'（观察者：',esc(r$observer[j]),'）。')
   if(nzchar(ev[j])) entry <- paste(entry,ev[j])
   if(nzchar(r$note[j])) entry <- paste0(entry,' 备注：',esc(r$note[j]))
   page <- c(page,entry,paste0('  <!-- record_id: ',esc(r$record_id[j]),' -->'))
 }
 lines <- c(lines,page,'')
}
write_md(lines,file.path(out,'checklist.md'))
message('Generated ',nrow(s),' species accounts in one Markdown file in ',out)