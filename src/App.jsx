import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Home, Receipt, CreditCard, PiggyBank, MoreHorizontal, ChevronLeft,
  ChevronRight, Plus, X, Check, AlertTriangle, TrendingUp, Wallet,
  Settings, Edit3, Trash2, Archive, Moon, Sun, Monitor,
  Target, ShoppingCart, Car, Baby, Dog, Scissors, Gamepad2,
  Utensils, Zap, Heart, BookOpen, Plane, Gift, Wrench, Smartphone,
  Music, Coffee, Briefcase, Landmark, Users, DollarSign, RefreshCw,
  Shield, Star, RotateCcw, Play, Download, Upload, Copy, Tag, Cloud, CloudOff, LogIn, LogOut
} from "lucide-react";

const CSS = `
:root {
  --bg:#FAF8F5;--bg2:#F3F0EB;--card:#FFFFFF;--text:#1A1A1A;--text2:#6B6560;
  --text3:#A8A29E;--text4:#D1CBC4;--sep:rgba(120,110,100,.08);--sep2:rgba(120,110,100,.04);
  --accent:#C8956C;--accent2:rgba(200,149,108,.12);--green:#5B9A6F;--green2:rgba(91,154,111,.10);
  --red:#C45B52;--red2:rgba(196,91,82,.10);--orange:#C89040;--orange2:rgba(200,144,64,.10);
  --purple:#8B7BB5;--purple2:rgba(139,123,181,.10);--blue:#6B8EB5;--blue2:rgba(107,142,181,.10);
  --r:20px;--r2:14px;--r3:10px;
}
.dark{--bg:#0C0B0A;--bg2:#161514;--card:#1C1B19;--text:#F5F0EB;--text2:#A8A29E;--text3:#706B66;--text4:#3D3A37;--sep:rgba(255,245,230,.06);--sep2:rgba(255,245,230,.03);--accent2:rgba(200,149,108,.18);--green2:rgba(91,154,111,.15);--red2:rgba(196,91,82,.15);--orange2:rgba(200,144,64,.15);--purple2:rgba(139,123,181,.15);--blue2:rgba(107,142,181,.15);}
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
body{background:var(--bg);margin:0;}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
input[type=number]{-moz-appearance:textfield;}
@keyframes modalUp{from{transform:translateY(100%);opacity:.5}to{transform:translateY(0);opacity:1}}
.sa-top{padding-top:env(safe-area-inset-top);}
.sa-bot{padding-bottom:env(safe-area-inset-bottom);}
.sa-bot-nav{padding-bottom:calc(env(safe-area-inset-bottom) + 8px);}
.sa-fab{bottom:calc(100px + env(safe-area-inset-bottom));}
.sa-toast{top:calc(60px + env(safe-area-inset-top));}
.sa-onb-bot{padding-bottom:calc(env(safe-area-inset-bottom) + 36px);}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
`;

/* ══ CONSTANTS ══ */
const SK="bp-v4";
const MONTHS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ICONS={ShoppingCart,Car,Baby,Dog,Scissors,Gamepad2,Utensils,Zap,Heart,BookOpen,Plane,Gift,Wrench,Smartphone,Music,Coffee,Briefcase,Receipt,PiggyBank,Wallet,CreditCard,Home,Landmark,DollarSign};
const ICON_KEYS=Object.keys(ICONS);
const COLORS=["#C8956C","#5B9A6F","#C89040","#C45B52","#8B7BB5","#D4837A","#6B8EB5","#B5A36B","#7BB5A8","#B57BB0","#7BAD5B","#B56B6B"];
const SAV_TYPES=[{v:"livret",l:"Livret"},{v:"pea",l:"PEA"},{v:"assurance_vie",l:"Assurance-vie"},{v:"autre",l:"Autre"}];
const INV_TYPES=[{v:"pea",l:"PEA"},{v:"assurance_vie",l:"Assurance-vie"},{v:"crypto",l:"Crypto"},{v:"trading",l:"Trading"}];
const FREQ=[{v:"monthly",l:"Mensuel"},{v:"quarterly",l:"Trimestriel"},{v:"annual",l:"Annuel"}];

/* ══ UTILS ══ */
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const eur=n=>{if(n==null||isNaN(n))return"0,00 €";return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:2}).format(n);};
const pct=n=>`${Math.round(clamp(n,0,999))}%`;
const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const parseMonthKey=k=>{const[y,m]=k.split("-").map(Number);return new Date(y,m-1,1);};
const monthLabel=k=>{const d=parseMonthKey(k);return`${MONTHS[d.getMonth()]} ${d.getFullYear()}`;};
const addMonths=(k,n)=>{const d=parseMonthKey(k);d.setMonth(d.getMonth()+n);return monthKey(d);};
const nowKey=()=>monthKey(new Date());
const canNav=k=>k<=addMonths(nowKey(),1);
const today=()=>new Date().toISOString().slice(0,10);
const calcMP=(C,t,n)=>{if(!C||!n||n<=0)return 0;if(!t||t<=0)return C/n;const r=t/100/12;return C*r/(1-Math.pow(1+r,-n));};
const calcCRD=(C,t,n,e)=>{if(!C||!n)return 0;if(e>=n)return 0;if(!t||t<=0)return Math.max(0,C-(C/n)*e);const r=t/100/12;const m=calcMP(C,t,n);return Math.max(0,C*Math.pow(1+r,e)-m*(Math.pow(1+r,e)-1)/r);};
const loanMonths=(s,e)=>{if(!s||!e)return{t:0,e:0,r:0};const sd=new Date(s),ed=new Date(e),nd=new Date();const t=Math.max(0,(ed.getFullYear()-sd.getFullYear())*12+(ed.getMonth()-sd.getMonth()));const el=clamp((nd.getFullYear()-sd.getFullYear())*12+(nd.getMonth()-sd.getMonth()),0,t);return{t,e:el,r:t-el};};

/* ══ STORAGE (multi-household) ══ */
const META_KEY="bp-v4-meta";
const hKey=id=>"bp-v4-h-"+id;
const loadMeta=async()=>{try{const r=await window.storage.get(META_KEY);return r&&r.value?JSON.parse(r.value):null;}catch(e){return null;}};
const saveMeta=async m=>{try{await window.storage.set(META_KEY,JSON.stringify(m));}catch(e){}};
const load=async id=>{try{const r=await window.storage.get(hKey(id));return r&&r.value?JSON.parse(r.value):null;}catch(e){return null;}};
const save=async(id,s)=>{try{await window.storage.set(hKey(id),JSON.stringify(s));}catch(e){}};
const migrateOld=async()=>{try{const r=await window.storage.get(SK);if(r&&r.value){const data=JSON.parse(r.value);const id=uid();const meta={households:[{id,name:"Mon foyer",created:new Date().toISOString()}],active:id};await saveMeta(meta);await save(id,data);try{await window.storage.delete(SK);}catch(e){}return{meta,data};}return null;}catch(e){return null;}};
/* ══ EXPORT UTILS ══ */
const dlFile=(content,name,type)=>{const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);};
const exportJSON=(state,name)=>dlFile(JSON.stringify(state,null,2),name+".json","application/json");
const exportCSV=(state,name)=>{
  const rows=[["Date","Catégorie","Montant","Description","Mois"]];
  const cats=(state.cfg?.categories||[]);
  Object.entries(state.months||{}).forEach(([mk,md])=>{
    (md.exp||[]).forEach(e=>{const c=cats.find(x=>x.id===e.cid);rows.push([e.date,c?.name||"",String(e.amount||0),e.desc||"",mk]);});
  });
  dlFile(rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n"),name+".csv","text/csv");
};
const exportBackup=async(meta)=>{
  const backup={meta,households:{}};
  for(const h of meta.households){const d=await load(h.id);if(d)backup.households[h.id]=d;}
  dlFile(JSON.stringify(backup,null,2),"budget-backup-"+new Date().toISOString().slice(0,10)+".json","application/json");
};

/* ══ TOAST CONTEXT ══ */
const ToastCtx=createContext(()=>{});
function ToastProvider({children}){
  const[toasts,setToasts]=useState([]);
  const show=useCallback((msg,type)=>{
    const id=uid();
    setToasts(p=>[...p,{id,msg,type:type||"ok"}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),2200);
  },[]);
  return(
    <ToastCtx.Provider value={show}>
      {children}
      <div className="sa-toast" style={{position:"fixed",left:"50%",transform:"translateX(-50%)",zIndex:99,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        {toasts.map(t=>(
          <div key={t.id} style={{padding:"10px 24px",borderRadius:100,background:t.type==="ok"?"var(--green)":"var(--red)",color:"#fff",fontSize:13,fontWeight:600,letterSpacing:-.2,boxShadow:"0 8px 32px rgba(0,0,0,.12)",animation:"toastIn .28s cubic-bezier(.32,.72,0,1)"}}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ══ DATA DEFAULTS ══ */
function defaultCats(){return[
  {id:uid(),name:"Courses",icon:"ShoppingCart",color:COLORS[0],o:0},
  {id:uid(),name:"Carburant",icon:"Car",color:COLORS[1],o:1},
  {id:uid(),name:"Bébé",icon:"Baby",color:COLORS[2],o:2},
  {id:uid(),name:"Animaux",icon:"Dog",color:COLORS[3],o:3},
  {id:uid(),name:"Santé",icon:"Heart",color:COLORS[4],o:4},
  {id:uid(),name:"Loisirs",icon:"Gamepad2",color:COLORS[5],o:5},
  {id:uid(),name:"Restaurants",icon:"Utensils",color:COLORS[6],o:6},
  {id:uid(),name:"Transports",icon:"Car",color:COLORS[7],o:7},
];}

function defaultMonth(k,state){
  const cats=(state?.cfg?.categories||[]).filter(c=>!c.ar);
  const ps=state?.cfg?.persons||[{id:"A",name:"A",type:"adult"}];
  const adults=ps.filter(p=>(p.type||"adult")==="adult");
  /* Find previous month data for carry-forward */
  const months=state?.months||{};
  const sorted=Object.keys(months).filter(m=>m<k).sort();
  const prev=sorted.length>0?months[sorted[sorted.length-1]]:null;

  if(prev&&prev.ok){
    /* Carry forward: revenues, charges, variable budgets from previous month */
    return{
      ok:false,
      rev:(prev.rev||[]).map(r=>({...r,id:uid()})),
      charges:(state?.loans||[]).filter(l=>!l.ar).map(l=>{const m=loanMonths(l.s,l.e);return{id:uid(),name:l.name,amount:l.ac?calcMP(l.cap,l.rate,m.t):l.mp,freq:"monthly",lid:l.id,auto:true};}).concat((prev.charges||[]).filter(c=>!c.auto).map(c=>({...c,id:uid()}))),
      alloc:Object.fromEntries(ps.map(p=>[p.id,{fc:0,vc:0,sav:[],inv:[]}])),
      cb:(prev.cb||[]).map(b=>({...b})),
      exp:[]
    };
  }
  /* First month: empty revenues (user creates them) */
  return{
    ok:false,
    rev:adults.map(p=>({id:uid(),label:"Salaire "+p.name,amount:0,pid:p.id,type:"salary"})),
    charges:(state?.loans||[]).filter(l=>!l.ar).map(l=>{const m=loanMonths(l.s,l.e);return{id:uid(),name:l.name,amount:l.ac?calcMP(l.cap,l.rate,m.t):l.mp,freq:"monthly",lid:l.id,auto:true};}),
    alloc:Object.fromEntries(ps.map(p=>[p.id,{fc:0,vc:0,sav:[],inv:[]}])),
    cb:cats.map(c=>({cid:c.id,budget:0})),
    exp:[]
  };
}

function defaultState(persons,cats){
  return{cfg:{dark:"auto",persons:persons,categories:cats||defaultCats(),onb:true},loans:[],savings:[],investments:[],months:{}};
}

/* ══ COMPUTATIONS ══ */
const getMonth=(s,k)=>s.months[k]||defaultMonth(k,s);
const sumRev=md=>(md.rev||[]).reduce((s,r)=>s+(r.amount||0),0);
const revPerson=(md,pid)=>(md.rev||[]).filter(r=>r.pid===pid).reduce((s,r)=>s+(r.amount||0),0);
const sumAid=md=>(md.rev||[]).filter(r=>r.type==="aid").reduce((s,r)=>s+(r.amount||0),0);
const sumFC=md=>(md.charges||[]).reduce((s,c)=>s+(c.amount||0),0);
const prorata=(md,ps)=>{const adults=ps.filter(p=>(p.type||"adult")==="adult");const t=sumFC(md),a=sumAid(md),rm=Math.max(0,t-a);if(adults.length===0)return{};const sl=adults.map(p=>({id:p.id,s:revPerson(md,p.id)}));const ts=sl.reduce((s,x)=>s+x.s,0);if(ts===0)return Object.fromEntries(sl.map(x=>[x.id,rm/sl.length]));return Object.fromEntries(sl.map(x=>[x.id,rm*(x.s/ts)]));};
const sumVarBudget=md=>(md.cb||[]).reduce((s,b)=>s+(b.budget||0),0);
const sumSpent=(md,cid)=>(md.exp||[]).filter(e=>!cid||e.cid===cid).reduce((s,e)=>s+(e.amount||0),0);
const personBalance=(md,pid)=>{const r=revPerson(md,pid),a=md.alloc?.[pid]||{};return r-(a.fc||0)-(a.vc||0)-((a.sav||[]).reduce((s,x)=>s+(x.amount||0),0))-((a.inv||[]).reduce((s,x)=>s+(x.amount||0),0));};
const savBalance=a=>(a.balance||0)+(a.movements||[]).reduce((s,m)=>s+(m.amount||0),0);

/* ══ UI PRIMITIVES ══ */
function EditableName({value,onCommit,style:s}){
  const[v,setV]=useState(value);
  useEffect(()=>{setV(value);},[value]);
  return (<input value={v} onChange={e=>setV(e.target.value)} onBlur={()=>{if(v!==value)onCommit(v);}} style={s}/>);
}
function Ico({name,size,color}){const C=ICONS[name]||Receipt;return (<C size={size||18} color={color} strokeWidth={1.8}/>);}

const pressHandlers={
  onMouseDown:e=>{e.currentTarget.style.transform="scale(0.97)";e.currentTarget.style.opacity="0.85";},
  onMouseUp:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";},
  onMouseLeave:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";}
};

function Card({children,onClick,p}){
  return(
    <div onClick={onClick} style={{background:"var(--card)",borderRadius:"var(--r)",padding:p!=null?p:16,cursor:onClick?"pointer":"default",transition:"transform .15s,opacity .15s"}} {...(onClick?pressHandlers:{})}>
      {children}
    </div>
  );
}

function KPI({label,value,color,sub,onClick}){
  return(
    <Card onClick={onClick}>
      <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.6,margin:"0 0 6px"}}>{label}</p>
      <p style={{fontSize:24,fontWeight:700,color:color||"var(--text)",letterSpacing:-.8,lineHeight:1,margin:0}}>{value}</p>
      {sub&&<p style={{fontSize:12,color:"var(--text3)",margin:"6px 0 0"}}>{sub}</p>}
    </Card>
  );
}

function Btn({children,v,full,sm,disabled,onClick,style:extraStyle}){
  const variant=v||"primary";
  const base={border:"none",borderRadius:14,fontSize:sm?13:15,fontWeight:600,letterSpacing:-.2,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,cursor:disabled?"default":"pointer",opacity:disabled?.35:1,transition:"all .15s",padding:sm?"8px 14px":"14px 22px",width:full?"100%":undefined};
  const variants={primary:{background:"var(--accent)",color:"#fff"},secondary:{background:"var(--accent2)",color:"var(--accent)"},danger:{background:"var(--red2)",color:"var(--red)"},ghost:{background:"transparent",color:"var(--accent)"},muted:{background:"var(--sep)",color:"var(--text2)"}};
  return (<button disabled={disabled} onClick={onClick} style={{...base,...variants[variant],...extraStyle}} {...(disabled?{}:pressHandlers)}>{children}</button>);
}

function Inp({label,suffix,error,...props}){
  return(
    <div>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 6px"}}>{label}</label>}
      <div style={{position:"relative"}}>
        <input {...props} style={{width:"100%",background:"var(--bg2)",border:"1.5px solid "+(error?"var(--red)":"transparent"),borderRadius:14,padding:"13px 16px",paddingRight:suffix?42:16,fontSize:15,fontWeight:500,color:"var(--text)",outline:"none",transition:"all .2s",...(props.style||{})}}
          onFocus={e=>{e.target.style.borderColor="var(--accent)";e.target.style.background="var(--card)";}}
          onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="var(--bg2)";}}
        />
        {suffix&&<span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:13,fontWeight:600,color:"var(--text3)"}}>{suffix}</span>}
      </div>
    </div>
  );
}

function Sel({label,options,value,onChange}){
  return(
    <div>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 6px"}}>{label}</label>}
      <select value={value} onChange={onChange} style={{width:"100%",background:"var(--bg2)",border:"1.5px solid transparent",borderRadius:14,padding:"13px 16px",fontSize:15,fontWeight:500,color:"var(--text)",outline:"none",appearance:"none"}}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(20,18,15,.3)",backdropFilter:"blur(12px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"var(--card)",borderRadius:"28px 28px 0 0",width:"100%",maxWidth:440,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",animation:"modalUp .38s cubic-bezier(.32,.72,0,1)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 16px",borderBottom:"1px solid var(--sep)"}}>
          <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",margin:0,letterSpacing:-.3}}>{title}</h3>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:15,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={14} color="var(--text3)"/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:22}}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({open,onClose,onOk,msg}){
  return(
    <Modal open={open} onClose={onClose} title="Confirmation">
      <p style={{fontSize:15,color:"var(--text2)",margin:"0 0 24px",lineHeight:1.5}}>{msg}</p>
      <div style={{display:"flex",gap:12}}>
        <Btn v="muted" full onClick={onClose}>Annuler</Btn>
        <Btn v="danger" full onClick={()=>{onOk();onClose();}}>Confirmer</Btn>
      </div>
    </Modal>
  );
}

function Prog({val,max,color,h}){
  const height=h||6;const pv=max>0?clamp(val/max*100,0,100):0;
  return(
    <div style={{width:"100%",height:height,background:"var(--sep)",borderRadius:height,overflow:"hidden"}}>
      <div style={{height:"100%",width:Math.min(pv,100)+"%",background:val>max?"var(--red)":(color||"var(--accent)"),borderRadius:height,transition:"width .7s cubic-bezier(.32,.72,0,1)"}}/>
    </div>
  );
}

function EmptyState({icon:I2,msg,action,onAction}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"52px 20px",color:"var(--text3)"}}>
      <div style={{width:52,height:52,borderRadius:16,background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><I2 size={22}/></div>
      <p style={{fontSize:14,margin:action?"0 0 16px":0}}>{msg}</p>
      {action&&<Btn v="secondary" sm onClick={onAction}>{action}</Btn>}
    </div>
  );
}

function AlertBanner({msg,type,onClick}){
  const c={info:{bg:"var(--blue2)",c:"var(--blue)"},danger:{bg:"var(--red2)",c:"var(--red)"},warning:{bg:"var(--orange2)",c:"var(--orange)"}};
  const t=type||"info";
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderRadius:"var(--r2)",background:c[t].bg,color:c[t].c,fontSize:14,fontWeight:600,cursor:onClick?"pointer":"default"}}>
      <AlertTriangle size={16}/><span style={{flex:1}}>{msg}</span>{onClick&&<ChevronRight size={16} style={{opacity:.5}}/>}
    </div>
  );
}

