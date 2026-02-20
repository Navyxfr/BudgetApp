import React, { Suspense, lazy, useState, useEffect, useCallback, createContext, useContext, useMemo, useReducer } from "react";
import {
  Home, Receipt, CreditCard, PiggyBank, ChevronLeft,
  ChevronRight, Plus, X, Check, AlertTriangle, TrendingUp, Wallet,
  Settings, Edit3, Trash2, Archive, Moon, Sun, Monitor,
  Target, ShoppingCart, Car, Baby, Dog, Scissors, Gamepad2,
  Utensils, Zap, Heart, BookOpen, Plane, Gift, Wrench, Smartphone,
  Music, Coffee, Briefcase, Landmark, Users, DollarSign,
  Shield, Star, RotateCcw, Play, Download, Upload, Copy, Tag, Cloud, CloudOff, LogIn, LogOut
} from "lucide-react";
import ExpensesFeature from "./features/expenses/ExpensesFeature.jsx";
import SavingsFeature from "./features/savings/SavingsFeature.jsx";
import LoansFeature from "./features/loans/LoansFeature.jsx";
import MetaFeature from "./features/meta/MetaFeature.jsx";
import InvestmentsFeature from "./features/investments/InvestmentsFeature.jsx";
import DashFeature from "./features/dashboard/DashFeature.jsx";
import OnboardingFeature from "./features/onboarding/OnboardingFeature.jsx";
import { budgetReducer } from "./store/budgetReducer.js";
import {
  hydrateFromStorage,
  saveMonthSimulation
} from "./store/actions.js";
import {
  defaultMonth,
  getMonth,
  sumRev,
  revPerson,
  sumAid,
  sumFC,
  prorata,
  sumVarBudget,
  sumSpent,
  personBalance,
  savBalance
} from "./core/aggregations.js";
import { addMonths, canNav, monthLabel, nowKey, parseMonthKey, today } from "./core/date.js";
import { defaultCats, defaultState } from "./core/defaults.js";
import {
  calcMonthlyPayment as calcMP,
  calcRemainingDebt as calcCRD,
  loanMonths
} from "./core/financial.js";
import { clamp, eur, pct } from "./core/formatters.js";

const SimulationFeature = lazy(() => import("./features/simulation/SimulationFeature.jsx"));
const AnnualFeature = lazy(() => import("./features/annual/AnnualFeature.jsx"));
const SettingsFeature = lazy(() => import("./features/settings/SettingsFeature.jsx"));

const CSS = `
:root {
  --bg:#F5F5F7;--bg2:#ECECEF;--card:#FFFFFF;--text:#1D1D1F;--text2:#5D5D62;
  --text3:#8B8B91;--text4:#D2D2D7;--sep:rgba(60,60,67,.14);--sep2:rgba(60,60,67,.08);
  --accent:#0071E3;--accent2:rgba(0,113,227,.14);--green:#34C759;--green2:rgba(52,199,89,.14);
  --red:#FF3B30;--red2:rgba(255,59,48,.14);--orange:#FF9F0A;--orange2:rgba(255,159,10,.14);
  --purple:#7C7CE6;--purple2:rgba(124,124,230,.14);--blue:#0A84FF;--blue2:rgba(10,132,255,.14);
  --r:22px;--r2:15px;--r3:11px;
}
.dark{--bg:#000000;--bg2:#1C1C1E;--card:#1C1C1E;--text:#F5F5F7;--text2:#B0B0B5;--text3:#8E8E93;--text4:#3A3A3C;--sep:rgba(120,120,128,.24);--sep2:rgba(120,120,128,.16);--accent:#0A84FF;--accent2:rgba(10,132,255,.22);--green2:rgba(48,209,88,.18);--red2:rgba(255,69,58,.2);--orange2:rgba(255,159,10,.2);--purple2:rgba(124,124,230,.2);--blue2:rgba(10,132,255,.2);}
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
body{
  margin:0;
  background:
    radial-gradient(1200px 420px at 8% -12%, rgba(0,113,227,.14), transparent 62%),
    radial-gradient(900px 380px at 100% 0%, rgba(10,132,255,.10), transparent 58%),
    var(--bg);
}
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
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation:none !important;transition:none !important;}
}
`;

