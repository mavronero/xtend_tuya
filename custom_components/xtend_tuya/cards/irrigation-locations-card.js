function t(t,e,i,s){var n,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o<3?n(r):o>3?n(e,i,r):n(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:a,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,_=u.trustedTypes,$=_?_.emptyScript:"",m=u.reactiveElementPolyfillSupport,v=(t,e)=>t,g={toAttribute(t,e){switch(e){case Boolean:t=t?$:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},f=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:g,reflect:!1,useDefault:!1,hasChanged:f};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...c(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:g).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:g;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??f)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[v("elementProperties")]=new Map,b[v("finalized")]=new Map,m?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A=globalThis,w=t=>t,x=A.trustedTypes,E=x?x.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,U=`<${P}>`,N=document,O=()=>N.createComment(""),k=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,T="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,L=/>/g,D=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,j=/"/g,I=/^(?:script|style|textarea|title)$/i,q=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),B=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),V=new WeakMap,W=N.createTreeWalker(N,129);function J(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=R;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===R?"!--"===l[1]?r=H:void 0!==l[1]?r=L:void 0!==l[2]?(I.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=D):void 0!==l[3]&&(r=D):r===D?">"===l[0]?(r=n??R,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?D:'"'===l[3]?j:z):r===j||r===z?r=D:r===H||r===L?r=R:(r=D,n=void 0);const h=r===D&&t[e+1].startsWith("/>")?" ":"";o+=r===R?i+U:d>=0?(s.push(a),i.slice(0,d)+S+i.slice(d)+C+h):i+C+(-2===d?e:h)}return[J(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[l,d]=Z(t,e);if(this.el=G.createElement(l,i),W.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=W.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=d[o++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?tt:"?"===r[1]?et:"@"===r[1]?it:X}),s.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=x?x.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),W.nextNode(),a.push({type:2,index:++n});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===P)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)a.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,s){if(e===B)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=k(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=K(t,n._$AS(t,e.values),n,s)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??N).importNode(e,!0);W.currentNode=s;let n=W.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new Q(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new st(n,this,t)),this._$AV.push(e),a=i[++r]}o!==a?.index&&(n=W.nextNode(),o++)}return W.currentNode=N,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),k(t)?t===F||null==t||""===t?(this._$AH!==F&&this._$AR(),this._$AH=F):t!==this._$AH&&t!==B&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==F&&k(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=G.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Y(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new G(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new Q(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=F,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=K(this,t,e,0),o=!k(t)||t!==this._$AH&&t!==B,o&&(this._$AH=t);else{const s=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=K(this,s[i+r],e,r),a===B&&(a=this._$AH[r]),o||=!k(a)||a!==this._$AH[r],a===F?t=F:t!==F&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(t)}j(t){t===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===F?void 0:t}}class et extends X{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==F)}}class it extends X{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??F)===B)return;const i=this._$AH,s=t===F&&i!==F||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==F&&(i===F||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const nt=A.litHtmlPolyfillSupport;nt?.(G,Q),(A.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class rt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new Q(e.insertBefore(O(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}rt._$litElement$=!0,rt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:rt});const at=ot.litElementPolyfillSupport;at?.({LitElement:rt}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt={attribute:!0,type:String,converter:g,reflect:!1,hasChanged:f},dt=(t=lt,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ct(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ht(t){return ct({...t,state:!0,attribute:!1})}const pt=new Map;function ut(t,e={}){return function(t,e){const i=JSON.stringify(["",t]);let s=pt.get(i);return s||(s=new Intl.DateTimeFormat(e,{...t,timeZone:void 0}),pt.set(i,s)),s}(e).format(t)}const _t="xtend_tuya/irrigation_locations";function $t(t){const e=t;return e?.body?.error??e?.body?.message??e?.error??e?.message??String(t)}function mt(t){if(!t)return"never";const e=Math.floor((Date.now()-new Date(t).getTime())/864e5);return e<=0?"today":1===e?"yesterday":e<60?`${e} days ago`:ut(new Date(t).getTime())}const vt=t=>ut(new Date(t).getTime()),gt=t=>null==t?"–":`${Math.round(t)} L`,ft=t=>""===t.trim()||isNaN(Number(t))?null:Number(t);class yt extends rt{constructor(){super(...arguments),this._config=null,this._data=null,this._loading=!1,this._error=null,this._query="",this._open=null,this._edit=null,this._confirmEnd=null,this._busy=!1,this._postError=null,this._newName=null,this._showUnassigned=!1,this._fetched=!1}setConfig(t){this._config=t}getCardSize(){return this._config?.device_id?1:this._config?.unassigned?3:8}async _load(){if(this.hass?.callApi){this._fetched=!0,this._loading=!0,this._error=null;try{this._data=await this.hass.callApi("GET",_t)}catch(t){this._error=$t(t)}finally{this._loading=!1}}}async _post(t,e){if(!this.hass?.callApi)return!1;this._busy=!0,this._postError=null;try{return await this.hass.callApi("POST",_t,e),await this._load(),!0}catch(e){return this._postError={key:t,msg:$t(e)},!1}finally{this._busy=!1}}_toggle(t){this._open=this._open===t?null:t,this._edit=null,this._confirmEnd=null,this._postError=null}_startEdit(t){const e=t=>null==t?"":String(t);this._edit={name:t.name,description:t.description??"",expected_lpm:e(t.expected_lpm),lat:e(t.lat),lon:e(t.lon)}}async _save(t){const e=this._edit;await this._post(t.id,{action:"update_location",id:t.id,name:e.name.trim(),description:e.description,expected_lpm:ft(e.expected_lpm),lat:ft(e.lat),lon:ft(e.lon)})&&(this._edit=null)}async _create(){const t=(this._newName??"").trim();t&&await this._post("new",{action:"create_location",name:t})&&(this._newName=null)}_matches(t,e){if(!e)return!0;const i=[t.name,...t.devices.flatMap(t=>[t.number??"",t.valve_name??""])];return i.some(t=>t.toLowerCase().includes(e))}_chip(t){return q`<span class="chip" title=${t.valve_name??t.device_id}
      ><span class="dot ${t.online?"on":""}"></span>${t.number??t.valve_name??t.device_id}</span
    >`}_assignSelect(t,e){const i=this._data,s=i.locations.filter(e=>e.id!==t).flatMap(t=>t.devices.filter(t=>!t.end).map(e=>({d:e,l:t}))),n=i=>{const s=i.target,n=s.value;if(s.value="",!n)return;const o=e?{action:"assign_device",device_id:e,location_id:n}:{action:"assign_device",device_id:n,location_id:t};this._post(t??"unassigned",o)};return e?q`<select ?disabled=${this._busy} @change=${n}>
        <option value="">Assign to…</option>
        ${i.locations.map(t=>q`<option value=${t.id}>${t.name}</option>`)}
      </select>`:q`<select ?disabled=${this._busy} @change=${n}>
      <option value="">Assign device…</option>
      ${i.unassigned.length?q`<optgroup label="Unassigned">
            ${i.unassigned.map(t=>q`<option value=${t.device_id}>${t.valve_name??t.device_id}</option>`)}
          </optgroup>`:F}
      ${s.length?q`<optgroup label="Move from another location">
            ${s.map(({d:t,l:e})=>q`<option value=${t.device_id}>${t.number??t.valve_name??t.device_id} (${e.name})</option>`)}
          </optgroup>`:F}
    </select>`}_errFor(t){return this._postError?.key===t?q`<div class="err">${this._postError.msg}</div>`:F}_details(t){const e=this._edit,i=(t,i,s="text")=>q`<label
      >${i}<input
        type=${s}
        step="any"
        .value=${e[t]}
        @input=${i=>this._edit={...e,[t]:i.target.value}}
    /></label>`;return q`<div class="details">
      ${e?q`<div class="form">
            ${i("name","Name")} ${i("description","Description")}
            ${i("expected_lpm","Expected L/min","number")} ${i("lat","Latitude","number")}
            ${i("lon","Longitude","number")}
            <div class="actions">
              <button ?disabled=${this._busy||!e.name.trim()} @click=${()=>this._save(t)}>Save</button>
              <button class="flat" @click=${()=>this._edit=null}>Cancel</button>
            </div>
          </div>`:q`<dl>
              <dt>Description</dt>
              <dd>${t.description||"–"}</dd>
              <dt>Expected L/min</dt>
              <dd>${t.expected_lpm??"–"}</dd>
              <dt>GPS</dt>
              <dd>
                ${null!=t.lat&&null!=t.lon?q`${t.lat}, ${t.lon}
                      <a
                        href="https://www.openstreetmap.org/?mlat=${t.lat}&mlon=${t.lon}#map=18/${t.lat}/${t.lon}"
                        target="_blank"
                        rel="noopener"
                        >open map</a
                      >`:"–"}
              </dd>
              <dt>Last run</dt>
              <dd>${mt(t.stats.last_run_end)}${null!=t.stats.last_run_liters?` · ${gt(t.stats.last_run_liters)}`:""}</dd>
              <dt>Runs</dt>
              <dd>${t.stats.runs_7d} in 7 days · ${t.stats.runs_30d} in 30 days</dd>
            </dl>
            <button class="flat" @click=${()=>this._startEdit(t)}>Edit</button>`}
      <div class="sub">Devices</div>
      ${0===t.devices.length?q`<div class="dim">No devices yet.</div>`:F}
      ${t.devices.map(e=>q`<div class="hist">
          <div class="hist-main">
            ${this._chip(e)}
            <span class="dim">${e.valve_name??""}</span>
          </div>
          <div class="hist-meta">
            ${e.begin?vt(e.begin):"before records"} – ${e.end?vt(e.end):q`<b>installed</b>`}
            · ${e.source}
            ${e.end?F:this._confirmEnd===e.device_id?q`<span class="confirm"
                    >End here?
                    <button
                      ?disabled=${this._busy}
                      @click=${async()=>{await this._post(t.id,{action:"end_assignment",device_id:e.device_id,location_id:t.id})&&(this._confirmEnd=null)}}
                    >
                      Yes, end</button
                    ><button class="flat" @click=${()=>this._confirmEnd=null}>No</button></span
                  >`:q`<button class="flat" @click=${()=>this._confirmEnd=e.device_id}>End</button>`}
          </div>
        </div>`)}
      <div class="actions">${this._assignSelect(t.id,null)}</div>
      ${this._errFor(t.id)}
    </div>`}_row(t){const e=t.stats,i=t.devices.filter(t=>!t.end),s=this._open===t.id;return q`<div class="loc ${s?"open":""}">
      <div class="row" @click=${()=>this._toggle(t.id)}>
        <div class="row-top">
          <span class="name">${t.name}</span>
          <span class="chips">${i.map(t=>this._chip(t))}</span>
        </div>
        <div class="row-meta">
          <span>Last run ${mt(e.last_run_end)}</span>
          <span>${gt(e.liters_7d)} 7d · ${gt(e.liters_30d)} 30d</span>
          ${null!=t.expected_lpm&&null!=e.avg_lpm_30d?q`<span>${e.avg_lpm_30d.toFixed(1)} of ${t.expected_lpm} L/min expected</span>`:F}
        </div>
      </div>
      ${s?this._details(t):F}
    </div>`}_unassignedRows(t){return q`${t.unassigned.map(t=>q`<div class="hist">
          <div class="hist-main">${this._chip(t)}</div>
          ${this._assignSelect(null,t.device_id)}
        </div>`)}
      ${this._errFor("unassigned")}`}_renderUnassigned(){const t=this._data;return t&&0!==t.unassigned.length?q`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-question"></ha-icon>
        <span class="title">${this._config.title??"Valves without location"} (${t.unassigned.length})</span>
      </div>
      <div class="card-content">${this._unassignedRows(t)}</div>
    </ha-card>`:F}_renderDevice(t){const e=this._data,i=e=>e.device_id===t||e.ha_device_id===t,s=e?.locations.find(t=>t.devices.some(t=>i(t)&&!t.end))??null,n=s?.devices.find(t=>i(t))?.device_id??e?.unassigned.find(t=>i(t))?.device_id??t,o=e?q`<select ?disabled=${this._busy} @change=${t=>{const e=t.target,i=e.value;e.value="",i&&this._post("device",{action:"assign_device",device_id:n,location_id:i})}}>
          <option value="">${s?"Move to…":"Assign to…"}</option>
          ${e.locations.filter(t=>t.id!==s?.id).map(t=>q`<option value=${t.id}>${t.name}</option>`)}
        </select>`:F;return q`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-radius"></ha-icon>
        <span class="title">${this._config.title??"Location"}</span>
      </div>
      <div class="card-content">
        ${this._error?q`<div class="err">${this._error}</div>`:F}
        <div class="hist">
          <div class="hist-main">${s?q`<b>${s.name}</b>`:q`<span class="dim">Not assigned</span>`}</div>
          ${o}
        </div>
        ${this._errFor("device")}
      </div>
    </ha-card>`}render(){if(!this._config||!this.hass)return F;if(this._fetched||this._load(),this._config.device_id)return this._renderDevice(this._config.device_id);if(this._config.unassigned)return this._renderUnassigned();const t=this._data,e=this._query.trim().toLowerCase(),i=t?t.locations.filter(t=>this._matches(t,e)):[];return q`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-radius"></ha-icon>
        <span class="title">${this._config.title??"Irrigation locations"}</span>
        <button class="flat" title="Add location" @click=${()=>this._newName=null==this._newName?"":null}>
          + Location
        </button>
        <button class="flat" title="Refresh" ?disabled=${this._loading} @click=${()=>this._load()}>↻</button>
      </div>
      <div class="card-content">
        ${null!=this._newName?q`<div class="actions">
                <input
                  placeholder="New location name"
                  .value=${this._newName}
                  @input=${t=>this._newName=t.target.value}
                  @keydown=${t=>"Enter"===t.key&&this._create()}
                />
                <button ?disabled=${this._busy||!this._newName.trim()} @click=${()=>this._create()}>Create</button>
              </div>
              ${this._errFor("new")}`:F}
        <input
          class="search"
          type="search"
          placeholder="Search location or valve number"
          .value=${this._query}
          @input=${t=>this._query=t.target.value}
        />
        ${this._error?q`<div class="err">Could not load locations: ${this._error}</div>`:F}
        ${!t&&this._loading?q`<div class="dim">Loading…</div>`:F}
        ${t&&0===i.length?q`<div class="dim">No locations match.</div>`:F}
        ${i.map(t=>this._row(t))}
        ${t?q`<div class="unassigned">
              <div class="sub toggle" @click=${()=>this._showUnassigned=!this._showUnassigned}>
                ${this._showUnassigned?"▾":"▸"} Unassigned valves (${t.unassigned.length})
              </div>
              ${this._showUnassigned?this._unassignedRows(t):F}
            </div>`:F}
      </div>
    </ha-card>`}}if(yt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)})`
    :host {
      --lc-text: var(--primary-text-color, #212121);
      --lc-dim: var(--secondary-text-color, #727272);
      --lc-divider: var(--divider-color, #e0e0e0);
      --lc-on: var(--success-color, #4caf50);
      --lc-off: var(--disabled-text-color, #bdbdbd);
      --lc-accent: var(--primary-color, #03a9f4);
      --lc-err: var(--error-color, #db4437);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 4px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--lc-text);
    }
    .card-header ha-icon {
      color: var(--lc-dim);
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    .card-content {
      padding: 8px 16px 16px;
      color: var(--lc-text);
    }
    input,
    select {
      font: inherit;
      color: var(--lc-text);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--lc-divider);
      border-radius: 6px;
      padding: 6px 8px;
      box-sizing: border-box;
      max-width: 100%;
    }
    .search {
      width: 100%;
      margin-bottom: 8px;
    }
    button {
      font: inherit;
      font-size: 0.85em;
      border: 1px solid var(--lc-accent);
      background: var(--lc-accent);
      color: var(--text-primary-color, #fff);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    button.flat {
      background: transparent;
      color: var(--lc-accent);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .loc {
      border-bottom: 1px solid var(--lc-divider);
    }
    .row {
      padding: 8px 0;
      cursor: pointer;
    }
    .row-top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .name {
      font-weight: 500;
      margin-right: auto;
    }
    .row-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 12px;
      font-size: 0.8em;
      color: var(--lc-dim);
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .chips {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      border: 1px solid var(--lc-divider);
      border-radius: 12px;
      font-size: 0.8em;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lc-off);
    }
    .dot.on {
      background: var(--lc-on);
    }
    .details {
      padding: 0 0 12px 8px;
      font-size: 0.9em;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 2px 12px;
      margin: 0 0 6px;
    }
    dt {
      color: var(--lc-dim);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    a {
      color: var(--lc-accent);
      margin-left: 6px;
    }
    .form label {
      display: flex;
      flex-direction: column;
      font-size: 0.85em;
      color: var(--lc-dim);
      margin-bottom: 6px;
    }
    .sub {
      font-weight: 500;
      margin: 10px 0 4px;
    }
    .toggle {
      cursor: pointer;
      color: var(--lc-dim);
    }
    .hist {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 4px 8px;
      padding: 4px 0;
      border-top: 1px dashed var(--lc-divider);
    }
    .hist-main {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .hist-meta {
      font-size: 0.85em;
      color: var(--lc-dim);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }
    .confirm {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      color: var(--lc-text);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 6px 0;
    }
    .actions input {
      flex: 1;
      min-width: 0;
    }
    .dim {
      color: var(--lc-dim);
    }
    .err {
      color: var(--lc-err);
      font-size: 0.85em;
      margin: 4px 0;
    }
  `,t([ct({attribute:!1})],yt.prototype,"hass",void 0),t([ht()],yt.prototype,"_config",void 0),t([ht()],yt.prototype,"_data",void 0),t([ht()],yt.prototype,"_loading",void 0),t([ht()],yt.prototype,"_error",void 0),t([ht()],yt.prototype,"_query",void 0),t([ht()],yt.prototype,"_open",void 0),t([ht()],yt.prototype,"_edit",void 0),t([ht()],yt.prototype,"_confirmEnd",void 0),t([ht()],yt.prototype,"_busy",void 0),t([ht()],yt.prototype,"_postError",void 0),t([ht()],yt.prototype,"_newName",void 0),t([ht()],yt.prototype,"_showUnassigned",void 0),!customElements.get("irrigation-locations-card")){customElements.define("irrigation-locations-card",yt);const t=window;t.customCards=t.customCards||[],t.customCards.some(t=>"irrigation-locations-card"===t.type)||t.customCards.push({type:"irrigation-locations-card",name:"Irrigation Locations",description:"Irrigation locations with their installed valves, watering history and device assignments."})}export{yt as IrrigationLocationsCard};
