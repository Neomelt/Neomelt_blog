import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeInboxIndex(
  inbox,
  files,
  { banner, importedCopies = 0 } = {},
) {
  const cards = files.map((file) => {
    const id = file.split(".")[0];
    const artwork = `https://www.pixiv.net/artworks/${id}`;
    return [
      `<figure>`,
      `<a href="${artwork}" target="_blank" rel="noreferrer">`,
      `<img src="./${file}" loading="lazy">`,
      `</a>`,
      `<figcaption>`,
      `<label><input type="checkbox" data-image value="${id}"> ${id}</label>`,
      `<select data-action="${id}" aria-label="${id} 的操作">`,
      `<option value="accept">入池</option>`,
      `<option value="discard">删除</option>`,
      `</select>`,
      `<a href="${artwork}" target="_blank" rel="noreferrer">作品页</a>`,
      `</figcaption>`,
      `</figure>`,
    ].join("");
  });
  await writeFile(
    join(inbox, "index.html"),
    `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>封面候选</title>
<style>
body{background:#111;color:#ddd;font:14px system-ui;margin:0;padding:1rem}header{position:sticky;top:0;background:#111;padding:.5rem 0 1rem;z-index:1}.actions{display:flex;gap:1rem;flex-wrap:wrap;align-items:center}button,select{font:inherit;color:inherit;background:#252525;border:1px solid #666;border-radius:6px;padding:.5rem .8rem;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(340px,100%),1fr));gap:1rem}figure{margin:0}img{width:100%;border-radius:8px;display:block}figcaption{padding:.5rem 0;display:flex;justify-content:space-between;align-items:center}a{color:inherit}label{cursor:pointer}textarea{box-sizing:border-box;width:100%;background:#222;color:#eee;padding:.8rem;border:1px solid #555;border-radius:6px}#hint{min-height:1.5em}
</style></head><body>
<header><h1>封面候选</h1><p>勾选图片，为每张图选择操作，复制合并命令到项目目录执行。</p>
<div class="actions"><select id="target" aria-label="入池图片用途"><option value="cover" ${banner ? "" : "selected"}>文章封面</option><option value="banner" ${banner ? "selected" : ""}>背景图</option></select><button id="select-all">全选 / 取消</button><label><input type="checkbox" id="clean" ${importedCopies ? "" : "disabled"}> 同时清理已入池副本（${importedCopies}）</label><span id="count"></span></div>
<p>删除仅处理暂存区候选，后续自动抓图会跳过这些作品；手动传 ID 可重新下载。</p><textarea readonly aria-label="操作命令" placeholder="请先选择图片" rows="2"></textarea><p>点击命令框全选后复制；执行完成后刷新此页。</p></header><main class="grid">${cards.join("\n")}</main>
<script>
const images=[...document.querySelectorAll('[data-image]')];
const command=document.querySelector('textarea');
const target=document.querySelector('#target');
function update(){
  const plan={accept:[],discard:[]};
  for(const input of images.filter(input=>input.checked))plan[document.querySelector('[data-action="'+input.value+'"]').value].push(input.value);
  const parts=[];
  if(plan.accept.length)parts.push('--accept'+(target.value==='banner'?' --banner':'')+' '+plan.accept.join(' '));
  if(plan.discard.length)parts.push('--discard '+plan.discard.join(' '));
  if(document.querySelector('#clean').checked)parts.push('--clean');
  target.disabled=!plan.accept.length;
  document.querySelector('#count').textContent='入池 '+plan.accept.length+' 张，删除 '+plan.discard.length+' 张';
  command.value=parts.length?'npm run covers -- '+parts.join(' '):'';
}
document.addEventListener('change',event=>{if(event.target.matches?.('[data-action]'))images.find(input=>input.value===event.target.dataset.action).checked=true;update();});
document.querySelector('#select-all').onclick=()=>{const checked=images.some(input=>!input.checked);images.forEach(input=>input.checked=checked);update();};
command.addEventListener('click',()=>command.select());
update();
</script></body></html>`,
  );
}