/* â•â• CONSTANTS â•â• */
const SK="bp-v4";
const MONTHS=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const ICONS={ShoppingCart,Car,Baby,Dog,Scissors,Gamepad2,Utensils,Zap,Heart,BookOpen,Plane,Gift,Wrench,Smartphone,Music,Coffee,Briefcase,Receipt,PiggyBank,Wallet,CreditCard,Home,Landmark,DollarSign};
const ICON_KEYS=Object.keys(ICONS);
const COLORS=["#C8956C","#5B9A6F","#C89040","#C45B52","#8B7BB5","#D4837A","#6B8EB5","#B5A36B","#7BB5A8","#B57BB0","#7BAD5B","#B56B6B"];
const SAV_TYPES=[{v:"livret",l:"Livret"},{v:"pea",l:"PEA"},{v:"assurance_vie",l:"Assurance-vie"},{v:"autre",l:"Autre"}];
const INV_TYPES=[{v:"pea",l:"PEA"},{v:"assurance_vie",l:"Assurance-vie"},{v:"crypto",l:"Crypto"},{v:"trading",l:"Trading"}];
const FREQ=[{v:"monthly",l:"Mensuel"},{v:"quarterly",l:"Trimestriel"},{v:"annual",l:"Annuel"}];

/* â•â• UTILS â•â• */
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);

/* â•â• STORAGE (multi-household) â•â• */
const META_KEY="bp-v4-meta";
const hKey=id=>"bp-v4-h-"+id;
const loadMeta=async()=>{try{const r=await window.storage.get(META_KEY);return r&&r.value?JSON.parse(r.value):null;}catch(e){return null;}};
const saveMeta=async m=>{try{await window.storage.set(META_KEY,JSON.stringify(m));}catch(e){}};
const load=async id=>{try{const r=await window.storage.get(hKey(id));return r&&r.value?JSON.parse(r.value):null;}catch(e){return null;}};
const save=async(id,s)=>{try{await window.storage.set(hKey(id),JSON.stringify(s));}catch(e){}};
const migrateOld=async()=>{try{const r=await window.storage.get(SK);if(r&&r.value){const data=JSON.parse(r.value);const id=uid();const meta={households:[{id,name:"Mon foyer",created:new Date().toISOString()}],active:id};await saveMeta(meta);await save(id,data);try{await window.storage.delete(SK);}catch(e){}return{meta,data};}return null;}catch(e){return null;}};
/* â•â• EXPORT UTILS â•â• */
const dlFile=(content,name,type)=>{const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);};
const exportJSON=(state,name)=>dlFile(JSON.stringify(state,null,2),name+".json","application/json");
const exportCSV=(state,name)=>{
  const rows=[["Date","Categorie","Montant","Description","Mois"]];
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

/* â•â• TOAST CONTEXT â•â• */
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

const monthAggDeps={uid,loanMonths,calcMP};



/* â•â• UI PRIMITIVES â•â• */
function EditableName({value,onCommit,style:s}){
  const[v,setV]=useState(value);
  useEffect(()=>{setV(value);},[value]);
  return (<input value={v} onChange={e=>setV(e.target.value)} onBlur={()=>{if(v!==value)onCommit(v);}} style={s}/>);
}
function Ico({name,size,color}){const C=ICONS[name]||Receipt;return (<C size={size||18} color={color} strokeWidth={1.8}/>);}

const pressHandlers={
  onMouseDown:e=>{e.currentTarget.style.transform="scale(0.97)";e.currentTarget.style.opacity="0.85";},
  onMouseUp:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";},
  onMouseLeave:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";},
  onTouchStart:e=>{e.currentTarget.style.transform="scale(0.97)";e.currentTarget.style.opacity="0.85";},
  onTouchEnd:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";},
  onTouchCancel:e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="";}
};

