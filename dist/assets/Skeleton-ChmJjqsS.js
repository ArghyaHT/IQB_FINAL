import{r as S,j as b}from"./index-BkrqFLdW.js";import{c as w}from"./clsx-B-dksMZM.js";import"./index-CIaaRRv5.js";import{s as k,g as R,a as $,b as x,m as M,u as T,c as A,d as E}from"./Modal-CcfTxvKK.js";import{r as U}from"./index-8JwjhRSi.js";var c=U,I={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},O={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},h={};h[c.ForwardRef]=I;h[c.Memo]=O;function p(){for(var t=arguments.length,a=new Array(t),e=0;e<t;e++)a[e]=arguments[e];return k(a)}var f=function(){var a=p.apply(void 0,arguments),e="animation-"+a.name;return{name:e,styles:"@keyframes "+e+"{"+a.styles+"}",anim:1,toString:function(){return"_EMO_"+this.name+"_"+this.styles+"_EMO_"}}};function _(t){return String(t).match(/[\d.\-+]*\s*(.*)/)[1]||""}function F(t){return parseFloat(t)}function N(t){return R("MuiSkeleton",t)}$("MuiSkeleton",["root","text","rectangular","rounded","circular","pulse","wave","withChildren","fitContent","heightAuto"]);const P=t=>{const{classes:a,variant:e,animation:r,hasChildren:n,width:o,height:s}=t;return A({root:["root",e,r,n&&"withChildren",n&&!o&&"fitContent",n&&!s&&"heightAuto"]},N,a)},i=f`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,l=f`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`,X=typeof i!="string"?p`
        animation: ${i} 2s ease-in-out 0.5s infinite;
      `:null,j=typeof l!="string"?p`
        &::after {
          animation: ${l} 2s linear 0.5s infinite;
        }
      `:null,W=x("span",{name:"MuiSkeleton",slot:"Root",overridesResolver:(t,a)=>{const{ownerState:e}=t;return[a.root,a[e.variant],e.animation!==!1&&a[e.animation],e.hasChildren&&a.withChildren,e.hasChildren&&!e.width&&a.fitContent,e.hasChildren&&!e.height&&a.heightAuto]}})(M(({theme:t})=>{const a=_(t.shape.borderRadius)||"px",e=F(t.shape.borderRadius);return{display:"block",backgroundColor:t.vars?t.vars.palette.Skeleton.bg:E(t.palette.text.primary,t.palette.mode==="light"?.11:.13),height:"1.2em",variants:[{props:{variant:"text"},style:{marginTop:0,marginBottom:0,height:"auto",transformOrigin:"0 55%",transform:"scale(1, 0.60)",borderRadius:`${e}${a}/${Math.round(e/.6*10)/10}${a}`,"&:empty:before":{content:'"\\00a0"'}}},{props:{variant:"circular"},style:{borderRadius:"50%"}},{props:{variant:"rounded"},style:{borderRadius:(t.vars||t).shape.borderRadius}},{props:({ownerState:r})=>r.hasChildren,style:{"& > *":{visibility:"hidden"}}},{props:({ownerState:r})=>r.hasChildren&&!r.width,style:{maxWidth:"fit-content"}},{props:({ownerState:r})=>r.hasChildren&&!r.height,style:{height:"auto"}},{props:{animation:"pulse"},style:X||{animation:`${i} 2s ease-in-out 0.5s infinite`}},{props:{animation:"wave"},style:{position:"relative",overflow:"hidden",WebkitMaskImage:"-webkit-radial-gradient(white, black)","&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(t.vars||t).palette.action.hover},
                transparent
              )`,content:'""',position:"absolute",transform:"translateX(-100%)",bottom:0,left:0,right:0,top:0}}},{props:{animation:"wave"},style:j||{"&::after":{animation:`${l} 2s linear 0.5s infinite`}}}]}})),B=S.forwardRef(function(a,e){const r=T({props:a,name:"MuiSkeleton"}),{animation:n="pulse",className:o,component:s="span",height:u,style:g,variant:y="text",width:v,...d}=r,m={...r,animation:n,component:s,variant:y,hasChildren:!!d.children},C=P(m);return b.jsx(W,{as:s,ref:e,className:w(C.root,o),ownerState:m,...d,style:{width:v,height:u,...g}})}),q=B;export{q as S};
