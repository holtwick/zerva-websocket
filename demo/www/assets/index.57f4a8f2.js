import{L as u,C as g,i as w,g as d,e as v,d as T,a as h,r as f,c as y,b as l,t as p,u as m,o as b,f as _}from"./vendor.28780c64.js";const C=function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function c(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerpolicy&&(t.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?t.credentials="include":e.crossorigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=c(e);fetch(e.href,t)}};C();var L="/zerva-websocket",k=new Uint8Array([9]),R=new Uint8Array([10]),M=(n=L)=>`ws${location.protocol.substr(4)}//${location.host}${n}`;u("websocket");var r=u("websocket"),E=1200,B=2500,N=3e4,S=class extends g{constructor(n,i={}){super();this.shouldConnect=!0,this.isConnected=!1,this.lastMessageReceived=0,this.unsuccessfulReconnects=0,this.pingCount=0,this.opt=i,this.url=n!=null?n:M(),w()?window.addEventListener("beforeunload",()=>this.disconnect()):typeof process!="undefined"&&process.on("exit",()=>this.disconnect()),this._connect()}postMessage(n){if(this.ws)this.ws.send(n);else throw new Error("Not connected!")}disconnect(){var n;r("disconnect"),clearTimeout(this.pingTimeout),clearTimeout(this.reconnectTimout),this.shouldConnect=!1,this.ws!=null&&((n=this.ws)==null||n.close(),this.ws=void 0)}dispose(){this.disconnect()}close(){this.disconnect()}_connect(){const{reconnectTimeoutBase:n=E,maxReconnectTimeout:i=B,messageReconnectTimeout:c=N}=this.opt;if(this.shouldConnect&&this.ws==null){r("_connect",this.url,this.unsuccessfulReconnects);const o=new WebSocket(this.url);this.ws=o,this.ws.binaryType="arraybuffer",this.isConnected=!1,o.addEventListener("message",s=>{r("onmessage",typeof s),this.lastMessageReceived=d();const a=s.data;clearTimeout(this.pingTimeout),v(a,R)?(r("-> pong"),this.pingCount++,c>0&&(this.pingTimeout=setTimeout(t,c/2))):this.emit("message",{data:a})});const e=s=>{r("onclose",s),clearTimeout(this.pingTimeout),this.ws!=null&&(this.ws=void 0,this.isConnected?this.isConnected=!1:this.unsuccessfulReconnects++,this.reconnectTimout=setTimeout(()=>this._connect(),Math.min(Math.log10(this.unsuccessfulReconnects+1)*n,i)))},t=()=>{this.ws===o&&(r("ping ->"),o.send(k))};o.addEventListener("close",()=>e()),o.addEventListener("error",s=>e(s)),o.addEventListener("open",()=>{r("onopen"),this.lastMessageReceived=d(),this.isConnected=!0,this.unsuccessfulReconnects=0,c>0&&(this.pingTimeout=setTimeout(t,c/2)),this.emit("connect")})}}connect(){r("connect"),this.shouldConnect=!0,!this.isConnected&&this.ws==null&&this._connect()}};const O=l("h1",null,"zerva-websocket demo",-1),x=T({setup(n){const i=h("app");i("app");let c=f({}),o=f({}),e=0;const t=new S;return t.on("message",s=>{o.value=s.data,i("message",JSON.parse(s.data))}),t.on("connect",()=>{i("channel connect"),e++,t.postMessage(JSON.stringify({from:"client",hello:"world",counter:e}))}),(s,a)=>(b(),y("div",null,[O,l("pre",null,p(m(c)),1),l("pre",null,p(m(o)),1)]))}}),A=h("main");A("app starts");_(x).mount("#app");