function SegTabs({items,active,onChange}){
  return(
    <div style={{display:"flex",background:"var(--bg2)",borderRadius:12,padding:3,gap:2}}>
      {items.map(t=>(
        <button key={t.v} onClick={()=>onChange(t.v)} style={{flex:1,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:600,letterSpacing:-.2,border:"none",background:active===t.v?"var(--card)":"transparent",color:active===t.v?"var(--text)":"var(--text3)",cursor:"pointer",transition:"all .2s",boxShadow:active===t.v?"0 1px 3px rgba(0,0,0,.04)":"none"}}>{t.l}</button>
      ))}
    </div>
  );
}

function SecTitle({title,right}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 0 10px"}}>
      <p style={{fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.8,margin:0}}>{title}</p>
      {right}
    </div>
  );
}

function Row({left,right,sub,onClick,icon,iconBg}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",cursor:onClick?"pointer":"default",borderBottom:"1px solid var(--sep2)"}}>
      {icon&&<div style={{width:40,height:40,borderRadius:12,background:iconBg||"var(--accent2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:15,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",margin:0}}>{left}</p>
        {sub&&<p style={{fontSize:13,color:"var(--text3)",margin:"2px 0 0"}}>{sub}</p>}
      </div>
      {right&&<div style={{textAlign:"right",flexShrink:0}}>{right}</div>}
      {onClick&&<ChevronRight size={16} color="var(--text4)"/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ONBOARDING
   ══════════════════════════════════════════════════════ */
function Onboarding({onDone}){
  const[step,setStep]=useState(0);
  const[nbP,setNbP]=useState(2);
  const[names,setNames]=useState(["",""]);
  const[charges,setCharges]=useState([]);
  const[chgForm,setChgForm]=useState({name:"",amount:"",freq:"monthly"});
  const[catList,setCatList]=useState(defaultCats());
  const[catForm,setCatForm]=useState({name:"",icon:"ShoppingCart",color:COLORS[0]});
  const[showCatForm,setShowCatForm]=useState(false);
  const[loans,setLoans]=useState([]);
  const[loanForm,setLoanForm]=useState({name:"Crédit immobilier",cap:"",rate:"3.5",s:"2024-01-01",e:"2048-12-31"});
  const[savAccounts,setSavAccounts]=useState([]);
  const[savForm,setSavForm]=useState({name:"",type:"livret",bal:""});
  const[invAccounts,setInvAccounts]=useState([]);
  const[invForm,setInvForm]=useState({name:"",type:"pea",bal:""});

  const STEPS=6;
  const stepTitles=["Foyer","Charges fixes","Catégories","Prêts","Épargne","Investissements"];

  const finish=()=>{
    const ps=Array.from({length:nbP},(_,i)=>({id:String.fromCharCode(65+i),name:names[i]||"Personne "+String.fromCharCode(65+i),type:"adult"}));
    const st=defaultState(ps,catList);
    /* Add loans */
    loans.forEach(ln=>{
      const m=loanMonths(ln.s,ln.e);
      st.loans.push({id:uid(),name:ln.name,s:ln.s,e:ln.e,rate:parseFloat(ln.rate)||0,cap:parseFloat(ln.cap)||0,mp:calcMP(parseFloat(ln.cap)||0,parseFloat(ln.rate)||0,m.t),ac:true,ar:false});
    });
    /* Add savings */
    savAccounts.forEach(sv=>{
      st.savings.push({id:uid(),name:sv.name,type:sv.type,pid:ps[0].id,balance:parseFloat(sv.bal)||0,movements:[],ar:false,objectives:[]});
    });
    /* Add investments */
    invAccounts.forEach(iv=>{
      st.investments.push({id:uid(),name:iv.name,type:iv.type,pid:ps[0].id,value:parseFloat(iv.bal)||0,movements:[],ar:false});
    });
    /* Seed first month with charges */
    const firstKey=new Date().toISOString().slice(0,7);
    const dm=defaultMonth(firstKey,st);
    dm.charges=[...dm.charges,...charges.map(c=>({id:uid(),name:c.name,amount:parseFloat(c.amount)||0,freq:c.freq,auto:false}))];
    st.months[firstKey]=dm;
    onDone(st);
  };

  const addCharge=()=>{const a=parseFloat(String(chgForm.amount).replace(",","."));if(!chgForm.name||!a)return;setCharges([...charges,{id:uid(),name:chgForm.name,amount:a,freq:chgForm.freq}]);setChgForm({name:"",amount:"",freq:"monthly"});};
  const addCat=()=>{if(!catForm.name)return;setCatList([...catList,{id:uid(),name:catForm.name,icon:catForm.icon,color:catForm.color,o:catList.length}]);setCatForm({name:"",icon:"ShoppingCart",color:COLORS[catList.length%COLORS.length]});setShowCatForm(false);};
  const addLoan=()=>{const c=parseFloat(String(loanForm.cap).replace(",","."));if(!loanForm.name||!c)return;setLoans([...loans,{...loanForm,cap:c}]);setLoanForm({name:"",cap:"",rate:"3.5",s:"2024-01-01",e:"2048-12-31"});};
  const addSav=()=>{if(!savForm.name)return;setSavAccounts([...savAccounts,{...savForm}]);setSavForm({name:"",type:"livret",bal:""});};
  const addInv=()=>{if(!invForm.name)return;setInvAccounts([...invAccounts,{...invForm}]);setInvForm({name:"",type:"pea",bal:""});};

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif"}}>
      <style>{CSS}</style>
      <div className="sa-top" style={{padding:"16px 20px",borderBottom:"1px solid var(--sep)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{width:60}}>{step>0&&<button onClick={()=>setStep(step-1)} style={{fontSize:14,fontWeight:500,color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>Retour</button>}</div>
          <p style={{fontSize:15,fontWeight:700,color:"var(--text)",margin:0}}>{stepTitles[step]}</p>
          <div style={{width:60,textAlign:"right"}}><span style={{fontSize:12,color:"var(--text3)"}}>{step+1}/{STEPS}</span></div>
        </div>
        <div style={{display:"flex",gap:3}}>{Array.from({length:STEPS}).map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?"var(--accent)":"var(--text4)",transition:"all .3s"}}/>)}</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 140px"}}>

        {step===0&&(
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            <SegTabs items={[{v:1,l:"Solo"},{v:2,l:"En couple"}]} active={nbP} onChange={v=>{setNbP(v);if(v===1)setNames([names[0]||""]);else if(names.length<2)setNames([...names,""]);}}/>
            {Array.from({length:nbP}).map((_,i)=><Inp key={i} label={nbP===1?"Votre prénom":"Personne "+String.fromCharCode(65+i)} placeholder={"Ex: "+(i===0?"Thomas":"Marie")} value={names[i]||""} onChange={e=>{const n=[...names];n[i]=e.target.value;setNames(n);}}/>)}
          </div>
        )}

        {step===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            {charges.length>0&&<Card p={0}><div style={{padding:"4px 16px"}}>{charges.map((c,i)=><Row key={c.id} left={c.name} sub={FREQ.find(x=>x.v===c.freq)?.l} right={<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15,fontWeight:700}}>{eur(c.amount)}</span><button onClick={()=>setCharges(charges.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button></div>}/>)}</div></Card>}
            <div style={{background:"var(--bg2)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
              <Inp label="Nom" value={chgForm.name} onChange={e=>setChgForm({...chgForm,name:e.target.value})} placeholder="Ex: Loyer, Assurance auto"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Montant" suffix="€" type="number" inputMode="decimal" value={chgForm.amount} onChange={e=>setChgForm({...chgForm,amount:e.target.value})}/>
                <Sel label="Fréquence" options={FREQ} value={chgForm.freq} onChange={e=>setChgForm({...chgForm,freq:e.target.value})}/>
              </div>
              <Btn full onClick={addCharge}><Plus size={14}/>Ajouter</Btn>
            </div>
            {charges.length>0&&<Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Total mensuel</p><p style={{fontSize:24,fontWeight:700,color:"var(--text)",letterSpacing:-.5,margin:"6px 0 0"}}>{eur(charges.reduce((s,c)=>s+c.amount,0))}</p></Card>}
          </div>
        )}

        {step===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            <Card p={0}><div style={{padding:"4px 16px"}}>{catList.map((c,i)=><Row key={c.id} icon={<Ico name={c.icon} size={15} color={c.color}/>} iconBg={c.color+"12"} left={c.name} right={<button onClick={()=>setCatList(catList.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button>}/>)}</div></Card>
            {showCatForm?(<div style={{background:"var(--bg2)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
              <Inp label="Nom" value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} placeholder="Ex: Restaurants"/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{COLORS.map(co=><div key={co} onClick={()=>setCatForm({...catForm,color:co})} style={{width:28,height:28,borderRadius:8,background:co,cursor:"pointer",border:catForm.color===co?"3px solid var(--text)":"3px solid transparent"}}/>)}</div>
              <div style={{display:"flex",gap:8}}><Btn full onClick={addCat}>Ajouter</Btn><Btn v="muted" full onClick={()=>setShowCatForm(false)}>Annuler</Btn></div>
            </div>):(<Btn v="ghost" sm onClick={()=>setShowCatForm(true)}><Plus size={14}/>Nouvelle catégorie</Btn>)}
          </div>
        )}

        {step===3&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            {loans.length>0&&<Card p={0}><div style={{padding:"4px 16px"}}>{loans.map((ln,i)=>{const m=loanMonths(ln.s,ln.e);return <Row key={i} icon={<Landmark size={15} color="var(--purple)"/>} iconBg="var(--purple2)" left={ln.name} sub={eur(calcMP(parseFloat(ln.cap)||0,parseFloat(ln.rate)||0,m.t))+"/mois"} right={<button onClick={()=>setLoans(loans.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button>}/>})}</div></Card>}
            <div style={{background:"var(--bg2)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
              <Inp label="Nom" value={loanForm.name} onChange={e=>setLoanForm({...loanForm,name:e.target.value})}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Capital" suffix="€" type="number" inputMode="decimal" value={loanForm.cap} onChange={e=>setLoanForm({...loanForm,cap:e.target.value})}/>
                <Inp label="Taux" suffix="%" type="number" inputMode="decimal" step="0.01" value={loanForm.rate} onChange={e=>setLoanForm({...loanForm,rate:e.target.value})}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Début" type="date" value={loanForm.s} onChange={e=>setLoanForm({...loanForm,s:e.target.value})}/>
                <Inp label="Fin" type="date" value={loanForm.e} onChange={e=>setLoanForm({...loanForm,e:e.target.value})}/>
              </div>
              <Btn full onClick={addLoan}><Plus size={14}/>Ajouter</Btn>
            </div>
          </div>
        )}

        {step===4&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            {savAccounts.length>0&&<Card p={0}><div style={{padding:"4px 16px"}}>{savAccounts.map((sv,i)=><Row key={i} icon={<PiggyBank size={15} color="var(--green)"/>} iconBg="var(--green2)" left={sv.name} sub={SAV_TYPES.find(x=>x.v===sv.type)?.l} right={<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:700}}>{sv.bal?eur(parseFloat(sv.bal)):""}</span><button onClick={()=>setSavAccounts(savAccounts.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button></div>}/>)}</div></Card>}
            <div style={{background:"var(--bg2)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
              <Inp label="Nom" value={savForm.name} onChange={e=>setSavForm({...savForm,name:e.target.value})} placeholder="Ex: Livret A"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Solde" suffix="€" type="number" inputMode="decimal" value={savForm.bal} onChange={e=>setSavForm({...savForm,bal:e.target.value})}/>
                <Sel label="Type" options={SAV_TYPES} value={savForm.type} onChange={e=>setSavForm({...savForm,type:e.target.value})}/>
              </div>
              <Btn full onClick={addSav}><Plus size={14}/>Ajouter</Btn>
            </div>
          </div>
        )}

        {step===5&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,animation:"popIn .25s cubic-bezier(.32,.72,0,1)"}}>
            {invAccounts.length>0&&<Card p={0}><div style={{padding:"4px 16px"}}>{invAccounts.map((iv,i)=><Row key={i} icon={<TrendingUp size={15} color="var(--blue)"/>} iconBg="var(--blue2)" left={iv.name} sub={INV_TYPES.find(x=>x.v===iv.type)?.l} right={<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:700}}>{iv.bal?eur(parseFloat(iv.bal)):""}</span><button onClick={()=>setInvAccounts(invAccounts.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button></div>}/>)}</div></Card>}
            <div style={{background:"var(--bg2)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
              <Inp label="Nom" value={invForm.name} onChange={e=>setInvForm({...invForm,name:e.target.value})} placeholder="Ex: PEA Boursorama"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Valeur" suffix="€" type="number" inputMode="decimal" value={invForm.bal} onChange={e=>setInvForm({...invForm,bal:e.target.value})}/>
                <Sel label="Type" options={INV_TYPES} value={invForm.type} onChange={e=>setInvForm({...invForm,type:e.target.value})}/>
              </div>
              <Btn full onClick={addInv}><Plus size={14}/>Ajouter</Btn>
            </div>
          </div>
        )}

      </div>

      <div className="sa-onb-bot" style={{position:"fixed",bottom:0,left:0,right:0,padding:"16px 28px",background:"var(--bg)"}}>
        <div style={{display:"flex",gap:12}}>
          {step>0&&step<STEPS-1&&<Btn v="muted" full onClick={()=>setStep(step+1)}>Passer</Btn>}
          {step<STEPS-1?<Btn full onClick={()=>setStep(step+1)}>Continuer</Btn>:<Btn full onClick={finish}><Check size={18}/>Commencer</Btn>}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   SIMULATION WIZARD
   ══════════════════════════════════════════════════════ */
function SimWizard({S,cm,onSave,onClose}){
  const ps=S.cfg.persons||[];
  const adults=ps.filter(p=>(p.type||"adult")==="adult");
  const cats=(S.cfg.categories||[]).filter(c=>!c.ar);
  const[st,setSt]=useState(0);
  const[w,setW]=useState(()=>JSON.parse(JSON.stringify(getMonth(S,cm))));
  const STEPS=["Revenus","Charges","Dépenses","Épargne","Invest.","Virements"];

  const tr=sumRev(w),aids=sumAid(w),tf=sumFC(w),pr=prorata(w,ps),tv=sumVarBudget(w);
  const rb=Object.fromEntries(ps.map(p=>[p.id,revPerson(w,p.id)]));
  const vcPerAdult=adults.length>0?tv/adults.length:tv;

  const balFor=pid=>{
    const p=ps.find(x=>x.id===pid);const isAdult=(p?.type||"adult")==="adult";
    const r=rb[pid]||0;
    const savArr=(w.alloc?.[pid]?.sav||[]);
    const invArr=(w.alloc?.[pid]?.inv||[]);
    return r-(isAdult?(pr[pid]||0):0)-(isAdult?vcPerAdult:0)-savArr.reduce((s,x)=>s+(x.amount||0),0)-invArr.reduce((s,x)=>s+(x.amount||0),0);
  };

  const setAlloc=(pid,key,accId,val)=>{
    setW(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next.alloc)next.alloc={};
      if(!next.alloc[pid])next.alloc[pid]={fc:0,vc:0,sav:[],inv:[]};
      const arr=[...(next.alloc[pid][key]||[])];
      const idx=arr.findIndex(x=>x.accId===accId);
      if(idx>=0)arr[idx]={...arr[idx],amount:val};else arr.push({accId,amount:val});
      next.alloc[pid][key]=arr;
      return next;
    });
  };

  const validate=()=>{
    const final={...w,ok:true,alloc:Object.fromEntries(ps.map(p=>{const isA=(p.type||"adult")==="adult";return[p.id,{fc:isA?(pr[p.id]||0):0,vc:isA?vcPerAdult:0,sav:w.alloc?.[p.id]?.sav||[],inv:w.alloc?.[p.id]?.inv||[]}];}))};
    onSave(final);
  };

  const smallInput={width:88,background:"var(--bg2)",border:"1.5px solid transparent",borderRadius:10,padding:"9px 10px",fontSize:14,textAlign:"right",fontWeight:600,color:"var(--text)",outline:"none"};

  return(
    <div style={{position:"fixed",inset:0,zIndex:50,background:"var(--bg)",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif",animation:"fadeIn .2s ease"}}>
      <div className="sa-top" style={{padding:"14px 20px",borderBottom:"1px solid var(--sep)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <button onClick={onClose} style={{fontSize:15,fontWeight:500,color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>Annuler</button>
          <div style={{textAlign:"center"}}><p style={{fontSize:15,fontWeight:700,color:"var(--text)",margin:0}}>{monthLabel(cm)}</p><p style={{fontSize:11,color:"var(--text3)",margin:"2px 0 0"}}>Simulation budget</p></div>
          <div style={{width:60}}/>
        </div>
        <div style={{display:"flex",gap:3}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=st?"var(--accent)":"var(--text4)",transition:"all .3s"}}/>)}</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:20}}>
        {st===0&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <p style={{fontSize:13,color:"var(--text3)",margin:0}}>Revenus mensuels. Personnalisez les libellés et montants.</p>
            {(w.rev||[]).map(r=>(
              <div key={r.id} style={{background:"var(--bg2)",borderRadius:14,padding:14}}>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={r.label} onChange={e=>setW(p=>({...p,rev:p.rev.map(x=>x.id===r.id?{...x,label:e.target.value}:x)}))} style={{flex:1,background:"var(--card)",border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 12px",fontSize:14,fontWeight:600,color:"var(--text)",outline:"none"}} placeholder="Libellé"/>
                  <button onClick={()=>setW(p=>({...p,rev:p.rev.filter(x=>x.id!==r.id)}))} style={{width:36,height:36,borderRadius:10,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Trash2 size={14} color="var(--red)"/></button>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="number" inputMode="decimal" value={r.amount||""} onChange={e=>setW(p=>({...p,rev:p.rev.map(x=>x.id===r.id?{...x,amount:parseFloat(e.target.value)||0}:x)}))} placeholder="0" style={{flex:1,background:"var(--card)",border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 12px",fontSize:14,fontWeight:600,color:"var(--text)",outline:"none",textAlign:"right"}}/>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--text3)"}}>€</span>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  {[{v:"salary",l:"Perso"},{v:"aid",l:"Cpt charges"}].map(t=>(
                    <button key={t.v} onClick={()=>setW(p=>({...p,rev:p.rev.map(x=>x.id===r.id?{...x,type:t.v}:x)}))} style={{flex:1,padding:"6px 0",borderRadius:8,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",background:r.type===t.v?"var(--accent2)":"var(--card)",color:r.type===t.v?"var(--accent)":"var(--text3)"}}>{t.l}</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <Btn v="ghost" sm onClick={()=>setW(p=>({...p,rev:[...p.rev,{id:uid(),label:"",amount:0,pid:adults[0]?.id,type:"salary"}]}))}><Plus size={14}/>Revenu perso</Btn>
              <Btn v="ghost" sm onClick={()=>setW(p=>({...p,rev:[...p.rev,{id:uid(),label:"",amount:0,pid:null,type:"aid"}]}))}><Plus size={14}/>Aide / Allocation</Btn>
            </div>
            <Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Total revenus</p><p style={{fontSize:24,fontWeight:700,color:"var(--text)",letterSpacing:-.5,margin:"6px 0 0"}}>{eur(tr)}</p></Card>
          </div>
        )}

        {st===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:13,color:"var(--text3)",margin:"0 0 4px"}}>Charges du compte commun. Répartition au prorata.</p>
            {[["Total charges",eur(tf),true],["Aides (PAJE+CMG)","-"+eur(aids),false,"var(--green)"],...adults.map(p=>["Part "+p.name,eur(pr[p.id]||0)])].map(([l,v,b,c],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:14,color:"var(--text2)"}}>{l}</span><span style={{fontSize:14,fontWeight:b?700:600,color:c||"var(--text)"}}>{v}</span></div>
            ))}
            <div style={{borderTop:"1px solid var(--sep)",paddingTop:10,marginTop:4}}>
              {(w.charges||[]).map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}><span style={{fontSize:14,color:"var(--text3)"}}>{c.name}{c.auto?" · prêt":""}</span><span style={{fontSize:14,fontWeight:600}}>{eur(c.amount)}</span></div>)}
            </div>
          </div>
        )}

        {st===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:13,color:"var(--text3)",margin:"0 0 4px"}}>Budget mensuel par catégorie.</p>
            {cats.map(c=>{const b=(w.cb||[]).find(x=>x.cid===c.id);return(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:c.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico name={c.icon} size={14} color={c.color}/></div>
                <span style={{fontSize:14,fontWeight:500,color:"var(--text)",flex:1}}>{c.name}</span>
                <input type="number" inputMode="decimal" value={b?.budget||""} onChange={e=>setW(p=>({...p,cb:p.cb.map(x=>x.cid===c.id?{...x,budget:parseFloat(e.target.value)||0}:x)}))} placeholder="0" style={smallInput}/>
              </div>
            );})}
            <Card>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase"}}>Total</span><span style={{fontWeight:700}}>{eur(tv)}</span></div>
              {adults.length>1&&<p style={{fontSize:12,color:"var(--text3)",margin:"4px 0 0"}}>{adults.map(p=>p.name+" : "+eur(vcPerAdult)).join(" · ")}</p>}
            </Card>
          </div>
        )}

        {st===3&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {ps.map(p=>(
              <div key={p.id}>
                <p style={{fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",margin:"0 0 8px"}}>{p.name}</p>
                {S.savings.filter(a=>!a.ar&&a.pid===p.id).map(a=>{const ex=(w.alloc?.[p.id]?.sav||[]).find(x=>x.accId===a.id);return(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:14,flex:1}}>{a.name}</span><input type="number" inputMode="decimal" value={ex?.amount||""} placeholder="0" onChange={e=>setAlloc(p.id,"sav",a.id,parseFloat(e.target.value)||0)} style={smallInput}/></div>
                );})}
                {S.savings.filter(a=>!a.ar&&a.pid===p.id).length===0&&<p style={{fontSize:13,color:"var(--text3)",margin:0}}>Aucun compte</p>}
              </div>
            ))}
          </div>
        )}

        {st===4&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {ps.map(p=>(
              <div key={p.id}>
                <p style={{fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",margin:"0 0 8px"}}>{p.name}</p>
                {S.investments.filter(a=>!a.ar&&a.pid===p.id).map(a=>{const ex=(w.alloc?.[p.id]?.inv||[]).find(x=>x.accId===a.id);return(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:14,flex:1}}>{a.name}</span><input type="number" inputMode="decimal" value={ex?.amount||""} placeholder="0" onChange={e=>setAlloc(p.id,"inv",a.id,parseFloat(e.target.value)||0)} style={smallInput}/></div>
                );})}
                {S.investments.filter(a=>!a.ar&&a.pid===p.id).length===0&&<p style={{fontSize:13,color:"var(--text3)",margin:0}}>Aucun compte</p>}
              </div>
            ))}
          </div>
        )}

        {st===5&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {adults.some(p=>balFor(p.id)<0)&&<AlertBanner type="danger" msg={"Déficit : "+adults.filter(p=>balFor(p.id)<0).map(p=>p.name).join(", ")}/>}

            <Card>
              <p style={{fontSize:11,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 4px"}}>Virements à effectuer</p>
              {ps.map(p=>{const isA=(p.type||"adult")==="adult";const hasSav=(w.alloc?.[p.id]?.sav||[]).some(x=>x.amount>0);const hasInv=(w.alloc?.[p.id]?.inv||[]).some(x=>x.amount>0);if(!isA&&!hasSav&&!hasInv)return null;return(
                <div key={p.id} style={{marginTop:10}}>
                  <p style={{fontSize:13,fontWeight:600,color:"var(--text)",margin:"0 0 6px"}}>{p.name}{!isA&&<span style={{fontSize:11,fontWeight:500,color:"var(--orange)",marginLeft:6}}>enfant</span>}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:4,paddingLeft:12,borderLeft:"2px solid "+(isA?"var(--accent)":"var(--orange)")}}>
                    {isA&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"var(--text2)"}}>→ Compte charges fixes</span><span style={{fontWeight:700,color:"var(--text)"}}>{eur(pr[p.id]||0)}</span></div>}
                    {isA&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"var(--text2)"}}>→ Pot dépenses variables</span><span style={{fontWeight:700,color:"var(--text)"}}>{eur(vcPerAdult)}</span></div>}
                    {(w.alloc?.[p.id]?.sav||[]).filter(x=>x.amount>0).map(x=>{const acc=S.savings.find(a=>a.id===x.accId);return (<div key={x.accId} style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"var(--text2)"}}>→ {acc?.name||"Épargne"}</span><span style={{fontWeight:700,color:"var(--green)"}}>{eur(x.amount)}</span></div>);})}
                    {(w.alloc?.[p.id]?.inv||[]).filter(x=>x.amount>0).map(x=>{const acc=S.investments.find(a=>a.id===x.accId);return (<div key={x.accId} style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"var(--text2)"}}>→ {acc?.name||"Invest."}</span><span style={{fontWeight:700,color:"var(--blue)"}}>{eur(x.amount)}</span></div>);})}
                  </div>
                </div>
              );})}
            </Card>

            <div style={{display:"grid",gridTemplateColumns:adults.length>1?"1fr 1fr":"1fr",gap:10}}>
              {adults.map(p=><KPI key={p.id} label={"Reste à vivre "+p.name} value={eur(balFor(p.id))} color={balFor(p.id)>=0?"var(--green)":"var(--red)"}/>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <KPI label="Revenus" value={eur(tr)}/><KPI label="Charges" value={eur(tf)}/>
            </div>
            <Btn v="muted" full onClick={()=>setSt(0)}><RotateCcw size={14}/>Recommencer</Btn>
          </div>
        )}
      </div>

      <div className="sa-onb-bot" style={{padding:"14px 20px",borderTop:"1px solid var(--sep)",display:"flex",gap:12,background:"var(--bg)"}}>
        {st>0&&<Btn v="muted" full onClick={()=>setSt(st-1)}>Précédent</Btn>}
        {st<5?<Btn full onClick={()=>setSt(st+1)}>Suivant</Btn>:<Btn full onClick={validate}><Check size={16}/>Enregistrer</Btn>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════ */
export default function App(){return (<ToastProvider><MainApp/></ToastProvider>);}

function MainApp(){
  const toast=useContext(ToastCtx);
  const[meta,setMeta]=useState(null);
  const[S,setS]=useState(null);
  const[loading,setLoading]=useState(true);
  const[cm,setCm]=useState(nowKey());
  const[page,setPage]=useState("dash");
  const[sub,setSub]=useState(null);
  const[wiz,setWiz]=useState(false);
  const[showHH,setShowHH]=useState(false);
  const[authUser,setAuthUser]=useState(window.firebaseAuth?.user||null);
  const[syncing,setSyncing]=useState(false);

  const activeId=meta?.active||null;

  /* Reload all state from storage */
  const reloadAll=useCallback(async()=>{
    let m=await loadMeta();
    if(!m){const mig=await migrateOld();if(mig){m=mig.meta;setS(mig.data);setMeta(m);return;}}
    if(!m)return;
    setMeta(m);
    if(m.active){const d=await load(m.active);setS(d);}
  },[]);

  useEffect(()=>{
    (async()=>{
      await reloadAll();
      setLoading(false);
    })();
    /* Listen for auth changes */
    const unsubAuth=window.firebaseAuth?.onAuthChange?.(user=>{setAuthUser(user);});
    /* Listen for sync events (cloud → local pull done) */
    const unsubSync=window.firebaseAuth?.onSync?.(()=>{reloadAll();});
    return ()=>{if(unsubAuth)unsubAuth();if(unsubSync)unsubSync();};
  },[reloadAll]);
  useEffect(()=>{if(S&&meta?.active&&!loading)save(meta.active,S);},[S,loading]);
  useEffect(()=>{if(meta&&!loading)saveMeta(meta);},[meta,loading]);

  const switchHH=async id=>{
    if(S&&meta?.active)await save(meta.active,S);
    const d=await load(id);setS(d);setMeta(p=>({...p,active:id}));
  };
  const createHH=(name,state)=>{
    const id=uid();
    setMeta(p=>{const hh=[...(p?.households||[]),{id,name,created:new Date().toISOString()}];return{...p,households:hh,active:id};});
    setS(state);
    setTimeout(()=>save(id,state),100);
    toast("Foyer créé");
  };
  const deleteHH=async id=>{
    if(!meta)return;
    const hh=meta.households.filter(h=>h.id!==id);
    try{await window.storage.delete(hKey(id));}catch(e){}
    const nextId=hh[0]?.id||null;
    const nextData=nextId?await load(nextId):null;
    setMeta({households:hh,active:nextId});setS(nextData);
  };
  const renameHH=(id,name)=>setMeta(p=>({...p,households:p.households.map(h=>h.id===id?{...h,name}:h)}));

  const dk=S?.cfg?.dark==="dark"||(S?.cfg?.dark==="auto"&&typeof window!=="undefined"&&window.matchMedia?.("(prefers-color-scheme:dark)").matches);
  useEffect(()=>{document.documentElement.classList.toggle("dark",!!dk);},[dk]);

  const up=useCallback(fn=>setS(p=>{const n=JSON.parse(JSON.stringify(p));fn(n);return n;}),[]);
  const upm=useCallback((k,fn)=>up(s=>{if(!s.months[k])s.months[k]=defaultMonth(k,s);fn(s.months[k]);}),[up]);

  if(loading)return (<div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{width:36,height:36,borderRadius:12,background:"var(--accent)"}}/></div>);
  if(!meta||meta.households.length===0||!S||!S.cfg?.onb)return (<Onboarding onDone={s=>{createHH("Mon foyer",s);toast("Budget configuré !");}}/>);

  const md=getMonth(S,cm);
  const cats=(S.cfg.categories||[]).filter(c=>!c.ar);
  const ps=S.cfg.persons||[];
  const nav=d=>{const n=addMonths(cm,d);if(canNav(n))setCm(n);};

  /* ── DASHBOARD ── */
  function Dash(){
    const[v,sV]=useState("all");
    const tr=sumRev(md),tf=sumFC(md),tvb=sumVarBudget(md),tvs=sumSpent(md);
    const tSav=S.savings.filter(a=>!a.ar).reduce((s,a)=>s+savBalance(a),0);
    const tInv=S.investments.filter(a=>!a.ar).reduce((s,a)=>s+((a.snapshots||[]).slice(-1)[0]?.value||0),0);
    const over=cats.filter(c=>{const b=(md.cb||[]).find(x=>x.cid===c.id)?.budget||0;return b>0&&sumSpent(md,c.id)>b;});
    const chartData=cats.map(c=>({name:c.name,Budget:(md.cb||[]).find(x=>x.cid===c.id)?.budget||0,Réel:sumSpent(md,c.id)})).filter(d=>d.Budget>0||d.Réel>0);
    const pieData=cats.map(c=>({name:c.name,value:sumSpent(md,c.id),color:c.color})).filter(d=>d.value>0);

    const PersonView=({pid})=>{
      const p=ps.find(x=>x.id===pid);const isA=(p?.type||"adult")==="adult";const a=md.alloc?.[pid]||{};
      const savTotal=(a.sav||[]).reduce((s,x)=>s+(x.amount||0),0);
      const invTotal=(a.inv||[]).reduce((s,x)=>s+(x.amount||0),0);
      if(!isA){
        const childSav=S.savings.filter(x=>!x.ar&&x.pid===pid);
        const childInv=S.investments.filter(x=>!x.ar&&x.pid===pid);
        return(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Épargne — {p?.name}</p>
              {childSav.length===0&&childInv.length===0&&<p style={{fontSize:14,color:"var(--text3)",margin:"10px 0 0"}}>Aucun compte rattaché</p>}
              {childSav.map(a2=>(<div key={a2.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:14,color:"var(--text2)"}}>{a2.name}</span><span style={{fontSize:14,fontWeight:700}}>{eur(savBalance(a2))}</span></div>))}
              {childInv.map(a2=>{const v=(a2.snapshots||[]).slice(-1)[0]?.value||0;return(<div key={a2.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:14,color:"var(--text2)"}}>{a2.name}</span><span style={{fontSize:14,fontWeight:700}}>{eur(v)}</span></div>);})}
            </Card>
            {md.ok&&(savTotal>0||invTotal>0)&&<Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 8px"}}>Virements ce mois</p>
              {(a.sav||[]).filter(x=>x.amount>0).map(x=>{const acc=S.savings.find(s2=>s2.id===x.accId);return(<div key={x.accId} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13}}><span style={{color:"var(--text2)"}}>→ {acc?.name||"Épargne"}</span><span style={{fontWeight:700,color:"var(--green)"}}>{eur(x.amount)}</span></div>);})}
              {(a.inv||[]).filter(x=>x.amount>0).map(x=>{const acc=S.investments.find(i2=>i2.id===x.accId);return(<div key={x.accId} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13}}><span style={{color:"var(--text2)"}}>→ {acc?.name||"Invest."}</span><span style={{fontWeight:700,color:"var(--blue)"}}>{eur(x.amount)}</span></div>);})}
            </Card>}
          </div>
        );
      }
      const bal=personBalance(md,pid);
      return(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Reste à vivre — {p?.name}</p><p style={{fontSize:34,fontWeight:700,letterSpacing:-1.2,color:bal>=0?"var(--green)":"var(--red)",margin:"6px 0 0"}}>{eur(bal)}</p></Card>
          <Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Répartition</p>
            {[["Revenus",eur(revPerson(md,pid)),false],["→ Charges fixes","-"+eur(a.fc||0),true],["→ Dépenses var.","-"+eur(a.vc||0),true],["→ Épargne","-"+eur(savTotal),true],["→ Investissements","-"+eur(invTotal),true]].map(([l,val,dim],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0"}}><span style={{fontSize:14,color:dim?"var(--text3)":"var(--text2)"}}>{l}</span><span style={{fontSize:14,fontWeight:600,color:dim?"var(--text2)":"var(--text)"}}>{val}</span></div>
            ))}
          </Card>
        </div>
      );
    };

    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {!md.ok&&<AlertBanner msg="Lancez votre première simulation" type="info" onClick={()=>setWiz(true)}/>}
        {md.ok&&<div onClick={()=>setWiz(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:"var(--r2)",background:"var(--accent2)",cursor:"pointer"}} {...pressHandlers}><RefreshCw size={16} color="var(--accent)"/><span style={{fontSize:14,fontWeight:600,color:"var(--accent)",flex:1}}>Relancer la simulation</span><ChevronRight size={16} color="var(--accent)" style={{opacity:.5}}/></div>}

        {ps.length>1&&<SegTabs items={[{v:"all",l:"Foyer"},...ps.map(p=>({v:p.id,l:p.name}))]} active={v} onChange={sV}/>}

        {v!=="all"?<PersonView pid={v}/>:(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <KPI label="Revenus" value={eur(tr)}/><KPI label="Charges fixes" value={eur(tf)}/>
            </div>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Dépenses variables</p><p style={{fontSize:26,fontWeight:700,color:"var(--text)",letterSpacing:-.8,margin:"4px 0 0"}}>{eur(tvs)}<span style={{fontSize:14,fontWeight:500,color:"var(--text3)",marginLeft:6}}>/ {eur(tvb)}</span></p></div>
                {tvb>0&&<span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:100,background:tvs>tvb?"var(--red2)":"var(--green2)",color:tvs>tvb?"var(--red)":"var(--green)"}}>{pct(tvb>0?tvs/tvb*100:0)}</span>}
              </div>
              {tvb>0&&<Prog val={tvs} max={tvb} h={8}/>}
            </Card>
            {over.length>0&&<AlertBanner msg={"Dépassement : "+over.map(c=>c.name).join(", ")} type="danger"/>}
            {md.ok&&ps.length>0&&<div style={{display:"grid",gridTemplateColumns:ps.filter(p=>(p.type||"adult")==="adult").length>1?"1fr 1fr":"1fr",gap:10}}>{ps.filter(p=>(p.type||"adult")==="adult").map(p=><KPI key={p.id} label={"Reste "+p.name} value={eur(personBalance(md,p.id))} color={personBalance(md,p.id)>=0?"var(--green)":"var(--red)"}/>)}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <KPI label="Épargne" value={eur(tSav)} color="var(--green)" onClick={()=>setPage("sav")}/>
              <KPI label="Invest." value={eur(tInv)} color="var(--blue)" onClick={()=>{setPage("more");setSub("inv");}}/>
            </div>
            {chartData.length>0&&<Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 16px"}}>Budget vs Réel</p><ResponsiveContainer width="100%" height={170}><BarChart data={chartData} barGap={3}><CartesianGrid strokeDasharray="3 3" stroke="var(--sep)"/><XAxis dataKey="name" tick={{fontSize:9,fill:"var(--text3)"}} interval={0} angle={-35} textAnchor="end" height={50}/><YAxis tick={{fontSize:9,fill:"var(--text3)"}}/><Tooltip formatter={v2=>eur(v2)} contentStyle={{borderRadius:14,fontSize:12,border:"none",background:"var(--card)"}}/><Bar dataKey="Budget" fill="var(--accent)" opacity={.2} radius={[8,8,0,0]}/><Bar dataKey="Réel" fill="var(--accent)" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></Card>}
            {pieData.length>0&&<Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 16px"}}>Répartition</p><ResponsiveContainer width="100%" height={170}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={40} strokeWidth={0}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v2=>eur(v2)} contentStyle={{borderRadius:14,fontSize:12,border:"none",background:"var(--card)"}}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,justifyContent:"center"}}>{pieData.map(d=><span key={d.name} style={{fontSize:11,fontWeight:600,color:d.color,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:4,background:d.color}}/>{d.name}</span>)}</div></Card>}
          </>
        )}
      </div>
    );
  }

  /* ── EXPENSES ── */
  function Expenses(){
    const[expTab,setExpTab]=useState("var");
    const[show,setShow]=useState(false);const[editId,setEditId]=useState(null);
    const[form,setForm]=useState({date:today(),cid:cats[0]?.id||"",amount:"",desc:""});
    const[chgShow,setChgShow]=useState(false);const[chgEditId,setChgEditId]=useState(null);
    const[chgForm,setChgForm]=useState({name:"",amount:"",freq:"monthly"});
    const[showCatEdit,setShowCatEdit]=useState(null);
    const[catEditForm,setCatEditForm]=useState({name:"",icon:"ShoppingCart",color:COLORS[0]});
    const exps=[...(md.exp||[])].sort((a,b)=>b.date.localeCompare(a.date));
    const manual=(md.charges||[]).filter(c=>!c.auto);const auto=(md.charges||[]).filter(c=>c.auto);
    const doSaveExp=()=>{const a=parseFloat(String(form.amount).replace(",","."));if(!a||!form.cid)return;upm(cm,m=>{if(editId){const i=m.exp.findIndex(e=>e.id===editId);if(i>=0)m.exp[i]={...m.exp[i],...form,amount:a};}else m.exp.push({id:uid(),...form,amount:a});});toast(editId?"Modifié":"Ajouté");setShow(false);setEditId(null);setForm({date:today(),cid:cats[0]?.id||"",amount:"",desc:""});};
    const doSaveChg=()=>{const a=parseFloat(String(chgForm.amount).replace(",","."));if(!chgForm.name||!a)return;upm(cm,m=>{if(chgEditId){const i=m.charges.findIndex(c=>c.id===chgEditId);if(i>=0)Object.assign(m.charges[i],{name:chgForm.name,amount:a,freq:chgForm.freq});}else m.charges.push({id:uid(),name:chgForm.name,amount:a,freq:chgForm.freq,auto:false});});toast(chgEditId?"Modifié":"Ajouté");setChgShow(false);setChgEditId(null);setChgForm({name:"",amount:"",freq:"monthly"});};
    const saveCatEdit=()=>{if(!catEditForm.name)return;if(showCatEdit==="new")up(s=>{s.cfg.categories.push({id:uid(),name:catEditForm.name,icon:catEditForm.icon,color:catEditForm.color,o:s.cfg.categories.length});});else up(s=>{const c=s.cfg.categories.find(x=>x.id===showCatEdit);if(c){c.name=catEditForm.name;c.icon=catEditForm.icon;c.color=catEditForm.color;}});toast(showCatEdit==="new"?"Créée":"Modifiée");setShowCatEdit(null);};
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <SegTabs items={[{v:"var",l:"Variables"},{v:"fix",l:"Charges fixes"},{v:"cat",l:"Catégories"}]} active={expTab} onChange={setExpTab}/>

        {expTab==="var"&&(<>
          {cats.map(c=>{const b=(md.cb||[]).find(x=>x.cid===c.id)?.budget||0;const s=sumSpent(md,c.id);if(!b&&!s)return null;return(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:11,background:c.color+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico name={c.icon} size={15} color={c.color}/></div>
              <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{c.name}</span><span style={{fontSize:13,fontWeight:600,color:b>0&&s>b?"var(--red)":"var(--text3)"}}>{eur(s)} / {eur(b)}</span></div><Prog val={s} max={b} color={c.color}/></div>
            </div>);})}
          <div style={{borderTop:"1px solid var(--sep)",paddingTop:14}}>
            <SecTitle title={"Transactions · "+exps.length}/>
            {exps.length===0?<EmptyState icon={Receipt} msg="Aucune dépense" action="Ajouter" onAction={()=>setShow(true)}/>:
              <Card p={0}><div style={{padding:"4px 16px"}}>{exps.map(e=>{const c=cats.find(x=>x.id===e.cid);return (<Row key={e.id} onClick={()=>{setForm({date:e.date,cid:e.cid,amount:String(e.amount),desc:e.desc||""});setEditId(e.id);setShow(true);}} icon={<Ico name={c?.icon||"Receipt"} size={15} color={c?.color||"#999"}/>} iconBg={(c?.color||"#999")+"12"} left={(c?.name||"?")+(e.desc?" · "+e.desc:"")} sub={e.date} right={<span style={{fontSize:15,fontWeight:700}}>{eur(e.amount)}</span>}/>);})}</div></Card>}
          </div>
          <div className="sa-fab" onClick={()=>{setEditId(null);setForm({date:today(),cid:cats[0]?.id||"",amount:"",desc:""});setShow(true);}} style={{position:"fixed",right:20,width:56,height:56,borderRadius:18,background:"var(--accent)",boxShadow:"0 8px 28px rgba(200,149,108,.35)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:30}} {...pressHandlers}><Plus size={24} color="#fff"/></div>
        </>)}

        {expTab==="fix"&&(<>
          <KPI label="Total charges fixes" value={eur(sumFC(md))}/>
          {auto.length>0&&<><SecTitle title="Prêts (auto)"/><Card p={0}><div style={{padding:"4px 16px"}}>{auto.map(c=><Row key={c.id} icon={<Landmark size={15} color="var(--purple)"/>} iconBg="var(--purple2)" left={c.name} sub="Mensualité prêt" right={<span style={{fontSize:15,fontWeight:700}}>{eur(c.amount)}</span>}/>)}</div></Card></>}
          <SecTitle title="Charges manuelles" right={<button onClick={()=>{setChgEditId(null);setChgForm({name:"",amount:"",freq:"monthly"});setChgShow(true);}} style={{width:28,height:28,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={14} color="var(--text3)"/></button>}/>
          {manual.length===0?<EmptyState icon={CreditCard} msg="Aucune" action="Ajouter" onAction={()=>setChgShow(true)}/>:
            <Card p={0}><div style={{padding:"4px 16px"}}>{manual.map(c=><Row key={c.id} onClick={()=>{setChgForm({name:c.name,amount:String(c.amount),freq:c.freq});setChgEditId(c.id);setChgShow(true);}} left={c.name} sub={FREQ.find(x=>x.v===c.freq)?.l} right={<span style={{fontSize:15,fontWeight:700}}>{eur(c.amount)}</span>}/>)}</div></Card>}
        </>)}

        {expTab==="cat"&&(<>
          <SecTitle title="Catégories de dépenses" right={<button onClick={()=>{setCatEditForm({name:"",icon:"ShoppingCart",color:COLORS[cats.length%COLORS.length]});setShowCatEdit("new");}} style={{width:28,height:28,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={14} color="var(--text3)"/></button>}/>
          {cats.length===0?<EmptyState icon={Tag} msg="Aucune catégorie" action="Créer" onAction={()=>{setCatEditForm({name:"",icon:"ShoppingCart",color:COLORS[0]});setShowCatEdit("new");}}/>:
            <Card p={0}><div style={{padding:"4px 16px"}}>{cats.sort((a,b)=>(a.o||0)-(b.o||0)).map(c=><Row key={c.id} onClick={()=>{setCatEditForm({name:c.name,icon:c.icon,color:c.color});setShowCatEdit(c.id);}} icon={<Ico name={c.icon} size={15} color={c.color}/>} iconBg={c.color+"12"} left={c.name} right={<button onClick={e=>{e.stopPropagation();if(confirm("Supprimer "+c.name+" ?"))up(s=>{s.cfg.categories=s.cfg.categories.filter(x=>x.id!==c.id);});}} style={{width:24,height:24,borderRadius:6,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11} color="var(--red)"/></button>}/>)}</div></Card>}
        </>)}

        <Modal open={show} onClose={()=>{setShow(false);setEditId(null);}} title={editId?"Modifier":"Nouvelle dépense"}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <Sel label="Catégorie" options={cats.map(c=>({v:c.id,l:c.name}))} value={form.cid} onChange={e=>setForm({...form,cid:e.target.value})}/>
            <Inp label="Montant" suffix="€" type="number" inputMode="decimal" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0,00"/>
            <Inp label="Description" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Optionnel"/>
            <Btn full onClick={doSaveExp}>{editId?"Modifier":"Ajouter"}</Btn>
            {editId&&<Btn v="danger" full onClick={()=>{upm(cm,m=>{m.exp=m.exp.filter(e=>e.id!==editId);});toast("Supprimé");setShow(false);setEditId(null);}}>Supprimer</Btn>}
          </div>
        </Modal>
        <Modal open={chgShow} onClose={()=>{setChgShow(false);setChgEditId(null);}} title={chgEditId?"Modifier":"Nouvelle charge"}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom" value={chgForm.name} onChange={e=>setChgForm({...chgForm,name:e.target.value})} placeholder="Ex: Assurance auto"/>
            <Inp label="Montant" suffix="€" type="number" inputMode="decimal" value={chgForm.amount} onChange={e=>setChgForm({...chgForm,amount:e.target.value})}/>
            <Sel label="Fréquence" options={FREQ} value={chgForm.freq} onChange={e=>setChgForm({...chgForm,freq:e.target.value})}/>
            <Btn full onClick={doSaveChg}>{chgEditId?"Modifier":"Ajouter"}</Btn>
            {chgEditId&&<Btn v="danger" full onClick={()=>{upm(cm,m=>{m.charges=m.charges.filter(c=>c.id!==chgEditId);});toast("Supprimé");setChgShow(false);setChgEditId(null);}}>Supprimer</Btn>}
          </div>
        </Modal>
        <Modal open={!!showCatEdit} onClose={()=>setShowCatEdit(null)} title={showCatEdit==="new"?"Nouvelle catégorie":"Modifier catégorie"}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom" value={catEditForm.name} onChange={e=>setCatEditForm({...catEditForm,name:e.target.value})} placeholder="Ex: Restaurants"/>
            <div><p style={{fontSize:12,fontWeight:600,color:"var(--text3)",margin:"0 0 8px"}}>Couleur</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{COLORS.map(co=><div key={co} onClick={()=>setCatEditForm({...catEditForm,color:co})} style={{width:32,height:32,borderRadius:9,background:co,cursor:"pointer",border:catEditForm.color===co?"3px solid var(--text)":"3px solid transparent"}}/>)}</div></div>
            <Btn full onClick={saveCatEdit}>{showCatEdit==="new"?"Créer":"Modifier"}</Btn>
          </div>
        </Modal>
      </div>
    );
  }

  /* ── SAVINGS ── */
  function Savings(){
    const[show,setShow]=useState(null);const[movId,setMovId]=useState(null);const[objId,setObjId]=useState(null);const[arcId,setArcId]=useState(null);const[delId,setDelId]=useState(null);
    const[form,setForm]=useState({name:"",type:"livret",pid:ps[0]?.id||"A",bal:""});
    const[movForm,setMovForm]=useState({amount:"",type:"deposit",date:today()});
    const[objForm,setObjForm]=useState({name:"",target:"",dl:""});
    const accs=S.savings.filter(a=>!a.ar);const total=accs.reduce((s,a)=>s+savBalance(a),0);
    const doSave=()=>{if(!form.name)return;if(show==="new")up(s=>{s.savings.push({id:uid(),name:form.name,type:form.type,pid:form.pid,balance:parseFloat(form.bal)||0,movements:[],ar:false,objectives:[]});});else up(s=>{const a=s.savings.find(x=>x.id===show);if(a){a.name=form.name;a.type=form.type;a.pid=form.pid;a.balance=parseFloat(form.bal)||0;}});toast(show==="new"?"Créé":"Modifié");setShow(null);};
    const doMov=()=>{const a=parseFloat(String(movForm.amount).replace(",","."));if(!a)return;up(s=>{const acc=s.savings.find(x=>x.id===movId);if(acc)acc.movements.push({id:uid(),amount:movForm.type==="withdrawal"?-a:a,date:movForm.date});});toast(movForm.type==="deposit"?"Versé":"Retiré");setMovId(null);setMovForm({amount:"",type:"deposit",date:today()});};
    const doObj=()=>{if(!objForm.name)return;up(s=>{const a=s.savings.find(x=>x.id===objId);if(a)a.objectives.push({id:uid(),name:objForm.name,target:parseFloat(objForm.target)||0,dl:objForm.dl});});toast("Objectif ajouté");setObjId(null);setObjForm({name:"",target:"",dl:""});};
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <KPI label="Épargne totale" value={eur(total)} color="var(--green)"/>
        {accs.map(a=>{const b=savBalance(a);const pn=ps.find(p=>p.id===a.pid);return(
          <Card key={a.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><p style={{fontSize:16,fontWeight:700,color:"var(--text)",margin:0}}>{a.name}</p><div style={{display:"flex",gap:6,marginTop:4}}><span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:"var(--bg2)",color:"var(--text2)"}}>{SAV_TYPES.find(t=>t.v===a.type)?.l}</span>{pn&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:"var(--accent2)",color:"var(--accent)"}}>{pn.name}</span>}</div></div>
              <p style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:-.5,margin:0}}>{eur(b)}</p>
            </div>
            {(a.objectives||[]).map(o=>{const pv=o.target>0?b/o.target*100:0;return(
              <div key={o.id} style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r3)",marginTop:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"flex",alignItems:"center",gap:4}}><Target size={12}/>{o.name}</span><span style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>{pct(pv)}</span></div>
                <Prog val={b} max={o.target} color="var(--green)"/>
                <p style={{fontSize:11,color:"var(--text3)",margin:"4px 0 0"}}>Objectif : {eur(o.target)}{o.dl?" · "+o.dl:""}</p>
              </div>
            );})}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <Btn sm v="secondary" onClick={()=>setMovId(a.id)}><Plus size={13}/>Mouvement</Btn>
              <Btn sm v="secondary" onClick={()=>setObjId(a.id)}><Target size={13}/></Btn>
              <Btn sm v="ghost" onClick={()=>{setForm({name:a.name,type:a.type,pid:a.pid,bal:String(a.balance)});setShow(a.id);}}><Edit3 size={13}/></Btn>
              <Btn sm v="ghost" onClick={()=>setArcId(a.id)}><Archive size={13}/></Btn>
              <Btn sm v="danger" onClick={()=>setDelId(a.id)}><Trash2 size={13}/></Btn>
            </div>
          </Card>
        );})}
        <Btn v="secondary" full onClick={()=>{setForm({name:"",type:"livret",pid:ps[0]?.id||"A",bal:""});setShow("new");}}><Plus size={16}/>Nouveau</Btn>
        <Modal open={!!show} onClose={()=>setShow(null)} title={show==="new"?"Nouveau":"Modifier"}><div style={{display:"flex",flexDirection:"column",gap:14}}><Inp label="Nom" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Inp label="Solde" suffix="€" type="number" inputMode="decimal" value={form.bal} onChange={e=>setForm({...form,bal:e.target.value})}/><Sel label="Type" options={SAV_TYPES} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>{ps.length>1&&<Sel label="Personne" options={ps.map(p=>({v:p.id,l:p.name}))} value={form.pid} onChange={e=>setForm({...form,pid:e.target.value})}/>}<Btn full onClick={doSave}>{show==="new"?"Créer":"Enregistrer"}</Btn>{show!=="new"&&<Btn v="danger" full onClick={()=>{setDelId(show);setShow(null);}}>Supprimer</Btn>}</div></Modal>
        <Modal open={!!movId} onClose={()=>setMovId(null)} title="Mouvement"><div style={{display:"flex",flexDirection:"column",gap:14}}><SegTabs items={[{v:"deposit",l:"Versement"},{v:"withdrawal",l:"Retrait"}]} active={movForm.type} onChange={v=>setMovForm({...movForm,type:v})}/><Inp label="Montant" suffix="€" type="number" inputMode="decimal" value={movForm.amount} onChange={e=>setMovForm({...movForm,amount:e.target.value})}/><Inp label="Date" type="date" value={movForm.date} onChange={e=>setMovForm({...movForm,date:e.target.value})}/><Btn full onClick={doMov}>{movForm.type==="deposit"?"Verser":"Retirer"}</Btn></div></Modal>
        <Modal open={!!objId} onClose={()=>setObjId(null)} title="Objectif"><div style={{display:"flex",flexDirection:"column",gap:14}}><Inp label="Nom" value={objForm.name} onChange={e=>setObjForm({...objForm,name:e.target.value})} placeholder="Ex: Vacances"/><Inp label="Cible" suffix="€" type="number" inputMode="decimal" value={objForm.target} onChange={e=>setObjForm({...objForm,target:e.target.value})}/><Inp label="Échéance" type="month" value={objForm.dl} onChange={e=>setObjForm({...objForm,dl:e.target.value})}/><Btn full onClick={doObj}>Ajouter</Btn></div></Modal>
        <ConfirmDialog open={!!arcId} onClose={()=>setArcId(null)} onOk={()=>{up(s=>{const a=s.savings.find(x=>x.id===arcId);if(a)a.ar=true;});toast("Archivé");}} msg="Archiver ce compte ?"/>
        <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onOk={()=>{up(s=>{s.savings=s.savings.filter(x=>x.id!==delId);});toast("Supprimé");}} msg="Supprimer définitivement ce compte d'épargne ?"/>
      </div>
    );
  }

  /* ── MORE (Loans, Inv, Annual, Settings) ── */
  function MoreMenu(){
    if(sub==="loans")return (<Loans/>);
    if(sub==="inv")return (<Investments/>);
    if(sub==="ann")return (<Annual/>);
    if(sub==="cfg")return (<SettingsPage/>);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[{k:"loans",i:Landmark,l:"Prêts",s:"Crédits en cours",c:"var(--purple2)",ic:"var(--purple)"},{k:"inv",i:TrendingUp,l:"Investissements",s:"PEA, crypto, assurance-vie",c:"var(--blue2)",ic:"var(--blue)"},{k:"ann",i:DollarSign,l:"Vue annuelle",s:"Tendances & patrimoine",c:"var(--green2)",ic:"var(--green)"},{k:"cfg",i:Settings,l:"Paramètres",s:"Apparence, catégories",c:"var(--sep)",ic:"var(--text2)"}].map(({k,i:I2,l,s,c,ic})=>(
          <Card key={k} onClick={()=>setSub(k)}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:14,background:c,display:"flex",alignItems:"center",justifyContent:"center"}}><I2 size={20} color={ic} strokeWidth={1.8}/></div>
              <div style={{flex:1}}><p style={{fontSize:15,fontWeight:600,color:"var(--text)",margin:0}}>{l}</p><p style={{fontSize:13,color:"var(--text3)",margin:0}}>{s}</p></div>
              <ChevronRight size={16} color="var(--text4)"/>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  function Loans(){
    const[show,setShow]=useState(null);const[arcId,setArcId]=useState(null);const[delId,setDelId]=useState(null);
    const[form,setForm]=useState({name:"",s:"",e:"",rate:"",cap:""});
    const loans=S.loans.filter(l=>!l.ar);
    const doSave=()=>{if(!form.name)return;const rate=parseFloat(form.rate)||0,cap=parseFloat(form.cap)||0,m=loanMonths(form.s,form.e),mp=calcMP(cap,rate,m.t);if(show==="new")up(s=>{s.loans.push({id:uid(),name:form.name,s:form.s,e:form.e,rate,cap,mp,ac:true,ar:false});});else up(s=>{const l=s.loans.find(x=>x.id===show);if(l){l.name=form.name;l.s=form.s;l.e=form.e;l.rate=rate;l.cap=cap;l.mp=mp;}});toast(show==="new"?"Créé":"Modifié");setShow(null);};
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {loans.length===0?<EmptyState icon={Landmark} msg="Aucun prêt" action="Ajouter" onAction={()=>{setForm({name:"",s:"",e:"",rate:"",cap:""});setShow("new");}}/>:
          loans.map(l=>{const m=loanMonths(l.s,l.e);const mp=calcMP(l.cap,l.rate,m.t);const crd=calcCRD(l.cap,l.rate,m.t,m.e);return(
            <Card key={l.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><p style={{fontSize:16,fontWeight:700,color:"var(--text)",margin:0}}>{l.name}</p><div style={{display:"flex",gap:4}}><button onClick={()=>{setForm({name:l.name,s:l.s,e:l.e,rate:String(l.rate),cap:String(l.cap)});setShow(l.id);}} style={{width:32,height:32,borderRadius:10,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Edit3 size={14} color="var(--text3)"/></button><button onClick={()=>setArcId(l.id)} style={{width:32,height:32,borderRadius:10,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Archive size={14} color="var(--text3)"/></button><button onClick={()=>setDelId(l.id)} style={{width:32,height:32,borderRadius:10,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={14} color="var(--red)"/></button></div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["Mensualité",eur(mp)],["Échéances",m.r+"/"+m.t],["Capital restant",eur(Math.max(0,crd))],["Taux",l.rate+"%"]].map(([k,v],i)=><div key={i} style={{padding:10,background:"var(--bg2)",borderRadius:"var(--r3)"}}><p style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>{k}</p><p style={{fontSize:14,fontWeight:700,color:"var(--text)",margin:"3px 0 0"}}>{v}</p></div>)}</div>
              {m.t>0&&<div style={{marginTop:10}}><Prog val={m.e} max={m.t} color="var(--purple)"/><p style={{fontSize:11,color:"var(--text3)",margin:"4px 0 0",textAlign:"right"}}>{pct(m.e/m.t*100)} remboursé</p></div>}
            </Card>
          );})}
        <Btn v="secondary" full onClick={()=>{setForm({name:"",s:"",e:"",rate:"",cap:""});setShow("new");}}><Plus size={16}/>Nouveau prêt</Btn>
        <Modal open={!!show} onClose={()=>setShow(null)} title={show==="new"?"Nouveau":"Modifier"}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Crédit auto"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Capital" suffix="€" type="number" inputMode="decimal" value={form.cap} onChange={e=>setForm({...form,cap:e.target.value})}/><Inp label="Taux" suffix="%" type="number" inputMode="decimal" step="0.01" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Début" type="date" value={form.s} onChange={e=>setForm({...form,s:e.target.value})}/><Inp label="Fin" type="date" value={form.e} onChange={e=>setForm({...form,e:e.target.value})}/></div>
            {form.cap&&form.s&&form.e&&<div style={{padding:"12px 16px",borderRadius:14,background:"var(--green2)",display:"flex",alignItems:"center",gap:8}}><Check size={16} color="var(--green)"/><span style={{fontSize:14,fontWeight:600,color:"var(--green)"}}>Mensualité : {eur(calcMP(parseFloat(form.cap)||0,parseFloat(form.rate)||0,loanMonths(form.s,form.e).t))}</span></div>}
            <Btn full onClick={doSave}>{show==="new"?"Créer":"Modifier"}</Btn>
            {show!=="new"&&<Btn v="danger" full onClick={()=>{setDelId(show);setShow(null);}}>Supprimer</Btn>}
          </div>
        </Modal>
        <ConfirmDialog open={!!arcId} onClose={()=>setArcId(null)} onOk={()=>{up(s=>{const l=s.loans.find(x=>x.id===arcId);if(l)l.ar=true;});toast("Archivé");}} msg="Archiver ce prêt ?"/>
        <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onOk={()=>{up(s=>{s.loans=s.loans.filter(x=>x.id!==delId);});toast("Supprimé");}} msg="Supprimer définitivement ce prêt ?"/>
      </div>
    );
  }

  function Investments(){
    const[show,setShow]=useState(null);const[snapId,setSnapId]=useState(null);const[snapVal,setSnapVal]=useState("");const[arcId,setArcId]=useState(null);const[delId,setDelId]=useState(null);
    const[form,setForm]=useState({name:"",type:"pea",pid:ps[0]?.id||"A",val:""});
    const accs=S.investments.filter(a=>!a.ar);const total=accs.reduce((s,a)=>s+((a.snapshots||[]).slice(-1)[0]?.value||0),0);
    const doSave=()=>{if(!form.name)return;const nv=parseFloat(String(form.val).replace(",","."))||0;if(show==="new"){up(s=>{const snaps=nv>0?[{date:nowKey(),value:nv}]:[];s.investments.push({id:uid(),name:form.name,type:form.type,pid:form.pid,snapshots:snaps,ar:false});});}else{up(s=>{const a=s.investments.find(x=>x.id===show);if(a){a.name=form.name;a.type=form.type;a.pid=form.pid;const cur=(a.snapshots||[]).slice(-1)[0]?.value||0;if(nv!==cur){const last=a.snapshots.findIndex(x=>x.date===nowKey());if(last>=0)a.snapshots[last].value=nv;else a.snapshots.push({date:nowKey(),value:nv});}}});}toast(show==="new"?"Créé":"Modifié");setShow(null);};
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <KPI label="Investissements" value={eur(total)} color="var(--blue)"/>
        {accs.map(a=>{const v=(a.snapshots||[]).slice(-1)[0]?.value||0;const pv=(a.snapshots||[]).slice(-2,-1)[0]?.value;const d=pv!=null?v-pv:null;const pn=ps.find(p=>p.id===a.pid);return(
          <Card key={a.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><p style={{fontSize:16,fontWeight:700,color:"var(--text)",margin:0}}>{a.name}</p><div style={{display:"flex",gap:6,marginTop:4}}><span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:"var(--bg2)",color:"var(--text2)"}}>{INV_TYPES.find(t=>t.v===a.type)?.l}</span>{pn&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:"var(--blue2)",color:"var(--blue)"}}>{pn.name}</span>}</div></div>
              <div style={{textAlign:"right"}}><p style={{fontSize:22,fontWeight:700,letterSpacing:-.5,margin:0}}>{eur(v)}</p>{d!=null&&<p style={{fontSize:12,fontWeight:600,color:d>=0?"var(--green)":"var(--red)",margin:0}}>{d>=0?"+":""}{eur(d)}</p>}</div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <Btn sm v="secondary" onClick={()=>setSnapId(a.id)}><Plus size={13}/>Snapshot</Btn>
              <Btn sm v="ghost" onClick={()=>{const cv=(a.snapshots||[]).slice(-1)[0]?.value||0;setForm({name:a.name,type:a.type,pid:a.pid,val:cv?String(cv):""});setShow(a.id);}}><Edit3 size={13}/></Btn>
              <Btn sm v="ghost" onClick={()=>setArcId(a.id)}><Archive size={13}/></Btn>
              <Btn sm v="danger" onClick={()=>setDelId(a.id)}><Trash2 size={13}/></Btn>
            </div>
          </Card>
        );})}
        <Btn v="secondary" full onClick={()=>{setForm({name:"",type:"pea",pid:ps[0]?.id||"A",val:""});setShow("new");}}><Plus size={16}/>Nouveau</Btn>
        <Modal open={!!show} onClose={()=>setShow(null)} title={show==="new"?"Nouveau":"Modifier"}><div style={{display:"flex",flexDirection:"column",gap:14}}><Inp label="Nom" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Inp label="Valeur actuelle" suffix="€" type="number" inputMode="decimal" value={form.val} onChange={e=>setForm({...form,val:e.target.value})} placeholder="0"/><Sel label="Type" options={INV_TYPES} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>{ps.length>1&&<Sel label="Personne" options={ps.map(p=>({v:p.id,l:p.name}))} value={form.pid} onChange={e=>setForm({...form,pid:e.target.value})}/>}<Btn full onClick={doSave}>{show==="new"?"Créer":"Enregistrer"}</Btn>{show!=="new"&&<Btn v="danger" full onClick={()=>{setDelId(show);setShow(null);}}>Supprimer</Btn>}</div></Modal>
        <Modal open={!!snapId} onClose={()=>setSnapId(null)} title="Snapshot"><div style={{display:"flex",flexDirection:"column",gap:14}}><Inp label="Valeur" suffix="€" type="number" inputMode="decimal" value={snapVal} onChange={e=>setSnapVal(e.target.value)}/><Btn full onClick={()=>{const v=parseFloat(snapVal);if(!v)return;up(s=>{const a=s.investments.find(x=>x.id===snapId);if(a)a.snapshots.push({date:nowKey(),value:v});});toast("Enregistré");setSnapId(null);setSnapVal("");}}>Enregistrer</Btn></div></Modal>
        <ConfirmDialog open={!!arcId} onClose={()=>setArcId(null)} onOk={()=>{up(s=>{const a=s.investments.find(x=>x.id===arcId);if(a)a.ar=true;});toast("Archivé");}} msg="Archiver ?"/>
        <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onOk={()=>{up(s=>{s.investments=s.investments.filter(x=>x.id!==delId);});toast("Supprimé");}} msg="Supprimer définitivement cet investissement ?"/>
      </div>
    );
  }

  function Annual(){
    const yr=parseMonthKey(cm).getFullYear();
    const data=Array.from({length:12},(_,i)=>{const k=yr+"-"+String(i+1).padStart(2,"0");const m=getMonth(S,k);return{name:MONTHS[i].slice(0,3),Rev:sumRev(m),Dep:sumFC(m)+sumSpent(m)};});
    const tR=data.reduce((s,d)=>s+d.Rev,0),tD=data.reduce((s,d)=>s+d.Dep,0);
    const tSav=S.savings.filter(a=>!a.ar).reduce((s,a)=>s+savBalance(a),0);
    const tInv=S.investments.filter(a=>!a.ar).reduce((s,a)=>s+((a.snapshots||[]).slice(-1)[0]?.value||0),0);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <p style={{textAlign:"center",fontSize:22,fontWeight:700,color:"var(--text)",margin:0}}>{yr}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <KPI label="Revenus" value={eur(tR)}/><KPI label="Dépenses" value={eur(tD)}/>
          <KPI label="Net" value={eur(tR-tD)} color={tR-tD>=0?"var(--green)":"var(--red)"}/><KPI label="Patrimoine" value={eur(tSav+tInv)} color="var(--blue)"/>
        </div>
        <Card><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 16px"}}>Tendances</p>
          <ResponsiveContainer width="100%" height={180}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--sep)"/><XAxis dataKey="name" tick={{fontSize:9,fill:"var(--text3)"}}/><YAxis tick={{fontSize:9,fill:"var(--text3)"}} tickFormatter={v=>Math.round(v/1000)+"k"}/><Tooltip formatter={v=>eur(v)} contentStyle={{borderRadius:14,fontSize:12,border:"none",background:"var(--card)"}}/><Line type="monotone" dataKey="Rev" name="Revenus" stroke="var(--accent)" strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="Dep" name="Dépenses" stroke="var(--red)" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer>
        </Card>
      </div>
    );
  }

  function SettingsPage(){
    const[showCat,setShowCat]=useState(null);
    const[catForm,setCatForm]=useState({name:"",icon:"ShoppingCart",color:COLORS[0]});
    const[newHHName,setNewHHName]=useState("");
    const[showNewHH,setShowNewHH]=useState(false);
    const[copyCharges,setCopyCharges]=useState(true);
    const[editHH,setEditHH]=useState(null);
    const[editHHName,setEditHHName]=useState("");
    const[delHHId,setDelHHId]=useState(null);
    const[showImport,setShowImport]=useState(false);
    const saveCat=()=>{if(!catForm.name)return;if(showCat==="new")up(s=>{s.cfg.categories.push({id:uid(),name:catForm.name,icon:catForm.icon,color:catForm.color,o:s.cfg.categories.length});});else up(s=>{const c=s.cfg.categories.find(x=>x.id===showCat);if(c){c.name=catForm.name;c.icon=catForm.icon;c.color=catForm.color;}});toast(showCat==="new"?"Créée":"Modifiée");setShowCat(null);};
    const households=meta?.households||[];
    const activeHH=households.find(h=>h.id===meta?.active);
    const handleImport=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        const txt=await file.text();const data=JSON.parse(txt);
        if(data.meta&&data.households){
          for(const h of data.meta.households){await save(h.id,data.households[h.id]);}
          const merged=[...households.filter(h=>!data.meta.households.find(x=>x.id===h.id)),...data.meta.households];
          setMeta({households:merged,active:data.meta.active||merged[0]?.id});
          const d=await load(data.meta.active||merged[0]?.id);setS(d);
          toast("Backup restauré !");
        }else if(data.cfg){
          const id=uid();const hh=[...households,{id,name:"Import "+new Date().toLocaleDateString("fr-FR"),created:new Date().toISOString()}];
          await save(id,data);setMeta({households:hh,active:id});setS(data);
          toast("Données importées !");
        }else{toast("Format invalide","err");}
      }catch(err){toast("Erreur import","err");}
      setShowImport(false);
    };
    return(
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <Card>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Synchronisation cloud</p>
          {authUser?(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:"var(--green2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Cloud size={18} color="var(--green)"/></div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14,fontWeight:600,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{authUser.displayName||authUser.email}</p>
                  <p style={{fontSize:11,color:"var(--green)",margin:0,fontWeight:600}}>Synchronisé</p>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn sm v="secondary" onClick={async()=>{try{await window.firebaseAuth.forceSync();toast("Synchronisé !");}catch(e){toast("Erreur sync");}}}><Cloud size={14}/>Forcer sync</Btn>
                <Btn sm v="muted" onClick={async()=>{await window.firebaseAuth.signOut();setAuthUser(null);toast("Déconnecté");}}>Déconnexion</Btn>
              </div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CloudOff size={18} color="var(--text3)"/></div>
                <div><p style={{fontSize:14,fontWeight:500,color:"var(--text2)",margin:0}}>Données locales uniquement</p><p style={{fontSize:11,color:"var(--text3)",margin:"2px 0 0"}}>Connectez-vous pour synchroniser entre appareils</p></div>
              </div>
              <Btn full onClick={async()=>{try{const u=await window.firebaseAuth.signIn();setAuthUser(u);toast("Connecté !");}catch(e){if(e.code!=="auth/popup-closed-by-user")toast("Erreur connexion");}}}><LogIn size={16}/>Se connecter avec Google</Btn>
            </div>
          )}
        </Card>

        <Card>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Apparence</p>
          <div style={{display:"flex",gap:8}}>
            {[{v:"auto",i:Monitor,l:"Auto"},{v:"light",i:Sun,l:"Clair"},{v:"dark",i:Moon,l:"Sombre"}].map(({v,i:I2,l})=>(
              <button key={v} onClick={()=>up(s=>{s.cfg.dark=v;})} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:12,borderRadius:14,border:"2px solid "+(S.cfg.dark===v?"var(--accent)":"var(--sep)"),background:S.cfg.dark===v?"var(--accent2)":"transparent",cursor:"pointer"}}>
                <I2 size={18} color={S.cfg.dark===v?"var(--accent)":"var(--text3)"} strokeWidth={1.8}/><span style={{fontSize:12,fontWeight:600,color:S.cfg.dark===v?"var(--accent)":"var(--text3)"}}>{l}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Foyers</p>
            <button onClick={()=>{setNewHHName("");setShowNewHH(true);}} style={{width:28,height:28,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={14} color="var(--text3)"/></button>
          </div>
          {households.map(h=>(
            <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid var(--sep2)"}}>
              <div style={{width:36,height:36,borderRadius:11,background:h.id===meta?.active?"var(--accent2)":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Home size={15} color={h.id===meta?.active?"var(--accent)":"var(--text3)"}/></div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:14,fontWeight:h.id===meta?.active?700:500,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</p>
                {h.id===meta?.active&&<p style={{fontSize:11,color:"var(--accent)",margin:0,fontWeight:600}}>Actif</p>}
              </div>
              <div style={{display:"flex",gap:4}}>
                {h.id!==meta?.active&&<Btn sm v="secondary" onClick={()=>switchHH(h.id)}>Ouvrir</Btn>}
                <button onClick={()=>{setEditHH(h.id);setEditHHName(h.name);}} style={{width:30,height:30,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Edit3 size={12} color="var(--text3)"/></button>
                {households.length>1&&<button onClick={()=>setDelHHId(h.id)} style={{width:30,height:30,borderRadius:8,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={12} color="var(--red)"/></button>}
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Personnes du foyer</p>
            <button onClick={()=>up(s=>{const idx=s.cfg.persons.length;s.cfg.persons.push({id:uid(),name:"Personne "+(idx+1),type:"adult"});})} style={{width:28,height:28,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={14} color="var(--text3)"/></button>
          </div>
          {ps.map((p,idx)=>(
            <div key={p.id} style={{padding:"12px 0",borderBottom:"1px solid var(--sep2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:11,background:(p.type||"adult")==="child"?"var(--orange2)":"var(--accent2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(p.type||"adult")==="child"?<Baby size={16} color="var(--orange)"/>:<Users size={16} color="var(--accent)"/>}</div>
                <div style={{flex:1}}>
                  <EditableName value={p.name} onCommit={v=>up(s=>{const pr=s.cfg.persons.find(x=>x.id===p.id);if(pr)pr.name=v;})} style={{width:"100%",background:"transparent",border:"none",fontSize:15,fontWeight:600,color:"var(--text)",outline:"none",padding:0}}/>
                </div>
                {ps.length>1&&<button onClick={()=>{if(confirm("Retirer "+p.name+" du foyer ?"))up(s=>{s.cfg.persons=s.cfg.persons.filter(x=>x.id!==p.id);});}} style={{width:28,height:28,borderRadius:8,background:"var(--red2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={12} color="var(--red)"/></button>}
              </div>
              <SegTabs items={[{v:"adult",l:"Adulte"},{v:"child",l:"Enfant"}]} active={p.type||"adult"} onChange={v=>up(s=>{const pr=s.cfg.persons.find(x=>x.id===p.id);if(pr)pr.type=v;})}/>
            </div>
          ))}
          <p style={{fontSize:11,color:"var(--text3)",margin:"10px 0 0",lineHeight:1.4}}>Les adultes ont des revenus et participent au prorata. Les enfants peuvent avoir des comptes d'épargne/investissement sans revenu.</p>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:0}}>Catégories</p>
            <button onClick={()=>{setCatForm({name:"",icon:"ShoppingCart",color:COLORS[cats.length%COLORS.length]});setShowCat("new");}} style={{width:28,height:28,borderRadius:8,background:"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={14} color="var(--text3)"/></button>
          </div>
          {cats.sort((a,b)=>(a.o||0)-(b.o||0)).map(c=><Row key={c.id} onClick={()=>{setCatForm({name:c.name,icon:c.icon,color:c.color});setShowCat(c.id);}} icon={<Ico name={c.icon} size={15} color={c.color}/>} iconBg={c.color+"12"} left={c.name}/>)}
        </Card>

        <Card>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Export</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn sm v="secondary" onClick={()=>{exportCSV(S,activeHH?.name||"budget");toast("CSV exporté");}}><Download size={13}/>CSV dépenses</Btn>
            <Btn sm v="secondary" onClick={()=>{exportJSON(S,activeHH?.name||"budget");toast("JSON exporté");}}><Download size={13}/>JSON foyer</Btn>
          </div>
        </Card>

        <Card>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Backup</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn sm v="secondary" onClick={()=>{if(meta)exportBackup(meta);toast("Backup téléchargé");}}><Download size={13}/>Télécharger backup</Btn>
            <Btn sm v="secondary" onClick={()=>setShowImport(true)}><Upload size={13}/>Restaurer</Btn>
          </div>
          <p style={{fontSize:11,color:"var(--text3)",margin:"8px 0 0",lineHeight:1.4}}>Le backup inclut tous les foyers. La restauration fusionne avec les données existantes.</p>
        </Card>

        <Card>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 12px"}}>Données</p>
          <Btn v="danger" sm onClick={()=>{if(confirm("Supprimer toutes les données du foyer actif ?"))up(s=>{Object.keys(s).forEach(k=>{if(k!=="cfg")s[k]=Array.isArray(s[k])?[]:{}});s.months={};s.loans=[];s.savings=[];s.investments=[];});toast("Réinitialisé");}}>Réinitialiser ce foyer</Btn>
          <p style={{fontSize:11,color:"var(--text4)",margin:"8px 0 0"}}>V4.1 · Multi-foyers · Stockage local</p>
        </Card>

        <Modal open={!!showCat} onClose={()=>setShowCat(null)} title={showCat==="new"?"Nouvelle":"Modifier"}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom" value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})}/>
            <div><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 8px"}}>Icône</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ICON_KEYS.map(n=><button key={n} onClick={()=>setCatForm({...catForm,icon:n})} style={{width:40,height:40,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",border:"none",background:catForm.icon===n?"var(--accent)":"var(--bg2)",cursor:"pointer"}}><Ico name={n} size={17} color={catForm.icon===n?"#fff":"var(--text3)"}/></button>)}</div></div>
            <div><p style={{fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 8px"}}>Couleur</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{COLORS.map(c=><button key={c} onClick={()=>setCatForm({...catForm,color:c})} style={{width:30,height:30,borderRadius:15,background:c,border:"none",cursor:"pointer",outline:catForm.color===c?"3px solid var(--accent)":"none",outlineOffset:2}}/>)}</div></div>
            <Btn full onClick={saveCat}>{showCat==="new"?"Créer":"Modifier"}</Btn>
            {showCat!=="new"&&<Btn v="danger" full onClick={()=>{up(s=>{const c=s.cfg.categories.find(x=>x.id===showCat);if(c)c.ar=true;});toast("Archivée");setShowCat(null);}}>Archiver</Btn>}
          </div>
        </Modal>
        <Modal open={showNewHH} onClose={()=>setShowNewHH(false)} title="Nouveau foyer">
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom du foyer" value={newHHName} onChange={e=>setNewHHName(e.target.value)} placeholder="Ex: Maison secondaire"/>
            <div onClick={()=>setCopyCharges(!copyCharges)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,background:copyCharges?"var(--accent2)":"var(--bg2)",cursor:"pointer",border:copyCharges?"1.5px solid var(--accent)":"1.5px solid transparent"}}>
              <div style={{width:22,height:22,borderRadius:6,background:copyCharges?"var(--accent)":"var(--bg)",border:copyCharges?"none":"2px solid var(--text4)",display:"flex",alignItems:"center",justifyContent:"center"}}>{copyCharges&&<Check size={14} color="#fff"/>}</div>
              <div><p style={{fontSize:14,fontWeight:600,color:"var(--text)",margin:0}}>Copier les charges du foyer actif</p><p style={{fontSize:12,color:"var(--text3)",margin:"2px 0 0"}}>Charges fixes, catégories et budgets variables</p></div>
            </div>
            <Btn full onClick={()=>{if(!newHHName.trim())return;const ps2=[{id:"A",name:"Personne A",type:"adult"}];const ns=defaultState(ps2);if(copyCharges&&S){ns.cfg.categories=[...S.cfg.categories.map(c=>({...c}))];const curMonth=Object.values(S.months).find(m=>m.ok);if(curMonth){const firstKey=Object.keys(ns.months)[0]||cm;ns.months[firstKey]={...defaultMonth(firstKey,ns),charges:[...(curMonth.charges||[]).filter(c=>!c.auto).map(c=>({...c,id:uid()}))],cb:[...(curMonth.cb||[]).map(b=>({...b}))]};}};createHH(newHHName.trim(),ns);setShowNewHH(false);setCopyCharges(true);}}>Créer</Btn>
          </div>
        </Modal>
        <Modal open={!!editHH} onClose={()=>setEditHH(null)} title="Renommer le foyer">
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Nom" value={editHHName} onChange={e=>setEditHHName(e.target.value)}/>
            <Btn full onClick={()=>{if(!editHHName.trim())return;renameHH(editHH,editHHName.trim());toast("Renommé");setEditHH(null);}}>Enregistrer</Btn>
          </div>
        </Modal>
        <Modal open={showImport} onClose={()=>setShowImport(false)} title="Restaurer un backup">
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <p style={{fontSize:14,color:"var(--text2)",lineHeight:1.5,margin:0}}>Sélectionnez un fichier JSON (backup complet ou export de foyer).</p>
            <input type="file" accept=".json" onChange={handleImport} style={{fontSize:14,color:"var(--text)"}}/>
          </div>
        </Modal>
        <ConfirmDialog open={!!delHHId} onClose={()=>setDelHHId(null)} onOk={()=>{deleteHH(delHHId);toast("Foyer supprimé");}} msg="Supprimer définitivement ce foyer et toutes ses données ?"/>
      </div>
    );
  }

  /* ── RENDER ── */
  const tabs=[{k:"dash",i:Home,l:"Dashboard"},{k:"exp",i:Receipt,l:"Dépenses"},{k:"sav",i:PiggyBank,l:"Épargne"},{k:"more",i:MoreHorizontal,l:"Plus"}];
  const activePage=page==="more"&&sub?sub:page;
  const titles={dash:"Dashboard",exp:"Dépenses",chg:"Charges fixes",sav:"Épargne",loans:"Prêts",inv:"Investissements",ann:"Annuel",cfg:"Paramètres",more:"Plus"};

  const renderPage=()=>{
    switch(page){
      case"dash":return (<Dash/>);
      case"exp":return (<Expenses/>);
      case"sav":return (<Savings/>);
      case"more":return (<MoreMenu/>);
      default:return (<Dash/>);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',system-ui,sans-serif",transition:"background .3s,color .3s"}}>
      <style>{CSS}</style>

      {wiz&&<SimWizard S={S} cm={cm} onClose={()=>setWiz(false)} onSave={final=>{up(s=>{s.months[cm]=final;});toast("Simulation enregistrée !");setWiz(false);}}/>}

      <header className="sa-top" style={{position:"sticky",top:0,zIndex:20,background:"var(--bg)",borderBottom:".5px solid var(--sep)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px"}}>
          {page==="more"&&sub?(
            <button onClick={()=>setSub(null)} style={{display:"flex",alignItems:"center",gap:2,color:"var(--accent)",fontSize:15,fontWeight:500,background:"none",border:"none",cursor:"pointer"}}><ChevronLeft size={18}/>Plus</button>
          ):<div style={{width:60}}/>}
          <div style={{textAlign:"center"}}><h1 style={{fontSize:17,fontWeight:700,margin:0,letterSpacing:-.3}}>{titles[activePage]||"Plus"}</h1>{meta&&meta.households.length>1&&<p style={{fontSize:10,fontWeight:600,color:"var(--accent)",margin:0}}>{meta.households.find(h=>h.id===meta.active)?.name}</p>}</div>
          <div style={{width:60,display:"flex",justifyContent:"flex-end"}}>
            {page==="dash"&&<button onClick={()=>setWiz(true)} style={{width:36,height:36,borderRadius:12,background:"var(--accent)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 12px rgba(200,149,108,.25)"}}><Settings size={16} color="#fff" strokeWidth={1.8}/></button>}
          </div>
        </div>
        {activePage!=="cfg"&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,paddingBottom:12}}>
            <button onClick={()=>nav(-1)} style={{padding:4,background:"none",border:"none",cursor:"pointer"}}><ChevronLeft size={22} color="var(--text3)"/></button>
            <p style={{fontSize:15,fontWeight:600,color:"var(--text2)",minWidth:160,textAlign:"center",margin:0}}>{monthLabel(cm)}</p>
            <button onClick={()=>nav(1)} disabled={!canNav(addMonths(cm,1))} style={{padding:4,background:"none",border:"none",cursor:"pointer",opacity:canNav(addMonths(cm,1))?1:.2}}><ChevronRight size={22} color="var(--text3)"/></button>
          </div>
        )}
      </header>

      <main style={{padding:"16px 20px 120px",maxWidth:480,margin:"0 auto"}}>{renderPage()}</main>

      <nav className="sa-bot-nav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:20,background:"var(--bg)",borderTop:".5px solid var(--sep)"}}>
        <div style={{display:"flex",maxWidth:480,margin:"0 auto"}}>
          {tabs.map(({k,i:I2,l})=>(
            <button key={k} onClick={()=>{setPage(k);if(k!=="more")setSub(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 0 4px",background:"none",border:"none",cursor:"pointer",color:page===k?"var(--accent)":"var(--text3)",transition:"color .2s"}}>
              <I2 size={22} strokeWidth={page===k?2:1.5}/><span style={{fontSize:10,fontWeight:600}}>{l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
