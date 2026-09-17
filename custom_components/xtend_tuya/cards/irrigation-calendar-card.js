function t(t,e,s,i){var r,n=arguments.length,o=n<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,s,o):r(e,s))||o);return n>3&&o&&Object.defineProperty(e,s,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),r=new WeakMap;let n=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&r.set(e,t))}return t}toString(){return this.cssText}};const o=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:a,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,m=u.trustedTypes,g=m?m.emptyScript:"",v=u.reactiveElementPolyfillSupport,f=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},_=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:_};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&l(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:r}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const n=i?.call(this);r?.call(this,e),this.requestUpdate(t,n,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...h(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),r=e.litNonce;void 0!==r&&i.setAttribute("nonce",r),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:$).toAttribute(e,s.type);this._$Em=t,null==r?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=i;const n=r.fromAttribute(e,t.type);this[i]=n??this._$Ej?.get(i)??n,this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(void 0!==t){const n=this.constructor;if(!1===i&&(r=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??_)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[f("elementProperties")]=new Map,b[f("finalized")]=new Map,v?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=t=>t,A=x.trustedTypes,k=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,P=`<${C}>`,T=document,M=()=>T.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,D="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,z=/>/g,H=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,I=/"/g,j=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),q=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),V=new WeakMap,F=T.createTreeWalker(T,129);function K(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(e):e}const G=(t,e)=>{const s=t.length-1,i=[];let r,n=2===e?"<svg>":3===e?"<math>":"",o=N;for(let e=0;e<s;e++){const s=t[e];let a,l,c=-1,d=0;for(;d<s.length&&(o.lastIndex=d,l=o.exec(s),null!==l);)d=o.lastIndex,o===N?"!--"===l[1]?o=R:void 0!==l[1]?o=z:void 0!==l[2]?(j.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=H):void 0!==l[3]&&(o=H):o===H?">"===l[0]?(o=r??N,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?H:'"'===l[3]?I:L):o===I||o===L?o=H:o===R||o===z?o=N:(o=H,r=void 0);const h=o===H&&t[e+1].startsWith("/>")?" ":"";n+=o===N?s+P:c>=0?(i.push(a),s.slice(0,c)+S+s.slice(c)+E+h):s+E+(-2===c?e:h)}return[K(t,n+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class J{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[l,c]=G(t,e);if(this.el=J.createElement(l,s),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=F.nextNode())&&a.length<o;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(S)){const e=c[n++],s=i.getAttribute(t).split(E),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:s,ctor:"."===o[1]?tt:"?"===o[1]?et:"@"===o[1]?st:Q}),i.removeAttribute(t)}else t.startsWith(E)&&(a.push({type:6,index:r}),i.removeAttribute(t));if(j.test(i.tagName)){const t=i.textContent.split(E),e=t.length-1;if(e>0){i.textContent=A?A.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],M()),F.nextNode(),a.push({type:2,index:++r});i.append(t[e],M())}}}else if(8===i.nodeType)if(i.data===C)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=i.data.indexOf(E,t+1));)a.push({type:7,index:r}),t+=E.length-1}r++}}static createElement(t,e){const s=T.createElement("template");return s.innerHTML=t,s}}function Y(t,e,s=t,i){if(e===q)return e;let r=void 0!==i?s._$Co?.[i]:s._$Cl;const n=O(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=r:s._$Cl=r),void 0!==r&&(e=Y(t,r._$AS(t,e.values),r,i)),e}class Z{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??T).importNode(e,!0);F.currentNode=i;let r=F.nextNode(),n=0,o=0,a=s[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new X(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new it(r,this,t)),this._$AV.push(e),a=s[++o]}n!==a?.index&&(r=F.nextNode(),n++)}return F.currentNode=T,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),O(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=J.createElement(K(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Z(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new J(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const r of t)i===e.length?e.push(s=new X(this.O(M()),this.O(M()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=W}_$AI(t,e=this,s,i){const r=this.strings;let n=!1;if(void 0===r)t=Y(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==q,n&&(this._$AH=t);else{const i=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=Y(this,i[s+o],e,o),a===q&&(a=this._$AH[o]),n||=!O(a)||a!==this._$AH[o],a===W?t=W:t!==W&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}n&&!i&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class et extends Q{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class st extends Q{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??W)===q)return;const s=this._$AH,i=t===W&&s!==W||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==W&&(s===W||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(J,X),(x.litHtmlVersions??=[]).push("3.3.2");const nt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ot extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let r=i._$litPart$;if(void 0===r){const t=s?.renderBefore??null;i._$litPart$=r=new X(e.insertBefore(M(),t),t,void 0,s??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ot._$litElement$=!0,ot.finalized=!0,nt.litElementHydrateSupport?.({LitElement:ot});const at=nt.litElementPolyfillSupport;at?.({LitElement:ot}),(nt.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:_},ct=(t=lt,e,s)=>{const{kind:i,metadata:r}=s;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const r=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,r,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const r=this[i];e.call(this,s),this.requestUpdate(i,r,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function dt(t){return(e,s)=>"object"==typeof s?ct(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ht(t){return dt({...t,state:!0,attribute:!1})}const pt={planned:0,missed:0,running:1,completed:1};const ut=864e5,mt=36e5,gt="xt-irrigation-calendar-mode",vt="xt-irrigation-calendar-range";function ft(t){return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function $t(t,e){const s=new Date(t);return s.setDate(s.getDate()+e),s}const _t=t=>String(t).padStart(2,"0"),yt=t=>{const e=new Date(t);return`${_t(e.getHours())}:${_t(e.getMinutes())}`},bt=t=>t>0?String(Math.round(t/6e4)):"–";function xt(t){const e=/·\s*~?([\d.,]+)\s*L\s*$/.exec(t);return e?Number(e[1].replace(",",".")):null}function wt(t,e){try{return localStorage.getItem(t)??e}catch{return e}}function At(t,e){try{localStorage.setItem(t,e)}catch{}}class kt extends ot{constructor(){super(...arguments),this._config=null,this._mode=["day","week","timeline"].includes(wt(gt,"day"))?wt(gt,"day"):"day",this._range=[1,3,7].includes(Number(wt(vt,"1")))?Number(wt(vt,"1")):1,this._anchor=ft(new Date),this._events=[],this._problemsOnly=!1,this._loading=!1,this._error=null,this._loadedKey=""}setConfig(t){this._config=t}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>this._load(!0),3e5)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}updated(){const t=`${this._mode}|${this._range}|${this._anchor.getTime()}`;t!==this._loadedKey&&this.hass?.callApi&&(this._loadedKey=t,this._load())}_window(){if("week"===this._mode){const t=function(t){const e=ft(t);return e.setDate(e.getDate()-(e.getDay()+6)%7),e}(this._anchor);return[t,$t(t,7)]}const t=ft(this._anchor);return[t,$t(t,"timeline"===this._mode?this._range:1)]}_valveByRegistry(){const t=new Map;for(const e of this._config?.valves??[])t.set(e.registry_entity,e);return t}async _load(t=!1){if(!this.hass?.callApi)return;const[e,s]=this._window(),i=`?start=${encodeURIComponent(e.toISOString())}&end=${encodeURIComponent(s.toISOString())}`,r=this._config?.planned_entity??"calendar.irrigation_planned",n=this._config?.completed_entity??"calendar.irrigation_completed";t||(this._loading=!0),this._error=null;try{const[t,e]=await Promise.all([this.hass.callApi("GET",`calendars/${r}${i}`),this.hass.callApi("GET",`calendars/${n}${i}`)]),s=this._valveByRegistry(),o=(t,e)=>{const i=Date.parse(t.start.dateTime??t.start.date??"");let r=Date.parse(t.end.dateTime??t.end.date??"");if(!Number.isFinite(i))return null;(!Number.isFinite(r)||r<=i)&&(r=i+6e4);const n=(t.uid??"").split("#")[0],o=s.get(n);return{start:i,end:r,kind:e,key:n,name:o?.valve_name??t.summary.split(" · ")[0],summary:t.summary,liters:"planned"===e?null:xt(t.summary),path:o?.view_path}},a=(e??[]).map(t=>o(t,/Type: In progress/.test(t.description??"")?"running":"completed")).filter(t=>!!t),l=Date.now(),c=(t??[]).map(t=>o(t,"planned")).filter(t=>!!t).map(t=>function(t,e,s,i=9e5){return!(t.end>s||e.some(e=>e.key===t.key&&Math.abs(e.start-t.start)<=i))}(t,a,l)?{...t,kind:"missed"}:t);this._events=[...c,...a]}catch(t){this._error=function(t){const e=t;return e?.body?.message??e?.message??String(t)}(t)}finally{this._loading=!1,t||this.updateComplete.then(()=>this._scrollToFirst())}}_scrollToFirst(){if("timeline"===this._mode)return;const[t,e]=this._window();let s=null;for(const i of this._events){if(i.end<=t.getTime()||i.start>=e.getTime())continue;const r=new Date(Math.max(i.start,t.getTime())),n=r.getHours()+r.getMinutes()/60;(null===s||n<s)&&(s=n)}const i=this.renderRoot.querySelector(".scroll");i&&null!==s&&(i.scrollTop=Math.max(0,(s-1)*this._hourPx()))}_hourPx(){return this._config?.hour_height??56}_setMode(t){this._mode=t,At(gt,t)}_setRange(t){this._range=t,At(vt,String(t))}_shift(t){const e="week"===this._mode?7:"timeline"===this._mode?this._range:1;this._anchor=$t(this._anchor,e*t)}_open(t){if(!t)return;const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",`/${e}/${t}`),this.dispatchEvent(new Event("location-changed",{bubbles:!0,composed:!0}))}_rangeLabel(){const[t,e]=this._window(),s={weekday:"short",day:"numeric",month:"short"};return e.getTime()-t.getTime()<=ut?t.toLocaleDateString(void 0,s):`${t.toLocaleDateString(void 0,{day:"numeric",month:"short"})} – ${$t(e,-1).toLocaleDateString(void 0,s)}`}_countsText(){const t={planned:0,completed:0,running:0,missed:0};for(const e of this._events)t[e.kind]++;const e=[`${t.planned+t.missed} planned`,`${t.completed} ran`];return t.running&&e.push(`${t.running} running`),t.missed&&e.push(`${t.missed} missed`),e.join(" · ")}render(){if(!this._config)return W;const t=this._mode,e=(e,s)=>B`<button class="txt tab ${t===e?"on":""}" @click=${()=>this._setMode(e)}>${s}</button>`;return B`
      <ha-card>
        <h1 class="card-header">${this._config.title??"Irrigation calendar"}</h1>
        <div class="card-subtitle">
          <span class="counts">${this._loading?"loading…":this._countsText()}</span>
          <span class="actions">
            ${e("day","Day")} ${e("week","Week")} ${e("timeline","Timeline")}
            ${"timeline"===t?B`<select class="range" @change=${t=>this._setRange(Number(t.target.value))}>
                  ${[1,3,7].map(t=>B`<option value=${t} ?selected=${t===this._range}>${t} d</option>`)}
                </select>`:W}
          </span>
        </div>
        <div class="card-subtitle nav">
          <span class="datenav">
            <button class="txt" @click=${()=>this._shift(-1)} aria-label="Previous">‹</button>
            <span class="range-label">${this._rangeLabel()}</span>
            <button class="txt" @click=${()=>this._shift(1)} aria-label="Next">›</button>
            <button class="txt" @click=${()=>this._anchor=ft(new Date)}>Today</button>
          </span>
          <span class="actions">
            ${"timeline"===t?B`<button class="txt ${this._problemsOnly?"on":""}" @click=${()=>this._problemsOnly=!this._problemsOnly}>
                  ${this._problemsOnly?"Showing problems":"Problems only"}
                </button>`:W}
            <span class="legend">
              <i class="sw planned"></i>planned <i class="sw completed"></i>ran
              <i class="sw missed"></i>missed
            </span>
          </span>
        </div>
        ${this._error?B`<div class="err">${this._error}</div>`:W}
        ${"timeline"===t?this._renderTimeline():this._renderGrid()}
      </ha-card>
    `}_renderGrid(){const[t]=this._window(),e="day"===this._mode?1:7,s=this._hourPx(),i=ft(new Date).getTime();return B`
      <div class="scroll">
        <div class="grid" style="--hour:${s}px;--days:${e}">
          <div class="hours">
            ${e>1?B`<div class="colhead"></div>`:W}
            ${Array.from({length:24},(t,e)=>B`<div class="hour">${_t(e)}:00</div>`)}
          </div>
          ${Array.from({length:e},(r,n)=>{const o=$t(t,n).getTime(),a=o+ut,l=this._events.filter(t=>t.start<a&&t.end>o).map(t=>({...t,start:Math.max(t.start,o),end:Math.min(Math.max(t.end,t.start+9e5),a)})),c=function(t){const e=[...t].sort((t,e)=>t.start-e.start||pt[t.kind]-pt[e.kind]||t.name.localeCompare(e.name)),s=[];let i=[],r=[],n=-1/0;const o=()=>{const t=i.length;for(const e of r)e.lanes=t;r=[],i=[]};for(const t of e){t.start>=n&&o();let e=i.findIndex(e=>e<=t.start);-1===e?(e=i.length,i.push(t.end)):i[e]=t.end;const a={ev:t,lane:e,lanes:0};r.push(a),s.push(a),n=Math.max(n,t.end)}return o(),s}(l),d=c.reduce((t,e)=>Math.max(t,e.lanes),1),h=e>1?40:72;return B`
              <div
                class="col ${o===i?"today":""}"
                style="min-width:${Math.max(110,d*h)}px"
              >
                ${e>1?B`<div class="colhead"><span>${new Date(o).toLocaleDateString(void 0,{weekday:"short",day:"numeric"})}</span></div>`:W}
                <div class="lines">
                  ${Array.from({length:96},(t,e)=>B`<div class="q ${e%4==0?"h":""}"></div>`)}
                </div>
                ${c.map(({ev:t,lane:e,lanes:i})=>{const r=(t.start-o)/mt*s,n=Math.max((t.end-t.start)/mt*s,s/4),a=100/i;return B`<div
                    class="ev ${t.kind} ${t.path?"link":""}"
                    style="top:${r}px;height:${n}px;left:${e*a}%;width:calc(${a}% - 2px)"
                    title=${t.summary}
                    @click=${()=>this._open(t.path)}
                  >
                    <b>${t.name}</b>
                    <span>${yt(t.start)}–${yt(t.end)}</span>
                  </div>`})}
              </div>
            `})}
        </div>
      </div>
    `}_renderTimeline(){const[t,e]=this._window(),s=t.getTime(),i=e.getTime()-s,r=t=>(t-s)/i*100,n=Date.now(),o=new Map;for(const t of this._events)(o.get(t.key)??o.set(t.key,[]).get(t.key)).push(t);const a=this._config?.valves??[],l=t=>`${t.home||"Unassigned"} · ${t.room||"—"}`,c=new Map;for(const t of[...a].sort((t,e)=>l(t).localeCompare(l(e))||t.valve_name.localeCompare(e.valve_name)))(c.get(l(t))??c.set(l(t),[]).get(l(t))).push(t);const d=[...c.keys()],h=1===this._range?3:3===this._range?12:24,p=[];for(let t=s;t<e.getTime();t+=h*mt){const e=new Date(t);p.push({left:r(t),label:h>=24||0===e.getHours()&&this._range>1?e.toLocaleDateString(void 0,{weekday:"short"}):`${_t(e.getHours())}`})}const u=Array.from({length:this._range-1},(t,e)=>r(s+(e+1)*ut)),m=n>s&&n<e.getTime()?r(n):null;let g=0;const v=d.map(t=>{const e=c.get(t).map(t=>{const e=o.get(t.registry_entity)??[],s=e.filter(t=>"planned"===t.kind||"missed"===t.kind),i=e.filter(t=>"completed"===t.kind||"running"===t.kind);s.filter(t=>"planned"===t.kind).map(t=>t.key);const r=i.filter(t=>!s.some(e=>Math.abs(e.start-t.start)<=9e5)),n=s.some(t=>"missed"===t.kind)||r.length>0||i.some(t=>t.end-t.start>144e5);return{v:t,plans:s,runs:i,unplanned:r,problem:n}}).filter(t=>!this._problemsOnly||t.problem);return e.length?(g+=e.length,B`
        <div class="grouphdr">${t}</div>
        ${e.map(({v:t,plans:e,runs:s,unplanned:i,problem:n})=>{const o=e.reduce((t,e)=>t+(e.end-e.start),0),a=s.reduce((t,e)=>t+(e.end-e.start),0),l=s.reduce((t,e)=>null==e.liters?t:(t??0)+e.liters,null);return B`
            <div class="row clickable ${n?"problem":""}" @click=${()=>this._open(t.view_path)}>
              <div class="name" title=${t.valve_name}>${t.valve_name}</div>
              <div class="track">
                ${u.map(t=>B`<i class="dayline" style="left:${t}%"></i>`)}
                ${e.map(t=>B`<i
                    class="ghost ${"missed"===t.kind?"missed":""}"
                    style="left:${r(t.start)}%;width:${Math.max(r(t.end)-r(t.start),.4)}%"
                    title=${t.summary}
                  ></i>`)}
                ${s.map(t=>B`<i
                    class="run ${"running"===t.kind?"running":""} ${i.includes(t)?"unplanned":""}"
                    style="left:${r(t.start)}%;width:${Math.max(r(t.end)-r(t.start),.4)}%"
                    title=${t.summary}
                  ></i>`)}
                ${null!==m?B`<i class="now" style="left:${m}%"></i>`:W}
              </div>
              <div class="metric ${o?"":"muted"}">${bt(o)}</div>
              <div class="metric ${a?"":"muted"}">${bt(a)}</div>
              <div class="metric ${null==l?"muted":""}">${(t=>null==t?"–":String(Math.round(t)))(l)}</div>
            </div>
          `})}
      `):W});return B`
      <div class="tl">
        <div class="row header">
          <div></div>
          <div class="axis">
            ${p.map(t=>B`<span style="left:${t.left}%">${t.label}</span>`)}
          </div>
          <div class="metric" title="Planned minutes in this range"><span class="lbl-long">plan min</span><span class="lbl-short">plan</span></div>
          <div class="metric" title="Minutes actually watered in this range"><span class="lbl-long">ran min</span><span class="lbl-short">ran</span></div>
          <div class="metric"><span class="lbl-long">water (L)</span><span class="lbl-short">L</span></div>
        </div>
        ${v}
        ${a.length?this._problemsOnly&&0===g?B`<div class="empty">No missed or unplanned runs in this range.</div>`:W:B`<div class="empty">No valves on this dashboard yet. Use "Re-sync valves" on the overview.</div>`}
      </div>
    `}}if(kt.styles=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new n(s,t,i)})`
    :host {
      --cc-text: var(--primary-text-color, #212121);
      --cc-dim: var(--secondary-text-color, #727272);
      --cc-line: var(--divider-color, #e0e0e0);
      --cc-primary: var(--primary-color, #03a9f4);
      --cc-planned: rgba(3, 169, 244, 0.3);
      --cc-water: var(--state-switch-active-color, #f9a825);
      --cc-missed: var(--error-color, #db4437);
      --cc-bg: var(--card-background-color, #fff);
      --cc-hover: var(--secondary-background-color, #f5f5f5);
    }
    ha-card {
      padding-bottom: 8px;
      color: var(--cc-text);
    }
    .card-header {
      font-size: 1.4rem;
      font-weight: 400;
      padding: 16px 16px 4px;
      margin: 0;
    }
    .card-subtitle {
      padding: 0 16px 10px;
      margin: 0;
      color: var(--cc-dim);
      font-size: 0.95rem;
      font-variant-numeric: tabular-nums;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .card-subtitle.nav {
      padding-bottom: 6px;
    }
    .actions,
    .datenav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .range-label {
      color: var(--cc-text);
      font-weight: 500;
      padding: 0 4px;
    }
    button.txt {
      border: none;
      background: none;
      color: var(--cc-primary);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    button.txt:hover {
      background: var(--cc-hover);
    }
    button.txt:focus-visible {
      outline: 2px solid var(--cc-primary);
      outline-offset: 1px;
    }
    button.tab.on {
      color: var(--cc-text);
      box-shadow: inset 0 -2px 0 var(--cc-primary);
      border-radius: 6px 6px 0 0;
    }
    button.txt.on:not(.tab) {
      background: var(--cc-hover);
      color: var(--cc-text);
    }
    select.range {
      border: 1px solid var(--cc-line);
      background: var(--cc-bg);
      color: var(--cc-text);
      font: inherit;
      font-size: 0.85rem;
      padding: 2px 6px;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 6px;
    }
    .legend {
      display: inline-flex;
      align-items: center;
      gap: 4px 6px;
      font-size: 0.8rem;
      margin-left: 8px;
    }
    .sw {
      display: inline-block;
      width: 12px;
      height: 10px;
      border-radius: 2px;
      box-sizing: border-box;
      margin-left: 6px;
    }
    .sw:first-child {
      margin-left: 0;
    }
    .sw.planned {
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
    }
    .sw.completed {
      background: var(--cc-water);
    }
    .sw.missed {
      border: 1px dashed var(--cc-missed);
    }
    .err {
      color: var(--cc-missed);
      padding: 0 16px 8px;
      font-size: 0.85rem;
    }
    .empty {
      padding: 12px 16px 8px;
      color: var(--cc-dim);
      font-size: 0.9rem;
    }

    /* ---- day / week grid ---- */
    .scroll {
      max-height: 72vh;
      overflow: auto;
      border-top: 1px solid var(--cc-line);
    }
    .grid {
      display: grid;
      /* auto tracks so a column's inline min-width (lanes × width) grows it */
      grid-template-columns: 48px repeat(var(--days), auto);
      min-width: max-content;
      position: relative;
    }
    .hours {
      position: sticky;
      left: 0;
      background: var(--cc-bg);
      z-index: 2;
    }
    .hour {
      height: var(--hour);
      font-size: 0.72rem;
      color: var(--cc-dim);
      text-align: right;
      padding-right: 6px;
      box-sizing: border-box;
      transform: translateY(-0.6em);
      font-variant-numeric: tabular-nums;
    }
    .colhead {
      position: sticky;
      top: 0;
      z-index: 3;
      background: var(--cc-bg);
      height: 22px;
      line-height: 22px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--cc-line);
      color: var(--cc-dim);
    }
    .colhead span {
      position: sticky;
      left: 54px;
      padding: 0 8px;
    }
    .col {
      position: relative;
      border-left: 1px solid var(--cc-line);
    }
    .col.today .colhead {
      color: var(--cc-primary);
      font-weight: 600;
    }
    .lines {
      height: calc(var(--hour) * 24);
    }
    .q {
      height: calc(var(--hour) / 4);
      box-sizing: border-box;
      border-top: 1px dotted var(--cc-line);
    }
    .q.h {
      border-top-style: solid;
    }
    .ev {
      position: absolute;
      box-sizing: border-box;
      overflow: hidden;
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 0.72rem;
      line-height: 1.2;
      color: var(--cc-text);
      background: var(--cc-bg);
      z-index: 1;
    }
    .col .ev {
      margin-top: 22px;
    }
    .grid[style*="--days:1"] .col .ev {
      margin-top: 0;
    }
    .ev.link {
      cursor: pointer;
    }
    .ev b,
    .ev span {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev b {
      font-weight: 500;
    }
    .ev span {
      color: var(--cc-dim);
    }
    .ev.planned {
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
    }
    .ev.completed,
    .ev.running {
      background: var(--cc-water);
    }
    .ev.running {
      box-shadow: inset 0 0 0 2px var(--cc-primary);
    }
    .ev.missed {
      border: 1px dashed var(--cc-missed);
    }

    /* ---- timeline ---- */
    .tl {
      display: flex;
      flex-direction: column;
    }
    .row {
      display: grid;
      grid-template-columns: 150px 1fr 74px 70px 68px;
      align-items: center;
      gap: 12px;
      height: 32px;
      padding: 0 16px;
    }
    .row.header {
      height: 22px;
      color: var(--cc-dim);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .row.clickable {
      cursor: pointer;
    }
    .row.clickable:hover {
      background: var(--cc-hover);
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }
    .row.problem .name {
      color: var(--cc-missed);
    }
    .axis {
      position: relative;
      height: 100%;
      font-variant-numeric: tabular-nums;
    }
    .axis span {
      position: absolute;
      top: 3px;
      transform: translateX(-50%);
    }
    .axis span:first-child {
      transform: none;
    }
    .track {
      position: relative;
      height: 22px;
      border-radius: 3px;
      box-shadow: inset 0 0 0 1px var(--cc-line);
      overflow: hidden;
      /* hour gridlines: one faint tick per hour of the range */
      background-image: repeating-linear-gradient(
        to right,
        var(--cc-line) 0 1px,
        transparent 1px calc(100% / (24 * var(--days, 1)))
      );
      background-size: calc(100% + 1px) 6px;
      background-repeat: repeat-x;
      background-position: 0 bottom;
    }
    .track i {
      position: absolute;
      top: 0;
      bottom: 0;
      display: block;
      /* a 10-min run is 0.7% of a day: keep it a visible mark, like the matrix */
      min-width: 3px;
    }
    .dayline {
      width: 1px;
      background: var(--cc-line);
    }
    .ghost {
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
      border-radius: 2px;
      box-sizing: border-box;
    }
    .ghost.missed {
      background: none;
      box-shadow: none;
      border: 1px dashed var(--cc-missed);
    }
    .run {
      top: 4px;
      bottom: 4px;
      background: var(--cc-water);
      border-radius: 2px;
    }
    .run.running {
      box-shadow: inset 0 0 0 2px var(--cc-primary);
    }
    .now {
      width: 1px;
      min-width: 1px;
      background: var(--cc-text);
      opacity: 0.5;
    }
    .metric {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .metric.muted {
      color: var(--cc-dim);
    }
    .grouphdr {
      padding: 10px 16px 3px;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--cc-primary);
      border-top: 1px solid var(--cc-line);
    }
    .row.header + .grouphdr {
      border-top: none;
    }
    .lbl-short {
      display: none;
    }
    @media (max-width: 620px) {
      .row {
        grid-template-columns: 92px 1fr 40px 40px 40px;
        gap: 6px;
        padding: 0 10px;
      }
      .name {
        font-size: 0.8rem;
      }
      .metric {
        font-size: 0.78rem;
      }
      .lbl-long {
        display: none;
      }
      .lbl-short {
        display: inline;
      }
      .grouphdr {
        padding: 10px 10px 3px;
      }
      .card-subtitle {
        padding-left: 10px;
        padding-right: 10px;
      }
      .card-header {
        padding-left: 10px;
        padding-right: 10px;
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .run.running {
        animation: xt-pulse 2s ease-in-out infinite;
      }
      @keyframes xt-pulse {
        50% {
          opacity: 0.6;
        }
      }
    }
  `,t([dt({attribute:!1})],kt.prototype,"hass",void 0),t([ht()],kt.prototype,"_config",void 0),t([ht()],kt.prototype,"_mode",void 0),t([ht()],kt.prototype,"_range",void 0),t([ht()],kt.prototype,"_anchor",void 0),t([ht()],kt.prototype,"_events",void 0),t([ht()],kt.prototype,"_problemsOnly",void 0),t([ht()],kt.prototype,"_loading",void 0),t([ht()],kt.prototype,"_error",void 0),!customElements.get("irrigation-calendar-card")){customElements.define("irrigation-calendar-card",kt);const t=window;t.customCards=t.customCards||[],t.customCards.some(t=>"irrigation-calendar-card"===t.type)||t.customCards.push({type:"irrigation-calendar-card",name:"Irrigation Calendar",description:"Planned and completed irrigation runs as a day grid, week grid or per-valve timeline."})}export{kt as IrrigationCalendarCard};