function Card({children,onClick,p}){
  return(
    <div onClick={onClick} style={{background:"color-mix(in srgb, var(--card) 94%, transparent)",backdropFilter:"blur(6px)",borderRadius:"var(--r)",padding:p!=null?p:16,cursor:onClick?"pointer":"default",transition:"transform .22s cubic-bezier(.32,.72,0,1),opacity .18s,border-color .22s,box-shadow .22s",border:"1px solid var(--sep)",boxShadow:"0 14px 34px rgba(25,33,49,.08)"}} {...(onClick?pressHandlers:{})}>
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

function Btn({children,v,full,sm,disabled,onClick,style:extraStyle,ariaLabel}){
  const variant=v||"primary";
  const base={border:"none",borderRadius:14,fontSize:sm?13:15,fontWeight:700,letterSpacing:-.2,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,cursor:disabled?"default":"pointer",opacity:disabled?.35:1,transition:"transform .22s cubic-bezier(.32,.72,0,1),opacity .18s,box-shadow .22s,background .22s,color .22s",padding:sm?"8px 14px":"14px 22px",width:full?"100%":undefined};
  const variants={primary:{background:"linear-gradient(140deg,#0A84FF,var(--accent) 52%,#0068D1)",color:"#fff",boxShadow:"0 10px 24px rgba(10,132,255,.28)"},secondary:{background:"var(--accent2)",color:"var(--accent)"},danger:{background:"var(--red2)",color:"var(--red)"},ghost:{background:"transparent",color:"var(--accent)"},muted:{background:"var(--sep)",color:"var(--text2)"}};
  return (<button aria-label={ariaLabel} disabled={disabled} onClick={onClick} style={{...base,...variants[variant],...extraStyle}} {...(disabled?{}:pressHandlers)}>{children}</button>);
}

function Inp({label,suffix,error,...props}){
  return(
    <div>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.5,margin:"0 0 6px"}}>{label}</label>}
      <div style={{position:"relative"}}>
        <input {...props} style={{width:"100%",background:"color-mix(in srgb, var(--bg2) 92%, transparent)",border:"1.5px solid "+(error?"var(--red)":"transparent"),borderRadius:14,padding:"13px 16px",paddingRight:suffix?42:16,fontSize:15,fontWeight:500,color:"var(--text)",outline:"none",transition:"all .2s",...(props.style||{})}}
          onFocus={e=>{e.target.style.borderColor="var(--accent)";e.target.style.background="var(--card)";}}
          onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="color-mix(in srgb, var(--bg2) 92%, transparent)";}}
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
      <select value={value} onChange={onChange} style={{width:"100%",background:"color-mix(in srgb, var(--bg2) 92%, transparent)",border:"1.5px solid transparent",borderRadius:14,padding:"13px 16px",fontSize:15,fontWeight:500,color:"var(--text)",outline:"none",appearance:"none"}}>
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
        <button key={t.v} onClick={()=>onChange(t.v)} style={{flex:1,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:600,letterSpacing:-.2,border:"none",background:active===t.v?"var(--card)":"transparent",color:active===t.v?"var(--text)":"var(--text3)",cursor:"pointer",transition:"all .2s cubic-bezier(.32,.72,0,1)",boxShadow:active===t.v?"0 2px 8px rgba(0,0,0,.06)":"none"}}>{t.l}</button>
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
  const clickable = !!onClick;
  return(
    <div
      onClick={onClick}
      role={clickable?"button":undefined}
      tabIndex={clickable?0:undefined}
      onKeyDown={clickable?(e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onClick?.();}}):undefined}
      style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",cursor:clickable?"pointer":"default",borderBottom:"1px solid var(--sep2)",transition:"transform .18s,opacity .18s"}}
      {...(clickable?pressHandlers:{})}
    >
      {icon&&<div style={{width:40,height:40,borderRadius:12,background:iconBg||"var(--accent2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:15,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",margin:0}}>{left}</p>
        {sub&&<p style={{fontSize:13,color:"var(--text3)",margin:"2px 0 0"}}>{sub}</p>}
      </div>
      {right&&<div style={{textAlign:"right",flexShrink:0}}>{right}</div>}
      {clickable&&<ChevronRight size={16} color="var(--text4)"/>}
    </div>
  );
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN APP
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function App(){return (<ToastProvider><MainApp/></ToastProvider>);}

