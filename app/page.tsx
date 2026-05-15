"use client";

import { useEffect } from "react";

export default function Home() {

useEffect(() => {

const itemsWrap =
document.getElementById("items");

async function sendMessage(){

const input =
document.getElementById(
"input"
) as HTMLTextAreaElement;

const text =
input.value.trim();

if(!text) return;

addMessage("user", text);

input.value = "";

const loadingId =
Date.now();

addLoading(loadingId);

try{

const response =
await fetch("/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
message:text
})
});

const data =
await response.json();

removeLoading(loadingId);

addMessage(
"ai",
data.answer || "Нет ответа"
);

}catch(e){

removeLoading(loadingId);

addMessage(
"ai",
"Ошибка соединения"
);

}

}

function addMessage(
type:string,
text:string
){

const chat =
document.getElementById("chat");

if(!chat) return;

chat.innerHTML += `
<div class="msg ${type}">
${text}
</div>
`;

chat.scrollTop =
chat.scrollHeight;

}

function addLoading(id:number){

const chat =
document.getElementById("chat");

if(!chat) return;

chat.innerHTML += `
<div
class="msg ai loading"
id="loading-${id}"
>
AI думает...
</div>
`;

chat.scrollTop =
chat.scrollHeight;

}

function removeLoading(id:number){

const el =
document.getElementById(
`loading-${id}`
);

if(el) el.remove();

}

async function loadPreview(){

try{

const response =
await fetch("/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
message:"c-"
})
});

const data =
await response.json();

const lines =
(data.answer || "")
.split("\n")
.slice(0,8);

if(!itemsWrap) return;

itemsWrap.innerHTML = "";

lines.forEach(line=>{

if(!line.trim()) return;

itemsWrap.innerHTML += `
<div class="item">

<div class="code">
${line.split("—")[0] || ""}
</div>

<div class="small">
${line}
</div>

</div>
`;

});

}catch(e){

if(itemsWrap)
itemsWrap.innerHTML =
"Ошибка загрузки";

}

}

loadPreview();

(window as any).sendMessage =
sendMessage;

}, []);

return (
<>
<style>{`

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
background:#05070d;
color:white;
font-family:-apple-system,BlinkMacSystemFont,sans-serif;
}

.app{
max-width:430px;
margin:auto;
min-height:100vh;
padding-bottom:120px;
background:#05070d;
}

.logo{
display:flex;
justify-content:center;
padding:24px 0;
}

.left{
background:#111;
color:#ffe08a;
padding:12px 18px;
font-size:34px;
font-weight:900;
border-radius:14px 0 0 14px;
}

.right{
background:#d63b3b;
color:white;
padding:12px 18px;
font-size:34px;
font-weight:900;
border-radius:0 14px 14px 0;
}

.card{
margin:14px;
padding:18px;
border-radius:26px;
background:#0d1323;
border:1px solid rgba(255,255,255,.04);
}

h2{
margin-bottom:16px;
font-size:22px;
}

.chat{
height:420px;
overflow:auto;
padding-right:4px;
}

.msg{
padding:14px;
border-radius:18px;
margin-bottom:12px;
line-height:1.6;
font-size:15px;
white-space:pre-wrap;
}

.ai{
background:#171d35;
}

.user{
background:#5b6cff;
}

textarea{
width:100%;
height:90px;
resize:none;
border:none;
outline:none;
border-radius:18px;
background:#080c17;
color:white;
padding:14px;
font-size:15px;
margin-top:10px;
}

button{
width:100%;
padding:16px;
border:none;
border-radius:18px;
margin-top:12px;
background:linear-gradient(
135deg,
#5668ff,
#7b5cff
);
color:white;
font-size:16px;
font-weight:800;
cursor:pointer;
}

.items{
display:flex;
flex-direction:column;
gap:10px;
}

.item{
padding:14px;
border-radius:18px;
background:#121a30;
border:1px solid rgba(255,255,255,.05);
}

.code{
font-size:18px;
font-weight:800;
margin-bottom:8px;
}

.small{
color:#aab4da;
font-size:14px;
line-height:1.6;
}

.loading{
opacity:.7;
animation:pulse 1s infinite;
}

@keyframes pulse{
0%{opacity:.4}
50%{opacity:1}
100%{opacity:.4}
}

`}</style>

<div className="app">

<div className="logo">
<div className="left">ОИЛ</div>
<div className="right">СПЕКТР</div>
</div>

<div className="card">

<h2>🤖 Inventory AI</h2>

<div id="chat" className="chat">

<div className="msg ai">
База подключена.

Теперь можно спрашивать:

• сколько c-110
• сколько масляных
• сколько воздушных
• что заканчивается
• что надо заказать
• есть miles a-1003
• покажи vic
• топливные фильтры
</div>

</div>

<textarea
id="input"
placeholder="Введите запрос..."
></textarea>

<button
onClick={()=>
(window as any).sendMessage()
}
>
Отправить
</button>

</div>

<div className="card">

<h2>📦 Последние товары</h2>

<div
id="items"
className="items"
></div>

</div>

</div>
</>
);

}