function MainApp(){
  // TODO(runtime): extract auth/storage/sync orchestration into useAppRuntime hook.
  const toast=useContext(ToastCtx);
  const[meta,setMeta]=useState(null);
  const[S,dispatch]=useReducer(budgetReducer,null);
  const[loading,setLoading]=useState(true);
  const[cm,setCm]=useState(nowKey());
  const[page,setPage]=useState("dash");
  const[sub,setSub]=useState(null);
  const[wiz,setWiz]=useState(false);
  const[authUser,setAuthUser]=useState(window.firebaseAuth?.user||null);
  const[syncing,setSyncing]=useState(false);

  /* Reload all state from storage */
  const reloadAll=useCallback(async()=>{
    let m=await loadMeta();
    if(!m){const mig=await migrateOld();if(mig){m=mig.meta;dispatch(hydrateFromStorage(mig.data));setMeta(m);return;}}
    if(!m)return;
    setMeta(m);
    if(m.active){const d=await load(m.active);dispatch(hydrateFromStorage(d));}
  },[]);

  useEffect(()=>{
    (async()=>{
      await reloadAll();
      setLoading(false);
    })();
    /* Listen for auth changes */
    const unsubAuth=window.firebaseAuth?.onAuthChange?.(user=>{setAuthUser(user);});
    /* Listen for sync events (cloud â†’ local pull done) */
    const unsubSync=window.firebaseAuth?.onSync?.(async()=>{setSyncing(true);await reloadAll();setSyncing(false);});
    /* Listen for auth redirect errors (mobile Safari etc.) */
    const unsubAuthErr=window.firebaseAuth?.onAuthError?.(e=>{
      if(e?.code!=="auth/popup-closed-by-user"&&e?.code!=="auth/redirect-cancelled-by-user"){
        toast(e?.code||e?.message||"Erreur de connexion");
      }
    });
    return ()=>{if(unsubAuth)unsubAuth();if(unsubSync)unsubSync();if(unsubAuthErr)unsubAuthErr();};
  },[reloadAll]);
  useEffect(()=>{if(S&&meta?.active&&!loading)save(meta.active,S);},[S,loading]);
  useEffect(()=>{if(meta&&!loading)saveMeta(meta);},[meta,loading]);

  const switchHH=async id=>{
    if(S&&meta?.active)await save(meta.active,S);
    const d=await load(id);dispatch(hydrateFromStorage(d));setMeta(p=>({...p,active:id}));
  };
  const createHH=(name,state)=>{
    const id=uid();
    setMeta(p=>{const hh=[...(p?.households||[]),{id,name,created:new Date().toISOString()}];return{...p,households:hh,active:id};});
    dispatch(hydrateFromStorage(state));
    setTimeout(()=>save(id,state),100);
    toast("Foyer cree");
  };
  const deleteHH=async id=>{
    if(!meta)return;
    const hh=meta.households.filter(h=>h.id!==id);
    try{await window.storage.delete(hKey(id));}catch(e){}
    const nextId=hh[0]?.id||null;
    const nextData=nextId?await load(nextId):null;
    setMeta({households:hh,active:nextId});dispatch(hydrateFromStorage(nextData));
  };
  const renameHH=(id,name)=>setMeta(p=>({...p,households:p.households.map(h=>h.id===id?{...h,name}:h)}));

  const dk=S?.cfg?.dark==="dark"||(S?.cfg?.dark==="auto"&&typeof window!=="undefined"&&window.matchMedia?.("(prefers-color-scheme:dark)").matches);
  useEffect(()=>{document.documentElement.classList.toggle("dark",!!dk);},[dk]);
  const md=useMemo(
    ()=>getMonth(S,cm,monthAggDeps),
    [S?.months, S?.cfg?.categories, S?.cfg?.persons, S?.loans, cm]
  );
  const cats=(S?.cfg?.categories||[]).filter(c=>!c.ar);
  const ps=S?.cfg?.persons||[];
  const nav=d=>{const n=addMonths(cm,d);if(canNav(n))setCm(n);};

  if(loading)return (<div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{width:36,height:36,borderRadius:12,background:"var(--accent)"}}/></div>);

  /* â”€â”€ Login screen at startup (no data yet + not logged in) â”€â”€ */
  if(!authUser){
    return(
      <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",position:"relative",overflow:"hidden"}}>
        <style>{CSS}</style>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(500px 240px at 18% 0%, rgba(0,113,227,.20), transparent 65%),radial-gradient(620px 300px at 92% 8%, rgba(10,132,255,.16), transparent 60%)"}}/>
        <div style={{width:"100%",maxWidth:360,background:"color-mix(in srgb, var(--card) 94%, transparent)",backdropFilter:"blur(10px)",border:"1px solid var(--sep)",borderRadius:28,padding:"28px 22px",boxShadow:"0 24px 46px rgba(16,22,35,.14)",position:"relative"}}>
        <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(140deg,#0A84FF,#0071E3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 16px 48px rgba(10,132,255,.34)"}}><Wallet size={32} color="#fff" strokeWidth={1.5}/></div>
        <h1 style={{fontSize:28,fontWeight:700,color:"var(--text)",margin:"0 0 8px",letterSpacing:-.8}}>Budget Planner</h1>
        <p style={{fontSize:14,color:"var(--text3)",margin:"0 0 40px",textAlign:"center",lineHeight:1.5}}>Connectez-vous avec Google pour acceder a vos foyers et les synchroniser.</p>
        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={async()=>{try{const u=await window.firebaseAuth.signIn();if(u)setAuthUser(u);}catch(e){if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/redirect-cancelled-by-user")toast(e.code||e.message);}}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px 20px",borderRadius:14,border:"none",background:"var(--accent)",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer"}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
        </div>
        <p style={{fontSize:11,color:"var(--text4)",margin:"24px 0 0",textAlign:"center",lineHeight:1.5}}>Mode sans compte desactive.</p>
        </div>
      </div>
    );
  }

  if(!meta||meta.households.length===0||!S||!S.cfg?.onb)return (
    <OnboardingFeature
      onDone={s=>{createHH("Mon foyer",s);toast("Budget configure !");}}
      defaultCats={defaultCats}
      defaultState={defaultState}
      COLORS={COLORS}
      FREQ={FREQ}
      SAV_TYPES={SAV_TYPES}
      INV_TYPES={INV_TYPES}
      CSS={CSS}
      SegTabs={SegTabs}
      Inp={Inp}
      Sel={Sel}
      Btn={Btn}
      Card={Card}
      Row={Row}
      Ico={Ico}
      loanMonths={loanMonths}
      calcMP={calcMP}
      eur={eur}
      uid={uid}
      defaultMonth={defaultMonth}
      monthAggDeps={monthAggDeps}
    />
  );

  /* â”€â”€ DASHBOARD / EXPENSES / SAVINGS / MORE â”€â”€ */
  /* â”€â”€ RENDER â”€â”€ */
  const tabs=[
    {k:"dash",i:Home,l:"Accueil"},
    {k:"exp",i:Receipt,l:"Transactions"},
    {k:"plan",i:Target,l:"Planification"},
    {k:"wealth",i:PiggyBank,l:"Patrimoine"},
    {k:"cfg",i:Settings,l:"Reglages"}
  ];
  const activePage=page;
  const titles={dash:"Accueil",exp:"Transactions",plan:"Planification",wealth:"Patrimoine",cfg:"Reglages"};
  const activeHouseholdName=meta&&meta.households.length>1?meta.households.find(h=>h.id===meta.active)?.name:null;
  const nextMonth=addMonths(cm,1);

  const renderPage=()=>{
    switch(page){
      case"dash":return (
        <DashFeature
          md={md}
          cats={cats}
          ps={ps}
          S={S}
          setWiz={setWiz}
          setPage={setPage}
          setSub={setSub}
          eur={eur}
          pct={pct}
          sumRev={sumRev}
          sumFC={sumFC}
          sumVarBudget={sumVarBudget}
          sumSpent={sumSpent}
          savBalance={savBalance}
          personBalance={personBalance}
          revPerson={revPerson}
          AlertBanner={AlertBanner}
          SegTabs={SegTabs}
          KPI={KPI}
          Card={Card}
          Prog={Prog}
          pressHandlers={pressHandlers}
        />
      );
      case"exp":return (<ExpensesFeature md={md} cats={cats} cm={cm} S={S} dispatch={dispatch} toast={toast} sumSpent={sumSpent} sumFC={sumFC} eur={eur} today={today} FREQ={FREQ} COLORS={COLORS} pressHandlers={pressHandlers} SegTabs={SegTabs} KPI={KPI} SecTitle={SecTitle} EmptyState={EmptyState} Card={Card} Row={Row} Modal={Modal} Inp={Inp} Sel={Sel} Btn={Btn} Ico={Ico} Prog={Prog}/>);
      case"plan":return (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <p style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.7,margin:"0 0 8px"}}>Simulation mensuelle</p>
            <p style={{fontSize:14,color:"var(--text2)",lineHeight:1.45,margin:"0 0 12px"}}>Prepare le mois en definissant la repartition des charges, des depenses variables et des objectifs d'epargne.</p>
            <Btn onClick={()=>setWiz(true)}><Play size={15}/>Lancer la simulation</Btn>
          </Card>
          <Suspense fallback={<div style={{padding:16,color:"var(--text3)"}}>Chargement de la vue annuelle...</div>}>
            <AnnualFeature
              S={S}
              cm={cm}
              MONTHS={MONTHS}
              parseMonthKey={parseMonthKey}
              getMonth={getMonth}
              monthAggDeps={monthAggDeps}
              sumRev={sumRev}
              sumFC={sumFC}
              sumSpent={sumSpent}
              savBalance={savBalance}
              eur={eur}
              KPI={KPI}
              Card={Card}
            />
          </Suspense>
        </div>
      );
      case"wealth":
        return(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <SegTabs items={[{v:"sav",l:"Epargne"},{v:"inv",l:"Investissements"},{v:"loans",l:"Prets"}]} active={sub||"sav"} onChange={setSub}/>
            {(sub||"sav")==="sav"&&(<SavingsFeature ps={ps} S={S} dispatch={dispatch} toast={toast} savBalance={savBalance} eur={eur} today={today} SAV_TYPES={SAV_TYPES} pct={pct} KPI={KPI} Card={Card} Prog={Prog} Btn={Btn} Modal={Modal} Inp={Inp} Sel={Sel} SegTabs={SegTabs} ConfirmDialog={ConfirmDialog}/>)}
            {sub==="inv"&&(<InvestmentsFeature S={S} ps={ps} dispatch={dispatch} toast={toast} nowKey={nowKey} INV_TYPES={INV_TYPES} eur={eur} KPI={KPI} Card={Card} Btn={Btn} Modal={Modal} Inp={Inp} Sel={Sel} ConfirmDialog={ConfirmDialog}/>)}
            {sub==="loans"&&(<LoansFeature S={S} dispatch={dispatch} toast={toast} loanMonths={loanMonths} calcMP={calcMP} calcCRD={calcCRD} eur={eur} pct={pct} EmptyState={EmptyState} Card={Card} Prog={Prog} Btn={Btn} Modal={Modal} Inp={Inp}/>)}
          </div>
        );
      case"cfg":return (
        <Suspense fallback={<div style={{padding:16,color:"var(--text3)"}}>Loading settings...</div>}>
          <SettingsFeature dispatch={dispatch} uid={uid} toast={toast} meta={meta} setMeta={setMeta} save={save} load={load} switchHH={switchHH} createHH={createHH} deleteHH={deleteHH} renameHH={renameHH} S={S} ps={ps} cm={cm} cats={cats} COLORS={COLORS} ICON_KEYS={ICON_KEYS} Ico={Ico} Row={Row} Btn={Btn} Card={Card} EditableName={EditableName} SegTabs={SegTabs} exportCSV={exportCSV} exportJSON={exportJSON} exportBackup={exportBackup} defaultState={defaultState} defaultMonth={defaultMonth} monthAggDeps={monthAggDeps} Inp={Inp} Modal={Modal} ConfirmDialog={ConfirmDialog} authUser={authUser} setAuthUser={setAuthUser}/>
        </Suspense>
      );
      default:return (
        <DashFeature
          md={md}
          cats={cats}
          ps={ps}
          S={S}
          setWiz={setWiz}
          setPage={setPage}
          setSub={setSub}
          eur={eur}
          pct={pct}
          sumRev={sumRev}
          sumFC={sumFC}
          sumVarBudget={sumVarBudget}
          sumSpent={sumSpent}
          savBalance={savBalance}
          personBalance={personBalance}
          revPerson={revPerson}
          AlertBanner={AlertBanner}
          SegTabs={SegTabs}
          KPI={KPI}
          Card={Card}
          Prog={Prog}
          pressHandlers={pressHandlers}
        />
      );
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",transition:"background .3s,color .3s",position:"relative"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(800px 320px at 6% -4%, rgba(0,113,227,.12), transparent 58%),radial-gradient(900px 340px at 100% -8%, rgba(10,132,255,.12), transparent 52%)"}}/>

      {wiz&&(
        <Suspense fallback={<div style={{position:"fixed",inset:0,zIndex:50,background:"var(--bg)",display:"grid",placeItems:"center",color:"var(--text2)",fontSize:14}}>Loading simulation...</div>}>
          <SimulationFeature
            S={S}
            cm={cm}
            onClose={()=>setWiz(false)}
            onSave={final=>{dispatch(saveMonthSimulation(cm,final));toast("Simulation enregistree !");setWiz(false);}}
            monthAggDeps={monthAggDeps}
            getMonth={getMonth}
            sumRev={sumRev}
            sumAid={sumAid}
            sumFC={sumFC}
            prorata={prorata}
            sumVarBudget={sumVarBudget}
            revPerson={revPerson}
            monthLabel={monthLabel}
            uid={uid}
            SAV_TYPES={SAV_TYPES}
            INV_TYPES={INV_TYPES}
            eur={eur}
            AlertBanner={AlertBanner}
            KPI={KPI}
            Card={Card}
            Btn={Btn}
            Inp={Inp}
            Sel={Sel}
            Row={Row}
            Ico={Ico}
          />
        </Suspense>
      )}

      <header className="sa-top" style={{position:"sticky",top:0,zIndex:20,background:"color-mix(in srgb, var(--bg) 90%, transparent)",backdropFilter:"blur(12px)",borderBottom:".5px solid var(--sep)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px"}}>
          <div style={{width:96,display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:"var(--accent2)",color:"var(--accent)",fontSize:11,fontWeight:700}}>
              <Wallet size={12}/>
              Budget
            </div>
          </div>
          <div style={{textAlign:"center"}}><h1 style={{fontSize:17,fontWeight:700,margin:0,letterSpacing:-.3}}>{titles[activePage]||"Accueil"}</h1><MetaFeature mode="household" activeHouseholdName={activeHouseholdName}/></div>
          <div style={{width:92,display:"flex",justifyContent:"flex-end",gap:8}}>
            <button aria-label="Etat de synchronisation" onClick={()=>{setPage("cfg");setSub(null);}} style={{width:36,height:36,borderRadius:12,background:authUser?"var(--green2)":"var(--bg2)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}} title={authUser?"Compte connecte":"Configurer le compte"}>
              {authUser?<Cloud size={16} color="var(--green)" strokeWidth={1.8}/>:<CloudOff size={16} color="var(--text3)" strokeWidth={1.8}/>}
              {syncing&&<span style={{position:"absolute",top:3,right:3,width:7,height:7,borderRadius:99,background:"var(--accent)"}}/>}
            </button>
            {page==="dash"&&<button aria-label="Relancer la simulation" onClick={()=>setWiz(true)} style={{width:36,height:36,borderRadius:12,background:"var(--accent)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 12px rgba(200,149,108,.25)"}}><Play size={16} color="#fff" strokeWidth={1.8}/></button>}
          </div>
        </div>
        {["dash","exp","plan"].includes(activePage) && (
          <MetaFeature mode="monthNav" activePage={activePage} monthLabelText={monthLabel(cm)} onPrevMonth={()=>nav(-1)} onNextMonth={()=>nav(1)} canGoNextMonth={canNav(nextMonth)}/>
        )}
      </header>

      <main style={{padding:"16px 20px 170px",maxWidth:520,margin:"0 auto",position:"relative",zIndex:1}}>{renderPage()}</main>

      <nav className="sa-bot-nav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:20,background:"color-mix(in srgb, var(--bg) 88%, transparent)",backdropFilter:"blur(12px)",borderTop:".5px solid var(--sep)"}}>
        <div style={{display:"flex",maxWidth:520,margin:"0 auto"}}>
          {tabs.map(({k,i:I2,l})=>(
            <button aria-label={`Ouvrir ${l}`} key={k} onClick={()=>{setPage(k);setSub(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 0 4px",background:"none",border:"none",cursor:"pointer",color:page===k?"var(--accent)":"var(--text3)",transition:"color .2s",position:"relative"}}>
              {page===k&&<span style={{position:"absolute",top:0,width:28,height:3,borderRadius:99,background:"var(--accent)"}}/>}
              <I2 size={22} strokeWidth={page===k?2:1.5}/><span style={{fontSize:10,fontWeight:600}}>{l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}



