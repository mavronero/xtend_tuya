function t(t,e,i,s){var n,a=arguments.length,r=a<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(n=t[o])&&(r=(a<3?n(r):a>3?n(e,i,r):n(e,i))||r);return a>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:p,getOwnPropertySymbols:u,getPrototypeOf:h}=Object,m=globalThis,v=m.trustedTypes,g=v?v.emptyScript:"",f=m.reactiveElementPolyfillSupport,x=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},_=(t,e)=>!l(t,e),y={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:_};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(x("elementProperties")))return;const t=h(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(x("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(x("properties"))){const t=this.properties,e=[...p(t),...u(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??_)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[x("elementProperties")]=new Map,$[x("finalized")]=new Map,f?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,k=t=>t,S=w.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+M,L=`<${C}>`,N=document,z=()=>N.createComment(""),D=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,P="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,U=/>/g,H=RegExp(`>|${P}(?:([^\\s"'>=/]+)(${P}*=${P}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,F=/"/g,j=/^(?:script|style|textarea|title)$/i,W=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),B=W(1),q=W(2),V=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),K=new WeakMap,J=N.createTreeWalker(N,129);function Y(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const X=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",r=T;for(let e=0;e<i;e++){const i=t[e];let o,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===T?"!--"===l[1]?r=R:void 0!==l[1]?r=U:void 0!==l[2]?(j.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=H):void 0!==l[3]&&(r=H):r===H?">"===l[0]?(r=n??T,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?H:'"'===l[3]?F:I):r===F||r===I?r=H:r===R||r===U?r=T:(r=H,n=void 0);const p=r===H&&t[e+1].startsWith("/>")?" ":"";a+=r===T?i+L:d>=0?(s.push(o),i.slice(0,d)+A+i.slice(d)+M+p):i+M+(-2===d?e:p)}return[Y(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const r=t.length-1,o=this.parts,[l,d]=X(t,e);if(this.el=Z.createElement(l,i),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=J.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(A)){const e=d[a++],i=s.getAttribute(t).split(M),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?st:"?"===r[1]?nt:"@"===r[1]?at:it}),s.removeAttribute(t)}else t.startsWith(M)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(j.test(s.tagName)){const t=s.textContent.split(M),e=t.length-1;if(e>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],z()),J.nextNode(),o.push({type:2,index:++n});s.append(t[e],z())}}}else if(8===s.nodeType)if(s.data===C)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(M,t+1));)o.push({type:7,index:n}),t+=M.length-1}n++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=D(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Q(t,n._$AS(t,e.values),n,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??N).importNode(e,!0);J.currentNode=s;let n=J.nextNode(),a=0,r=0,o=i[0];for(;void 0!==o;){if(a===o.index){let e;2===o.type?e=new et(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new rt(n,this,t)),this._$AV.push(e),o=i[++r]}a!==o?.index&&(n=J.nextNode(),a++)}return J.currentNode=N,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),D(t)?t===G||null==t||""===t?(this._$AH!==G&&this._$AR(),this._$AH=G):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==G&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new Z(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new et(this.O(z()),this.O(z()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}let it=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=G,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=Q(this,t,e,0),a=!D(t)||t!==this._$AH&&t!==V,a&&(this._$AH=t);else{const s=t;let r,o;for(t=n[0],r=0;r<n.length-1;r++)o=Q(this,s[i+r],e,r),o===V&&(o=this._$AH[r]),a||=!D(o)||o!==this._$AH[r],o===G?t=G:t!==G&&(t+=(o??"")+n[r+1]),this._$AH[r]=o}a&&!s&&this.j(t)}j(t){t===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}};class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===G?void 0:t}}class nt extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==G)}}class at extends it{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??G)===V)return;const i=this._$AH,s=t===G&&i!==G||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const ot=w.litHtmlPolyfillSupport;ot?.(Z,et),(w.litHtmlVersions??=[]).push("3.3.2");const lt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class dt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new et(e.insertBefore(z(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}dt._$litElement$=!0,dt.finalized=!0,lt.litElementHydrateSupport?.({LitElement:dt});const ct=lt.litElementPolyfillSupport;ct?.({LitElement:dt}),(lt.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const pt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:_},ut=(t=pt,e,i)=>{const{kind:s,metadata:n}=i;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),a.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ht(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function mt(t){return ht({...t,state:!0,attribute:!1})}async function vt(t){if(!t.callApi)return{};try{const e=await t.callApi("GET","xtend_tuya/valve_locations");return e?.locations??{}}catch{return{}}}const gt="irrigation_timer_registry",ft={start_time:"start_time_sensor",close_time:"end_time_sensor",end_time:"end_time_sensor",watering_mode:"mode_sensor",watering_value:"value_sensor",watering_volume:"volume_sensor",watering_flow_rate:"flow_rate_sensor",battery_level:"battery_level",last_report:"last_report",watering_duration:"duration",rain_snow_delay:"rain_snow_delay",battery:"battery_level",indexed_irrigation_duration:"duration"},xt=[[/_last_watering_start$/,"start_time_sensor"],[/_last_watering_end$/,"end_time_sensor"],[/_watering_flow_rate$/,"flow_rate_sensor"],[/_watering_value$/,"value_sensor"],[/_watering_volume$/,"volume_sensor"],[/_watering_duration$/,"duration"],[/_watering_mode$/,"mode_sensor"],[/_rain_snow_delay$/,"rain_snow_delay"],[/_battery_level$/,"battery_level"]];function bt(t,e,i,s,n,a={}){const r=t.devices[i],o=n.attributes.valve_name??n.attributes.valve_factory_name??r?.name_by_user??r?.name??s,l=n.attributes.valve_factory_name??r?.name??o,d=`${_t}?id=${encodeURIComponent(s)}`;const c={device_id:s,registry_entity:e,valve_name:o,factory_name:l,valve_home:a[s]?.home??a[i]?.home??n.attributes.valve_home??null,valve_room:a[s]?.room??a[i]?.room??n.attributes.valve_room??null,view_path:d},p=(t,e)=>{c[t]||(c[t]=e)};let u;for(const e of Object.values(t.entities)){if(e.device_id!==i)continue;if(!t.states[e.entity_id])continue;if(e.entity_id.startsWith("switch.")&&("valve"===e.translation_key||"indexed_switch"===e.translation_key||e.entity_id.endsWith("_valve"))){c.switch||(c.switch=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&"switch_1"===e.translation_key){u||(u=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&e.entity_id.endsWith("_sleep_mode")){c.sleep_mode=e.entity_id;continue}const s=e.translation_key;if(s){const t=ft[s];if(t){p(t,e.entity_id);continue}}for(const[t,i]of xt)if(t.test(e.entity_id)){p(i,e.entity_id);break}}return!c.switch&&u&&(c.switch=u),c}const _t="valve";const yt={runs:[],planned:[],sites:[],locations:[],locationOf:{},pumps:[],pumpAssignments:[],pumpConnections:[]};let $t=null;function wt(t,e=Date.now()){if(!$t||e-$t.at>6e4){const i=async function(t,e){if(!t.callApi)return yt;const i=t=>encodeURIComponent(new Date(t).toISOString()),[s,n,a]=await Promise.all([t.callApi("GET",`xtend_tuya/runs?since=${i(e-2592e6)}`),t.callApi("GET","xtend_tuya/irrigation_locations"),t.callApi("GET",`calendars/calendar.irrigation_planned?start=${i(e-1728e5)}&end=${i(e+6912e5)}`)]),r=t=>t?Date.parse(t):null,o=new Map((n?.sites??[]).map(t=>[t.id,t.name])),l=[],d={};for(const t of n?.locations??[]){const e=t.devices??[],i=t.pump?{id:t.pump.id,name:t.pump.name,via:t.pump.inherited_from?o.get(t.pump.inherited_from)??null:null}:null,s={id:t.id,name:t.name,site_id:t.site_id??null,valves:e.filter(t=>null===t.end).map(t=>t.device_id),assignments:e.map(t=>({device_id:t.device_id,begin:r(t.begin),end:r(t.end)})),expected_lpm:t.expected_lpm??null,description:t.description??"",pump:i};l.push(s);for(const t of s.valves)d[t]=s}const c=[];for(const t of a??[]){const e=Date.parse(t.start.dateTime??t.start.date??""),i=Date.parse(t.end.dateTime??t.end.date??"");Number.isFinite(e)&&c.push({key:(t.uid??"").split("#")[0],start:e,end:i>e?i:e+6e4})}return{runs:s?.runs??[],planned:c,sites:n?.sites??[],locations:l,locationOf:d,pumps:(n?.pumps??[]).map(t=>({flow_entity:null,pressure_entity:null,status_entity:null,...t})),pumpAssignments:(n?.pump_assignments??[]).map(t=>({...t,begin:r(t.begin),end:r(t.end)})),pumpConnections:(n?.pump_connections??[]).map(t=>({...t,begin:r(t.begin),end:r(t.end)}))}}(t,e);$t={at:e,data:i},i.catch(()=>{$t?.data===i&&($t=null)})}return $t.data}const kt=new WeakMap;function St(t){let e=kt.get(t);if(e)return e;e={runs:new Map,planned:new Map,mps:new Map};for(const i of t.runs){const t=Date.parse(i.start),s=Date.parse(i.end);if(!Number.isFinite(t)||!Number.isFinite(s))continue;const n=e.runs.get(i.device_id)??[];n.push({run:i,start:t,end:s}),e.runs.set(i.device_id,n)}for(const t of e.runs.values())t.sort((t,e)=>t.start-e.start);for(const i of t.planned){const t=e.planned.get(i.key)??[];t.push(i),e.planned.set(i.key,t)}for(const t of e.planned.values())t.sort((t,e)=>t.start-e.start);for(const i of t.locations)for(const t of new Set(i.assignments.map(t=>t.device_id))){const s=e.mps.get(t)??[];s.push(i),e.mps.set(t,s)}return kt.set(t,e),e}function Et(t,e){return St(t).runs.get(e)??[]}function At(t,e,i){return(St(t).mps.get(e)??[]).find(t=>t.assignments.some(t=>t.device_id===e&&(null===t.begin||t.begin<=i)&&(null===t.end||i<t.end)))}const Mt={planned:0,missed:0,ran:1,unplanned:1,running:1};function Ct(t,e,i,s=9e5){const n=new Set,a=[];for(const r of[...t].sort((t,e)=>t.start-e.start)){let t=null;for(const i of e){if(n.has(i)||i.key!==r.key)continue;const e=Math.abs(i.start-r.start);e<=s&&(!t||e<Math.abs(t.start-r.start))&&(t=i)}t?(n.add(t),a.push({...t,kind:"running"===t.kind?"running":"ran",planStart:r.start,planEnd:r.end,summary:`${t.summary??""}\nplanned ${r.summary??""}`})):r.end+s<i?a.push({...r,kind:"missed"}):a.push(r)}for(const t of e)n.has(t)||a.push("running"===t.kind?t:{...t,kind:"unplanned"});return a}const Lt=864e5,Nt=864e5,zt=/\((\d+)\)\s*$/;function Dt(t){if(!t)return null;const e=Number(t.state);return Number.isFinite(e)&&""!==t.state?e:null}function Ot(t){return!t||"unavailable"===t.state||"unknown"===t.state}function Pt(t){const e=new Date(t);return e.setHours(0,0,0,0),e.getTime()}function Tt(t,e,i){const s=Pt(e)-5184e5,n={runs:0,liters:0,minutes:0,daily:[0,0,0,0,0,0,0],unit:i?"L":"min"};for(const e of t){if(e.start<s)continue;const t=Math.min(6,Math.round((Pt(e.start)-s)/Nt));n.runs+=1,n.liters+=e.liters??0,n.minutes+=e.minutes,n.daily[t]+=i?e.liters??0:e.minutes}return n}function Rt(t,e,i,s){const n=e[t.registry_entity],a=t.switch?e[t.switch]:void 0,r=Ot(n)&&Ot(a),o=!r&&"on"===a?.state,l=Et(i,t.device_id).map(t=>({r:t.run,start:t.start,end:t.end})),d=(t,e)=>({start:e,minutes:(t.duration_seconds??0)/60,liters:"number"==typeof t.liters?t.liters:null}),c=l[l.length-1],p=function(t,e){return St(t).planned.get(e)??[]}(i,t.registry_entity),u=p.find(t=>t.start>s),h=p.filter(t=>t.end>s-Lt&&t.end<s).map(e=>({start:e.start,end:e.end,kind:"planned",name:t.valve_name,key:t.device_id})),m=l.filter(t=>t.end>s-Lt-Nt).map(e=>({start:e.start,end:e.end,kind:"ran",name:t.valve_name,key:t.device_id})),v=Ct(h,m,s).filter(t=>"missed"===t.kind).length,g=!!t.volume_sensor,f=r?null:Dt(t.battery_level?e[t.battery_level]:void 0),x=t.last_report?Date.parse(e[t.last_report]?.state??""):NaN,b=c?d(c.r,c.start):null,_=[];r||(null!==f&&f<20&&_.push("low_battery"),Number.isFinite(x)&&s-x>1296e5&&_.push("stale"),v>0&&_.push("missed"),g&&b&&0===b.liters&&b.minutes>=1&&_.push("no_flow"));const y=i.locationOf[t.device_id]??null,$=y?.site_id?i.sites.find(t=>t.id===y.site_id)??null:null,w=t=>t?.last_changed?Date.parse(t.last_changed):null;return{device_id:t.device_id,name:t.valve_name,number:zt.exec(t.valve_name)?.[1]??null,view_path:t.view_path,status:r?"offline":o?"watering":"idle",since:o?w(a):r?w(n):null,flow_lpm:o?Dt(t.flow_rate_sensor?e[t.flow_rate_sensor]:void 0):null,battery:f,has_flow_meter:g,last:b,next:u?{start:u.start,minutes:(u.end-u.start)/6e4,liters:null}:null,week:Tt(l.map(t=>d(t.r,t.start)),s,g),missed:v,badges:_,location:y?{id:y.id,name:y.name}:null,site:$?{id:$.id,name:$.name}:null}}class Ut{constructor(t){this.valves=[],this.data=yt,this.loaded=!1,this.error=null,this.busy=!1,this.memo=null,this.host=t,t.addController(this)}hostConnected(){this.timer=window.setInterval(()=>{this.refresh()},6e4)}hostDisconnected(){this.timer&&window.clearInterval(this.timer)}hostUpdated(){this.loaded||this.busy||!this.host.hass||this.refresh()}async refresh(t=!1){const e=this.host.hass;if(e&&!this.busy){t&&($t=null),this.busy=!0;try{const[t,i]=await Promise.all([wt(e),vt(e)]);this.valves=function(t,e={}){const i=new Set;for(const e of Object.values(t.entities))e.translation_key===gt&&i.add(e.entity_id);for(const e of Object.keys(t.states))e.startsWith("sensor.")&&(e.endsWith(gt)||e.endsWith("_time_task_registry"))&&i.add(e);const s=[];for(const n of i){const i=t.states[n],a=t.entities[n];if(!i||!a||!a.device_id)continue;const r=i.attributes.device_id??a.device_id,o=bt(t,n,a.device_id,r,i,e);o&&s.push(o)}return s.sort((t,e)=>t.valve_name.localeCompare(e.valve_name)),s}(e,i),this.data=t,this.error=null}catch(t){this.error=t instanceof Error?t.message:String(t)}finally{this.busy=!1,this.loaded=!0,this.host.requestUpdate()}}}summaries(){const t=this.host.hass;if(!t)return[];const e=Date.now(),i=this.memo;if(i&&i.data===this.data&&i.valves===this.valves&&e-i.at<2e3)return i.list;const s=this.valves.map(i=>Rt(i,t.states,this.data,e));return this.memo={at:e,data:this.data,valves:this.valves,list:s},s}summaryOf(t){const e=this.host.hass,i=this.valves.find(e=>e.device_id===t);return e&&i?Rt(i,e.states,this.data,Date.now()):void 0}}const Ht={site:null,status:"all",search:""},It={watering:"Watering now",attention:"Needs attention",sites:"Valves",offline:"Offline",unassigned:"Without location"},Ft=["watering","attention","sites","offline","unassigned"];function jt(t,e){const i=new Set([e]);for(let e=!0;e;){e=!1;for(const s of t)s.parent_id&&i.has(s.parent_id)&&!i.has(s.id)&&(i.add(s.id),e=!0)}return i}function Wt(t,e){const i=new Map(t.map(t=>[t.id,t])),s=[];for(let t=i.get(e);t&&s.length<20;t=t.parent_id?i.get(t.parent_id):void 0)s.unshift(t.name);return s.join(" › ")}function Bt(t){return"offline"!==t.status&&t.badges.length>0}function qt(t,e,i){const s=e.site?jt(i,e.site):null,n=e.search.trim().toLowerCase();return t.filter(t=>(!s||null!==t.site&&s.has(t.site.id))&&("all"===e.status||"watering"===e.status&&"watering"===t.status||"offline"===e.status&&"offline"===t.status||"attention"===e.status&&Bt(t))&&(!n||t.name.toLowerCase().includes(n)||(t.location?.name.toLowerCase().includes(n)??!1)||(t.site?.name.toLowerCase().includes(n)??!1)))}function Vt(t){const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",t.startsWith("/")?t:`/${e}/${t}`),window.dispatchEvent(new Event("location-changed"))}const Gt=r`
  :host {
    --xt-water: var(--blue-color, #1e88e5);
    --xt-dim: var(--secondary-text-color, #727272);
    --xt-ok: var(--success-color, #4caf50);
    --xt-off: var(--disabled-text-color, #bdbdbd);
    --xt-warn: var(--warning-color, #ffa600);
    --xt-bad: var(--error-color, #db4437);
    --xt-track: var(--divider-color, #e0e0e0);
    /* Cards stand out from the page: HA's default edge (divider colour,
       12 % black) nearly vanishes on the light grey background. */
    --xt-card-edge: color-mix(in srgb, var(--primary-text-color, #212121) 14%, transparent);
    --xt-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
    --ha-card-border-color: var(--xt-card-edge);
    --ha-card-box-shadow: var(--xt-card-shadow);
  }
`,Kt=[["all","All"],["watering","Watering"],["attention","Attention"],["offline","Offline"]];class Jt extends dt{constructor(){super(...arguments),this.sites=[],this.value=Ht,this.counts={},this.statuses=!0}_set(t){this.value={...this.value,...t},this.dispatchEvent(new CustomEvent("xt-filter-changed",{detail:this.value,bubbles:!0,composed:!0}))}render(){const t=[...this.sites].map(t=>({id:t.id,path:Wt(this.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path));return B`
      <select
        aria-label="Site"
        .value=${this.value.site??""}
        @change=${t=>this._set({site:t.target.value||null})}
      >
        <option value="">All sites</option>
        ${t.map(t=>B`<option value=${t.id} ?selected=${t.id===this.value.site}>${t.path}</option>`)}
      </select>
      <div class="chips" role="group" aria-label="Status" ?hidden=${!this.statuses}>
        ${Kt.map(([t,e])=>B`<button
            class=${this.value.status===t?"on":""}
            aria-pressed=${this.value.status===t}
            @click=${()=>this._set({status:t})}
          >
            ${e}${void 0!==this.counts[t]?B` <span>${this.counts[t]}</span>`:""}
          </button>`)}
      </div>
      <input
        type="search"
        placeholder="Search valve, metering point, site"
        aria-label="Search"
        .value=${this.value.search}
        @input=${t=>this._set({search:t.target.value})}
      />
    `}}Jt.styles=[Gt,r`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }
    select,
    input,
    button {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--xt-track);
      border-radius: 18px;
      padding: 6px 12px;
      min-height: 36px;
      box-sizing: border-box;
    }
    input {
      flex: 1;
      min-width: 180px;
    }
    .chips[hidden] {
      display: none;
    }
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    button {
      cursor: pointer;
    }
    button.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    button span {
      opacity: 0.75;
      font-variant-numeric: tabular-nums;
    }
  `],t([ht({attribute:!1})],Jt.prototype,"sites",void 0),t([ht({attribute:!1})],Jt.prototype,"value",void 0),t([ht({attribute:!1})],Jt.prototype,"counts",void 0),t([ht({type:Boolean})],Jt.prototype,"statuses",void 0),customElements.get("xt-valve-filter-bar")||customElements.define("xt-valve-filter-bar",Jt);const Yt=864e5;function Xt(t,e=Date.now()){const i=new Date(t),s=new Date(e);s.setHours(0,0,0,0);const n=Math.floor((i.getTime()-s.getTime())/Yt);return 0===n?"Today":-1===n?"Yesterday":1===n?"Tomorrow":i.toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"})}function Zt(t){return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Qt(t){return`${Xt(t)} ${Zt(t)}`}function te(t,e=Date.now()){const i=Math.round((e-t)/6e4);if(i<60)return`${i} min`;const s=Math.round(i/60);return s<48?`${s} h`:`${Math.round(s/24)} d`}function ee(t){return`${Math.round(t).toLocaleString()} L`}function ie(t){return t>=95?"mdi:battery":t<10?"mdi:battery-outline":"mdi:battery-"+10*Math.floor(t/10)}function se(t){return Math.abs(t)<1e3?`${Math.round(t)} L`:`${(t/1e3).toFixed(1)} m³`}class ne extends dt{constructor(){super(...arguments),this.daily=[],this.unit="L"}render(){const t=Math.max(...this.daily,0),e=new Date;e.setHours(12,0,0,0);const i=this.daily.length;return this.daily.map((s,n)=>B`<span
          title="${(t=>new Date(e.getTime()-(i-1-t)*Yt).toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"}))(n)}: ${Math.round(s).toLocaleString()} ${this.unit}"
          style="height:${t>0?Math.max(8,s/t*100):8}%"
          class=${s>0?"on":""}
        ></span>`)}}ne.styles=[Gt,r`
    :host {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 22px;
      width: 70px;
      flex: none;
    }
    span {
      flex: 1;
      border-radius: 2px;
      background: var(--xt-track);
    }
    span.on {
      background: var(--xt-water);
    }
  `],t([ht({attribute:!1})],ne.prototype,"daily",void 0),t([ht()],ne.prototype,"unit",void 0),customElements.get("xt-week-bars")||customElements.define("xt-week-bars",ne);const ae={low_battery:"Low battery",stale:"No report 36 h",missed:"Missed",no_flow:"No water flow"},re={low_battery:"Battery below 20 %",stale:"The valve has not reported for more than 36 hours",missed:"A planned run in the last 24 hours did not happen",no_flow:"The last run measured no water"};function oe(t){const e=[Qt(t.start),`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}function le(t){return(t.number?t.name.replace(/\s*\(\d+\)\s*$/,""):t.name)||t.name}class de extends dt{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:this.summary.view_path,bubbles:!0,composed:!0}))}_status(t){if("watering"===t.status){const e=null!==t.flow_lpm?` · ${t.flow_lpm.toFixed(1)} L/min`:"";return B`<span class="status watering" title="Watering now"><i></i>Watering${t.since?` since ${Zt(t.since)}`:""}${e}</span>`}return"offline"===t.status?B`<span class="status offline" title="Not reachable"><i></i>Offline${t.since?` for ${te(t.since)}`:""}</span>`:B`<span class="status idle" title="Online, not watering"><i></i>Idle</span>`}_week(t){const e=t.week.unit,i="L"===e?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`;return B`<div class="week">
      <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
      <xt-week-bars .daily=${t.week.daily} unit=${e}></xt-week-bars>
      <span class="dim" title="Last 7 days: number of runs and total ${"L"===e?"water":"watering time"}"
        >${t.week.runs} runs · ${i}</span
      >
    </div>`}render(){const t=this.summary;if(!t)return G;const e=t.location&&t.location.name!==le(t)?t.location.name:null,i=t.location?[e,t.site?.name].filter(Boolean).join(" · "):"No location";return B`<ha-card class=${t.status} @click=${this._open} tabindex="0" role="link" aria-label=${t.name}>
      <div class="head">
        <span class="name" title=${t.name}>${le(t)}</span>
        ${t.number?B`<span class="num" title="Valve number">#${t.number}</span>`:G}
        ${null!==t.battery?B`<span class="battery ${t.badges.includes("low_battery")?"low":""}" title="Battery ${Math.round(t.battery)} %"
              ><ha-icon icon=${ie(t.battery)}></ha-icon>${Math.round(t.battery)} %</span
            >`:G}
      </div>
      ${i?B`<div class="place dim" title="Metering point · site">
            <ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${i}</span>
          </div>`:G}
      ${this._status(t)}
      <dl>
        <dt title="Last run"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run: start · duration${t.has_flow_meter?" · water":""}">${t.last?oe(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?oe(t.next):"–"}</dd>
      </dl>
      ${this._week(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>B`<span class="badge ${e}" title=${re[e]}>${ae[e]}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`)}
          </div>`:G}
    </ha-card>`}}de.styles=[Gt,r`
    :host {
      display: block;
    }
    ha-card {
      padding: 12px 14px;
      cursor: pointer;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    ha-card:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    ha-card.offline {
      opacity: 0.7;
    }
    .head {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .name {
      font-size: 1.05rem;
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .num,
    .battery {
      font-variant-numeric: tabular-nums;
      color: var(--xt-dim);
    }
    .battery {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .battery.low ha-icon {
      color: var(--xt-bad);
    }
    .battery.low {
      color: var(--xt-bad);
      font-weight: 600;
    }
    .dim {
      color: var(--xt-dim);
    }
    .place {
      margin-top: -4px;
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .place span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--xt-ok);
    }
    .status.watering {
      font-weight: 500;
    }
    .status.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    .status.offline i {
      background: var(--xt-off);
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 10px;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    dt {
      display: flex;
      align-items: center;
    }
    dd {
      margin: 0;
    }
    .week {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .week ha-icon {
      align-self: center;
      margin-right: -2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .badge {
      font-size: 0.75rem;
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
      color: var(--primary-text-color);
    }
    .badge.missed,
    .badge.no_flow {
      background: color-mix(in srgb, var(--xt-bad) 18%, transparent);
    }
  `],t([ht({attribute:!1})],de.prototype,"summary",void 0),customElements.get("xt-valve-card")||customElements.define("xt-valve-card",de);class ce extends dt{constructor(){super(...arguments),this.collapsed=!1}render(){const t=this.section;return t?B`
      <button class="title" @click=${()=>this.collapsed=!this.collapsed} aria-expanded=${!this.collapsed}>
        <span>${t.title}</span><span class="count">${t.count}</span>
        <ha-icon icon=${this.collapsed?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
      </button>
      ${this.collapsed?G:t.groups.map(t=>B`
              ${t.title?B`<div class="group">${t.title} <span class="count">${t.valves.length}</span></div>`:G}
              <div class="grid">${t.valves.map(t=>B`<xt-valve-card .summary=${t}></xt-valve-card>`)}</div>
            `)}
    `:G}}ce.styles=[Gt,r`
    :host {
      display: block;
      margin-bottom: 20px;
    }
    .title {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      cursor: pointer;
      font-size: 1.2rem;
      font-weight: 500;
      padding: 4px 0 10px;
      color: var(--primary-text-color);
    }
    .title ha-icon {
      margin-left: auto;
      color: var(--xt-dim);
    }
    .count {
      color: var(--xt-dim);
      font-weight: 400;
      font-size: 0.9em;
    }
    .group {
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-color);
      margin: 12px 0 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
  `],t([ht({attribute:!1})],ce.prototype,"section",void 0),t([ht({type:Boolean,reflect:!0})],ce.prototype,"collapsed",void 0),customElements.get("xt-valve-section")||customElements.define("xt-valve-section",ce);const pe="xt-valves-filter";class ue extends dt{constructor(){super(...arguments),this._filter=function(){try{return{...Ht,...JSON.parse(localStorage.getItem(pe)??"{}")}}catch{return Ht}}(),this._farm=new Ut(this)}setConfig(t){this._config=t}getCardSize(){return 12}_onFilter(t){this._filter=t.detail,function(t){try{localStorage.setItem(pe,JSON.stringify(t))}catch{}}(t.detail)}_onOpen(t){Vt(t.detail)}render(){if(!this._config||!this.hass)return G;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading valves…</div></ha-card>`;const t=this._farm.summaries(),e=this._farm.data,i=this._config.site??null,s={...this._filter,site:i??this._filter.site},n=qt(t,{...s,status:"all"},e.sites),a={};for(const t of["all","watering","attention","offline"])a[t]="all"===t?n.length:qt(n,{...Ht,status:t},e.sites).length;const r=function(t,e,i=Ft){const s=(t,e)=>t.name.localeCompare(e.name),n=(t,e)=>({key:t,title:It[t],groups:[{site:null,title:"",valves:[...e].sort(s)}],count:e.length}),a=t.filter(t=>"offline"!==t.status),r=a.filter(t=>t.location),o=new Map;for(const t of r){const e=t.site?.id??null;o.set(e,[...o.get(e)??[],t])}const l=[...o.entries()].map(([t,i])=>({site:t,title:t?Wt(e,t):"No site",valves:i.sort(s)})).sort((t,e)=>null===t.site?1:null===e.site?-1:t.title.localeCompare(e.title)),d={watering:n("watering",a.filter(t=>"watering"===t.status)),attention:n("attention",a.filter(Bt)),sites:{key:"sites",title:It.sites,groups:l,count:r.length},offline:n("offline",t.filter(t=>"offline"===t.status)),unassigned:n("unassigned",a.filter(t=>!t.location))};return i.map(t=>d[t]).filter(t=>t.count>0)}(qt(n,{...Ht,status:s.status},e.sites),e.sites,this._config.sections??Ft),o=new Set(this._config.collapsed??["offline"]);return B`
      <div @xt-valve-open=${this._onOpen}>
        ${!1===this._config.filter?G:B`<xt-valve-filter-bar
              .sites=${i?[]:e.sites}
              .value=${s}
              .counts=${a}
              @xt-filter-changed=${this._onFilter}
            ></xt-valve-filter-bar>`}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:G}
        ${r.length?r.map(t=>B`<xt-valve-section .section=${t} ?collapsed=${o.has(t.key)}></xt-valve-section>`):B`<div class="msg">No valves match the filter.</div>`}
      </div>
    `}}ue.styles=r`
    :host {
      display: block;
    }
    .msg {
      padding: 16px;
      color: var(--secondary-text-color);
    }
    .err {
      color: var(--error-color, #db4437);
    }
  `,t([ht({attribute:!1})],ue.prototype,"hass",void 0),t([mt()],ue.prototype,"_config",void 0),t([mt()],ue.prototype,"_filter",void 0),customElements.get("irrigation-valves-card")||customElements.define("irrigation-valves-card",ue);const he="__no_site__";function me(t,e){return t.filter(t=>t.parent_id===e).sort((t,e)=>t.name.localeCompare(e.name))}function ve(t,e,i){const s=t===he,n=s?null:e.sites.find(e=>e.id===t)??null,a=s?null:jt(e.sites,t),r=i.filter(t=>a?!!t.site_id&&a.has(t.site_id):!t.site_id),o=r.flatMap(t=>t.valves),l=[0,0,0,0,0,0,0];let d=0,c=0;for(const t of r)d+=t.week.runs,c+=t.week.liters,"L"===t.week.unit&&t.week.daily.forEach((t,e)=>l[e]+=t);const p=r.map(t=>t.last?.start).filter(t=>"number"==typeof t),u=r.map(t=>t.next?.start).filter(t=>"number"==typeof t),h=s?null:function(t,e){const i=new Map(t.sites.map(t=>[t.id,t]));for(let s=i.get(e),n=0;s&&n<20;s=s.parent_id?i.get(s.parent_id):void 0,n++){const i=t.pumpAssignments.find(t=>"site"===t.target_kind&&t.target_id===s.id&&null===t.end),n=i&&t.pumps.find(t=>t.id===i.pump_id);if(n)return{pump:n,via:s.id===e?null:s.name}}return null}(e,t);return{id:t,name:n?.name??"No site",path:n?Wt(e.sites,n.id):"No site",parent_id:n?.parent_id??null,children:s?[]:me(e.sites,t).map(t=>t.id),mps:r.length,valves:o.length,online:o.filter(t=>"offline"!==t.status).length,watering:o.filter(t=>"watering"===t.status).length,attention:r.filter(t=>"offline"!==t.status&&t.badges.length>0).length,offline:o.filter(t=>"offline"===t.status).length,last:p.length?Math.max(...p):null,next:u.length?Math.min(...u):null,week:{runs:d,liters:c,daily:l},pump:h?{name:h.pump.name,via:h.via}:null}}function ge(t,e,i,s){const n=t.valves.map(t=>i.find(e=>e.device_id===t)).filter(t=>!!t),a=function(t,e){const i=[];for(const s of t.assignments)for(const t of Et(e,s.device_id))if((null===s.begin||s.begin<=t.end)&&(null===s.end||t.end<s.end)){const e=t.run;i.push({start:t.start,minutes:(e.duration_seconds??0)/60,liters:"number"==typeof e.liters?e.liters:null})}return i.sort((t,e)=>t.start-e.start)}(t,e),r=n.some(t=>t.has_flow_meter)||a.some(t=>null!==t.liters&&t.liters>0),o=a.filter(t=>t.start>=s-2592e6&&null!==t.liters&&t.minutes>=1),l=o.reduce((t,e)=>t+e.minutes,0),d=r&&l>0?o.reduce((t,e)=>t+(e.liters??0),0)/l:null,c=n.length?n.some(t=>"watering"===t.status)?"watering":n.every(t=>"offline"===t.status)?"offline":"idle":"empty",p=n.map(t=>t.next).filter(t=>!!t),u=a[a.length-1]??null,h=n.reduce((t,e)=>t+e.missed,0),m=[];t.valves.length||m.push("no_valve");for(const t of["low_battery","stale"])n.some(e=>e.badges.includes(t))&&m.push(t);if(h>0&&m.push("missed"),r&&u&&0===u.liters&&u.minutes>=1&&m.push("no_flow"),null!==d&&t.expected_lpm){const e=(d-t.expected_lpm)/t.expected_lpm;e<-.25?m.push("flow_low"):e>.25&&m.push("flow_high")}return{id:t.id,name:t.name,site_id:t.site_id,valves:n.map(t=>({device_id:t.device_id,number:t.number,name:t.name,status:t.status,battery:t.battery,view_path:t.view_path})),status:c,last:u,next:p.length?p.reduce((t,e)=>e.start<t.start?e:t):null,week:Tt(a,s,r),avg_lpm:d,expected_lpm:t.expected_lpm,pump:t.pump,missed:h,badges:m}}class fe extends dt{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-site-open",{detail:this.summary.id,bubbles:!0,composed:!0}))}render(){const t=this.summary;if(!t)return G;const e=t.watering?B`<span class="status watering" title="Valves watering now"><i></i>${t.watering} watering</span>`:B`<span class="status" title="Valves online / valves in this site"><i></i>${t.online} / ${t.valves} online</span>`;return B`<ha-card @click=${this._open} tabindex="0" role="link" aria-label=${t.path}>
      <div class="head">
        <span class="name" title=${t.path}>${t.name}</span>
        ${t.children.length?B`<span class="dim" title="Sub-sites"><ha-icon icon="mdi:file-tree-outline"></ha-icon>${t.children.length}</span>`:G}
        <span class="dim" title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${t.mps}</span>
      </div>
      ${t.pump?B`<div class="row dim" title="Pump${t.pump.via?`, inherited from ${t.pump.via}`:""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>
          </div>`:G}
      ${e}
      <dl>
        <dt title="Last run in this site"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run in this site">${t.last?Qt(t.last):"–"}</dd>
        <dt title="Next planned run in this site"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run in this site">${t.next?Qt(t.next):"–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${t.week.daily}></xt-week-bars>
        <span class="dim" title="Last 7 days: runs and water of all valves in this site"
          >${t.week.runs} runs · ${ee(t.week.liters)}</span
        >
      </div>
      ${t.attention||t.offline?B`<div class="badges">
            ${t.attention?B`<span class="badge warn" title="Metering points with a warning (battery, no report, missed run, no water, flow)"
                  >${t.attention} need attention</span
                >`:G}
            ${t.offline?B`<span class="badge" title="Valves not reachable">${t.offline} offline</span>`:G}
          </div>`:G}
    </ha-card>`}}fe.styles=[Gt,r`
    :host {
      display: block;
    }
    ha-card {
      padding: 12px 14px;
      cursor: pointer;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    ha-card:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .head .dim {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-variant-numeric: tabular-nums;
    }
    .name {
      font-size: 1.05rem;
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--xt-dim);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: -4px;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--xt-ok);
    }
    .status.watering {
      font-weight: 500;
    }
    .status.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 10px;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    dt {
      display: flex;
      align-items: center;
    }
    dd {
      margin: 0;
    }
    .week {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .week ha-icon {
      align-self: center;
      margin-right: -2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .badge {
      font-size: 0.75rem;
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--xt-off) 30%, transparent);
    }
    .badge.warn {
      background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
    }
  `],t([ht({attribute:!1})],fe.prototype,"summary",void 0),customElements.get("xt-site-card")||customElements.define("xt-site-card",fe);class xe extends dt{constructor(){super(...arguments),this.sites=[],this.selected=null,this.counts={},this.noSite=!1,this._closed=new Set}_open(t){this.dispatchEvent(new CustomEvent("xt-site-open",{detail:t,bubbles:!0,composed:!0}))}_toggle(t,e){t.stopPropagation();const i=new Set(this._closed);i.has(e)?i.delete(e):i.add(e),this._closed=i}_node(t,e){const i=me(this.sites,t.id),s=this._closed.has(t.id);return B`
      <button
        class="node ${t.id===this.selected?"on":""}"
        style="padding-left:${8+16*e}px"
        @click=${()=>this._open(t.id)}
        aria-current=${t.id===this.selected?"page":"false"}
      >
        ${i.length?B`<ha-icon
              class="chev"
              icon=${s?"mdi:chevron-right":"mdi:chevron-down"}
              @click=${e=>this._toggle(e,t.id)}
            ></ha-icon>`:B`<span class="chev"></span>`}
        <span class="label">${t.name}</span>
        <span class="count">${this.counts[t.id]??""}</span>
      </button>
      ${s?G:i.map(t=>this._node(t,e+1))}
    `}render(){return B`
      <button class="node all ${null===this.selected?"on":""}" @click=${()=>this._open(null)}>
        <ha-icon class="chev" icon="mdi:sprout-outline"></ha-icon><span class="label">All sites</span>
      </button>
      ${me(this.sites,null).map(t=>this._node(t,0))}
      ${this.noSite?B`<button class="node ${this.selected===he?"on":""}" @click=${()=>this._open(he)}>
            <span class="chev"></span><span class="label dim">No site</span>
            <span class="count">${this.counts[he]??""}</span>
          </button>`:G}
    `}}xe.styles=[Gt,r`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .node {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      color: var(--primary-text-color);
      font-size: 0.95rem;
    }
    .node:hover {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .node.on {
      background: color-mix(in srgb, var(--primary-color) 16%, transparent);
      font-weight: 500;
    }
    .node:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    .all {
      margin-bottom: 4px;
    }
    .chev {
      --mdc-icon-size: 18px;
      width: 18px;
      flex: none;
      color: var(--xt-dim);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--xt-dim);
    }
    .count {
      color: var(--xt-dim);
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
    }
  `],t([ht({attribute:!1})],xe.prototype,"sites",void 0),t([ht({attribute:!1})],xe.prototype,"selected",void 0),t([ht({attribute:!1})],xe.prototype,"counts",void 0),t([ht({type:Boolean})],xe.prototype,"noSite",void 0),t([mt()],xe.prototype,"_closed",void 0),customElements.get("xt-site-tree")||customElements.define("xt-site-tree",xe);const be={no_valve:["No valve","No valve is assigned to this metering point","warn"],low_battery:["Low battery","The valve's battery is below 20 %","warn"],stale:["No report 36 h","The valve has not reported for more than 36 hours","warn"],missed:["Missed","A planned run in the last 24 hours did not happen","bad"],no_flow:["No water flow","The last run here measured no water","bad"],flow_low:["Flow low","Mean flow of the last 30 days is well below the expected L/min","bad"],flow_high:["Flow high","Mean flow of the last 30 days is well above the expected L/min (leak?)","bad"]},_e={watering:"Watering",idle:"Idle",offline:"Offline"};function ye(t){const e=[Qt(t.start),`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}class $e extends dt{constructor(){super(...arguments),this.editable=!1}_openValve(t,e){t.stopPropagation(),this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:e.view_path,bubbles:!0,composed:!0}))}_valve(t){return B`<button class="valve ${t.status}" @click=${e=>this._openValve(e,t)} title="Open valve ${t.name}">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${t.number?`#${t.number}`:t.name}</span>
      <i></i><span>${_e[t.status]}</span>
      ${null!==t.battery?B`<span class="battery" title="Battery ${Math.round(t.battery)} %"
            ><ha-icon icon=${ie(t.battery)}></ha-icon>${Math.round(t.battery)} %</span
          >`:G}
    </button>`}_flow(t){if(null===t.avg_lpm)return G;const e=t.expected_lpm?` · expected ${t.expected_lpm}`:"";return B`<div class="row" title="Mean flow of the last 30 days' runs${t.expected_lpm?" vs. the expected L/min":""}">
      <ha-icon icon="mdi:speedometer"></ha-icon><span>${t.avg_lpm.toFixed(1)} L/min${e}</span>
    </div>`}render(){const t=this.summary;if(!t)return G;const e=t.week.unit,i="L"===e?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`;return B`<ha-card class=${t.status}>
      <div class="head">
        <span class="name" title="Metering point">${t.name}</span>
        ${this.editable?B`<button
              class="edit"
              aria-label="Edit ${t.name}"
              title="Edit metering point"
              @click=${()=>this.dispatchEvent(new CustomEvent("xt-mp-edit",{detail:t.id,bubbles:!0,composed:!0}))}
            >
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>`:G}
      </div>
      ${t.valves.length?t.valves.map(t=>this._valve(t)):B`<div class="row dim">No valve assigned</div>`}
      ${t.pump?B`<div class="row" title="Pump${t.pump.via?`, inherited from ${t.pump.via}`:""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>
          </div>`:G}
      <dl>
        <dt title="Last run here"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run here: start · duration · water">${t.last?ye(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?ye(t.next):"–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${t.week.daily} unit=${e}></xt-week-bars>
        <span class="dim" title="Last 7 days here, across valve exchanges">${t.week.runs} runs · ${i}</span>
      </div>
      ${this._flow(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>{const[i,s,n]=be[e];return B`<span class="badge ${n}" title=${s}>${i}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`})}
          </div>`:G}
    </ha-card>`}}$e.styles=[Gt,r`
    :host {
      display: block;
    }
    ha-card {
      padding: 12px 14px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    ha-card.empty {
      border-style: dashed;
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 26px;
    }
    .edit {
      all: unset;
      cursor: pointer;
      border-radius: 50%;
      padding: 4px;
      margin: -4px -6px -4px auto;
      display: flex;
    }
    .edit:hover,
    .edit:focus-visible {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }
    .edit ha-icon {
      --mdc-icon-size: 18px;
      color: var(--primary-color);
    }
    .name {
      flex: 1;
      min-width: 0;
      font-size: 1.05rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--xt-dim);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .valve {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border-radius: 8px;
      padding: 2px 6px;
      margin: 0 -6px;
    }
    .valve:hover,
    .valve:focus-visible {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .valve .num {
      color: var(--primary-color);
      font-variant-numeric: tabular-nums;
    }
    .valve i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--xt-ok);
      margin-left: 4px;
    }
    .valve.watering {
      font-weight: 500;
    }
    .valve.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    .valve.offline i {
      background: var(--xt-off);
    }
    .battery {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--xt-dim);
      font-variant-numeric: tabular-nums;
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 10px;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    dt {
      display: flex;
      align-items: center;
    }
    dd {
      margin: 0;
    }
    .week {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .week ha-icon {
      align-self: center;
      margin-right: -2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .badge {
      font-size: 0.75rem;
      padding: 1px 8px;
      border-radius: 10px;
    }
    .badge.warn {
      background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
    }
    .badge.bad {
      background: color-mix(in srgb, var(--xt-bad) 18%, transparent);
    }
  `],t([ht({attribute:!1})],$e.prototype,"summary",void 0),t([ht({type:Boolean})],$e.prototype,"editable",void 0),customElements.get("xt-mp-card")||customElements.define("xt-mp-card",$e);const we={watering:"Watering",idle:"Idle",offline:"Offline"};function ke(t){return new Date(t).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}class Se extends dt{constructor(){super(...arguments),this.sites=[],this.valves=[],this.busy=!1,this.error=null}_fire(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_save(t){t.preventDefault();const e=t.target,i=t=>e.elements.namedItem(t).value,s=i("expected_lpm").trim();this._fire("xt-mp-save",{name:i("name"),description:i("description"),expected_lpm:""===s?null:Number(s),site_id:i("site_id")||null})}_valveLine(t,e){return B`<div class="valve">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${t?.label??e}</span>
      ${t?B`<i class=${t.status}></i><span>${we[t.status]}</span>`:G}
      ${null!=t?.battery?B`<span class="dim"><ha-icon icon=${ie(t.battery)}></ha-icon>${Math.round(t.battery)} %</span>`:G}
      <button type="button" class="link danger" ?disabled=${this.busy} @click=${()=>this._fire("xt-mp-unassign",e)}>
        Remove
      </button>
    </div>`}render(){const t=this.mp;if(!t)return G;const e=new Map(this.valves.map(t=>[t.device_id,t])),i=this.valves.filter(e=>!t.valves.includes(e.device_id)).sort((t,e)=>Number(!!t.at)-Number(!!e.at)||t.label.localeCompare(e.label,void 0,{numeric:!0})),s=[...t.assignments].sort((t,e)=>(e.begin??0)-(t.begin??0));return B`
      <div class="backdrop" @click=${()=>this._fire("xt-close")}></div>
      <aside role="dialog" aria-label="Edit ${t.name}">
        <header>
          <h2>${t.name}</h2>
          <button type="button" class="icon" aria-label="Close" @click=${()=>this._fire("xt-close")}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </header>

        <form @submit=${this._save}>
          <label>Name <input name="name" .value=${t.name} required /></label>
          <label
            >Site
            <select name="site_id">
              <option value="" ?selected=${!t.site_id}>— no site —</option>
              ${this.sites.map(e=>B`<option value=${e.id} ?selected=${e.id===t.site_id}>${e.path}</option>`)}
            </select>
          </label>
          <label
            >Expected L/min
            <input name="expected_lpm" type="number" min="0" step="0.1" .value=${t.expected_lpm?.toString()??""} />
          </label>
          <label>Description <textarea name="description" rows="2" .value=${t.description}></textarea></label>
          <button type="submit" class="primary" ?disabled=${this.busy}>Save</button>
        </form>

        <section>
          <h3>Valve</h3>
          ${t.valves.length?t.valves.map(t=>this._valveLine(e.get(t),t)):B`<div class="dim">No valve assigned.</div>`}
          <label
            >${t.valves.length?"Exchange for":"Assign"}
            <select
              ?disabled=${this.busy}
              @change=${t=>{const e=t.target;e.value&&this._fire("xt-mp-assign",e.value),e.value=""}}
            >
              <option value="">Choose a valve…</option>
              ${i.map(t=>B`<option value=${t.device_id}>${t.label}${t.at?` — now at ${t.at}`:" — free"}${"offline"===t.status?" (offline)":""}</option>`)}
            </select>
          </label>
          <p class="hint dim">
            ${t.valves.length>1?"Both current valves' assignments end now (one valve per metering point).":t.valves.length?"The current valve's assignment ends now.":"The valve leaves the metering point it is at now."}
            This metering point keeps its whole history.
          </p>
        </section>

        ${s.length?B`<section>
              <h3>Valve history</h3>
              <ul>
                ${s.map(t=>B`<li>
                    <span class="num">${e.get(t.device_id)?.label??t.device_id}</span>
                    <span class="dim"
                      >${t.begin?ke(t.begin):"from the start"} – ${t.end?ke(t.end):"now"}</span
                    >
                  </li>`)}
              </ul>
            </section>`:G}
        ${this.error?B`<div class="error">${this.error}</div>`:G}
      </aside>
    `}}Se.styles=[Gt,r`
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 8;
      }
      aside {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(420px, 100vw);
        z-index: 9;
        overflow: auto;
        box-sizing: border-box;
        padding: 16px 20px 24px;
        background: var(--card-background-color, #fff);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-size: 0.95rem;
      }
      @media (max-width: 620px) {
        aside {
          top: auto;
          max-height: 85vh;
          border-radius: 16px 16px 0 0;
        }
      }
      header {
        display: flex;
        align-items: center;
      }
      h2 {
        flex: 1;
        margin: 0;
        font-size: 1.3rem;
        font-weight: 500;
      }
      h3 {
        margin: 0 0 8px;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-color);
      }
      form,
      section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--xt-dim);
      }
      input,
      select,
      textarea,
      button {
        font: inherit;
        color: var(--primary-text-color);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        padding: 6px 10px;
        min-height: 36px;
        box-sizing: border-box;
      }
      button {
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .primary {
        align-self: flex-start;
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
        padding: 6px 20px;
      }
      .icon,
      .link {
        border: none;
        background: none;
        min-height: 0;
        padding: 4px;
      }
      .link.danger {
        color: var(--xt-bad);
        margin-left: auto;
      }
      ha-icon {
        --mdc-icon-size: 18px;
        color: var(--xt-dim);
      }
      .valve {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .valve i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--xt-ok);
        margin-left: 4px;
      }
      .valve i.watering {
        background: var(--xt-water);
      }
      .valve i.offline {
        background: var(--xt-off);
      }
      .valve .dim {
        display: inline-flex;
        align-items: center;
      }
      .num {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }
      .dim {
        color: var(--xt-dim);
      }
      .hint {
        margin: 0;
        font-size: 0.8rem;
      }
      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .error {
        color: var(--xt-bad);
      }
    `],t([ht({attribute:!1})],Se.prototype,"mp",void 0),t([ht({attribute:!1})],Se.prototype,"sites",void 0),t([ht({attribute:!1})],Se.prototype,"valves",void 0),t([ht({type:Boolean})],Se.prototype,"busy",void 0),t([ht()],Se.prototype,"error",void 0),customElements.get("xt-mp-editor")||customElements.define("xt-mp-editor",Se);const Ee=r`
    :host {
      display: block;
    }
    .layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 8px;
      max-height: calc(100vh - 80px);
      overflow: auto;
    }
    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
      aside {
        display: none;
      }
    }
    ha-icon {
      --mdc-icon-size: 18px;
      color: var(--xt-dim);
    }
    .crumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.9rem;
      color: var(--xt-dim);
      min-height: 1.2em;
    }
    .crumbs a {
      color: var(--primary-color);
      text-decoration: none;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h2 {
      margin: 2px 0 8px;
      font-size: 1.6rem;
      font-weight: 400;
      flex: 1;
    }
    h3 {
      font-size: 1.2rem;
      font-weight: 500;
      margin: 24px 0 10px;
    }
    .count {
      color: var(--xt-dim);
      font-weight: 400;
      font-size: 0.9em;
    }
    .figures {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      align-items: center;
      font-variant-numeric: tabular-nums;
    }
    .figures span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .figures .water i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--xt-water);
    }
    .figures .warn {
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
    .editor {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: flex-end;
      margin: 12px 0;
      padding: 12px;
      border: 1px dashed var(--divider-color, #e0e0e0);
      border-radius: 12px;
    }
    .editor label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--xt-dim);
    }
    input,
    select,
    button {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px 10px;
      min-height: 34px;
      box-sizing: border-box;
    }
    button {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    button[type="submit"],
    .edit.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .edit.on ha-icon {
      color: inherit;
    }
    .danger:not(:disabled) {
      color: var(--xt-bad);
    }
    .msg {
      padding: 12px 0;
      color: var(--xt-dim);
    }
    .err {
      color: var(--xt-bad);
    }
`,Ae="xtend_tuya/irrigation_locations";function Me(){return new URLSearchParams(window.location.search).get("site")}class Ce extends dt{constructor(){super(...arguments),this._selected=Me(),this._edit=!1,this._editing=null,this._busy=!1,this._error=null,this._farm=new Ut(this),this._mpMemo=null,this._onLocation=()=>{this._selected=Me()}}setConfig(t){}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),window.addEventListener("location-changed",this._onLocation),window.addEventListener("popstate",this._onLocation)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocation),window.removeEventListener("popstate",this._onLocation)}_open(t){const e=new URL(window.location.href);t?e.searchParams.set("site",t):e.searchParams.delete("site"),window.history.pushState(null,"",e.pathname+e.search),this._selected=t,this._error=null}async _post(t){if(!this.hass?.callApi)return!1;this._busy=!0,this._error=null;try{return await this.hass.callApi("POST",Ae,t),await this._farm.refresh(!0),!0}catch(t){const e=t;return this._error=e.body?.error??e.message??String(t),!1}finally{this._busy=!1}}async _createSite(t,e){const i=t.querySelector("input");i.value.trim()&&await this._post({action:"create_site",name:i.value,parent_id:e})&&(i.value="")}async _saveSite(t,e){const i=t.querySelector("input").value,s=t.querySelector("select").value||null;await this._post({action:"update_site",id:e.id,name:i,parent_id:s})}async _deleteSite(t){await this._post({action:"delete_site",id:t.id})&&this._open(t.parent_id)}_header(t,e){const i=[{id:null,name:"All sites"}];if(t&&t.id!==he){const e=new Map(this._farm.data.sites.map(t=>[t.id,t])),s=[];for(let i=e.get(t.id);i&&s.length<20;i=i.parent_id?e.get(i.parent_id):void 0)s.unshift(i);i.push(...s.map(t=>({id:t.id,name:t.name})))}else t&&i.push({id:he,name:"No site"});const s=i[i.length-1].name;return B`<div class="header">
      <nav class="crumbs" aria-label="Site path">
        ${i.slice(0,-1).map(t=>B`<a href="#" @click=${e=>(e.preventDefault(),this._open(t.id))}>${t.name}</a><span>›</span>`)}
      </nav>
      <div class="title-row">
        <h2>${s}</h2>
        ${this.hass?.user?.is_admin?B`<button class="edit ${this._edit?"on":""}" @click=${()=>this._edit=!this._edit}>
              <ha-icon icon=${this._edit?"mdi:check":"mdi:pencil-outline"}></ha-icon>${this._edit?"Done":"Edit"}
            </button>`:G}
      </div>
      <div class="figures">
        ${t?B`
              <span title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${t.mps} metering points</span>
              <span title="Valves online / valves"><ha-icon icon="mdi:valve"></ha-icon>${t.online} / ${t.valves} online</span>
              ${t.watering?B`<span class="water" title="Valves watering now"><i></i>${t.watering} watering</span>`:G}
              ${t.attention?B`<span class="warn" title="Metering points with a warning">${t.attention} need attention</span>`:G}
              <span title="Last 7 days"
                ><xt-week-bars .daily=${t.week.daily}></xt-week-bars>${t.week.runs} runs · ${ee(t.week.liters)}</span
              >
              ${t.pump?B`<span title="Pump"><ha-icon icon="mdi:pump"></ha-icon>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>`:G}
            `:B`
              <span><ha-icon icon="mdi:sprout-outline"></ha-icon>${e.sites} sites</span>
              <span><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${e.mps} metering points</span>
              <span><ha-icon icon="mdi:valve"></ha-icon>${e.online} / ${e.valves} online</span>
            `}
      </div>
    </div>`}_editSite(t){const e=this._farm.data.sites,i=jt(e,t.id),s=e.filter(t=>!i.has(t.id)).map(t=>({id:t.id,path:Wt(e,t.id)})).sort((t,e)=>t.path.localeCompare(e.path)),n=!e.some(e=>e.parent_id===t.id)&&!this._farm.data.locations.some(e=>e.site_id===t.id);return B`<form class="editor" @submit=${e=>(e.preventDefault(),this._saveSite(e.target,t))}>
      <label>Name <input .value=${t.name} required /></label>
      <label
        >Part of
        <select>
          <option value="" ?selected=${!t.parent_id}>— top level —</option>
          ${s.map(e=>B`<option value=${e.id} ?selected=${e.id===t.parent_id}>${e.path}</option>`)}
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Save</button>
      <button
        type="button"
        class="danger"
        ?disabled=${this._busy||!n}
        title=${n?"Delete this site":"Only an empty site can be deleted"}
        @click=${()=>this._deleteSite(t)}
      >
        Delete
      </button>
    </form>`}_addSite(t){return B`<form class="editor" @submit=${e=>(e.preventDefault(),this._createSite(e.target,t))}>
      <label>${t?"New sub-site":"New site"} <input placeholder="Name" /></label>
      <button type="submit" ?disabled=${this._busy}>Add</button>
    </form>`}async _saveMp(t,e){await this._post({action:"update_location",id:t.id,name:e.name,description:e.description,expected_lpm:e.expected_lpm})&&e.site_id!==t.site_id&&await this._post({action:"set_location_site",location_id:t.id,site_id:e.site_id})}async _createMp(t,e){const i=t.querySelector("input");if(i.value.trim()&&this.hass?.callApi){this._busy=!0,this._error=null;try{const t=await this.hass.callApi("POST",Ae,{action:"create_location",name:i.value});e&&await this.hass.callApi("POST",Ae,{action:"set_location_site",location_id:t.location.id,site_id:e}),i.value="",await this._farm.refresh(!0),this._editing=t.location.id}catch(t){const e=t;this._error=e.body?.error??e.message??String(t)}finally{this._busy=!1}}}_editor(t,e){const i=this._farm.data,s=i.sites.map(t=>({id:t.id,path:Wt(i.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path)),n=e.map(t=>({device_id:t.device_id,label:t.number?`#${t.number}`:t.name,status:t.status,battery:t.battery,at:i.locationOf[t.device_id]?.name??null}));return B`<xt-mp-editor
      .mp=${t}
      .sites=${s}
      .valves=${n}
      ?busy=${this._busy}
      .error=${this._error}
      @xt-close=${()=>this._editing=null}
      @xt-mp-save=${e=>this._saveMp(t,e.detail)}
      @xt-mp-assign=${e=>this._post({action:"assign_device",device_id:e.detail,location_id:t.id})}
      @xt-mp-unassign=${e=>this._post({action:"end_assignment",device_id:e.detail,location_id:t.id})}
    ></xt-mp-editor>`}_addMp(t){return B`<form class="editor" @submit=${e=>(e.preventDefault(),this._createMp(e.target,t))}>
      <label>New metering point <input placeholder="Name" /></label>
      <button type="submit" ?disabled=${this._busy}>Add</button>
    </form>`}render(){if(!this.hass)return G;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading sites…</div></ha-card>`;const t=this._farm.data,e=this._farm.summaries();if(this._mpMemo?.valves!==e){const i=Date.now();this._mpMemo={valves:e,list:t.locations.map(s=>ge(s,t,e,i))}}const i=this._mpMemo.list,s=new Map(i.map(t=>[t.id,t])),n=t.locations.some(t=>!t.site_id),a=this._selected&&(this._selected===he||t.sites.some(t=>t.id===this._selected))?this._selected:null,r=a&&a!==he?t.sites.find(t=>t.id===a)??null:null,o=a?ve(a,t,i):null,l=a?o.children:[...me(t.sites,null).map(t=>t.id),...n?[he]:[]],d=l.map(e=>ve(e,t,i)),c=a?t.locations.filter(t=>a===he?!t.site_id:t.site_id===a).sort((t,e)=>t.name.localeCompare(e.name)):[],p={};for(const e of t.sites)p[e.id]=t.locations.filter(i=>jt(t.sites,e.id).has(i.site_id??"")).length;p[he]=t.locations.filter(t=>!t.site_id).length;const u=i.flatMap(t=>t.valves),h={sites:t.sites.length,mps:t.locations.length,valves:u.length,online:u.filter(t=>"offline"!==t.status).length},m=this._editing?t.locations.find(t=>t.id===this._editing):void 0;return B`<div
      class="layout"
      @xt-site-open=${t=>this._open(t.detail)}
      @xt-valve-open=${t=>Vt(t.detail)}
      @xt-mp-edit=${t=>(this._editing=t.detail,this._error=null)}
    >
      <aside>
        <xt-site-tree .sites=${t.sites} .selected=${a} .counts=${p} ?noSite=${n}></xt-site-tree>
      </aside>
      <main>
        ${this._header(o,h)}
        ${this._error&&!m?B`<div class="msg err">${this._error}</div>`:G}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:G}
        ${this._edit&&r?this._editSite(r):G}
        ${d.length||this._edit&&a!==he?B`<h3>${a?"Sub-sites":"Sites"} <span class="count">${d.length}</span></h3>
              <div class="grid">${d.map(t=>B`<xt-site-card .summary=${t}></xt-site-card>`)}</div>
              ${this._edit&&a!==he?this._addSite(a):G}`:G}
        ${c.length||this._edit&&a?B`<h3>Metering points <span class="count">${c.length}</span></h3>
              <div class="grid">
                ${c.map(t=>B`<xt-mp-card .summary=${s.get(t.id)} ?editable=${this._edit}></xt-mp-card>`)}
              </div>
              ${this._edit&&a?this._addMp(a===he?null:a):G}`:G}
        ${a||t.sites.length?G:B`<div class="msg">No sites yet. Sites are created from the Tuya rooms once the valves report them, or by hand in Edit.</div>`}
      </main>
      ${m?this._editor(m,e):G}
    </div>`}}Ce.styles=[Gt,Ee],t([ht({attribute:!1})],Ce.prototype,"hass",void 0),t([mt()],Ce.prototype,"_selected",void 0),t([mt()],Ce.prototype,"_edit",void 0),t([mt()],Ce.prototype,"_editing",void 0),t([mt()],Ce.prototype,"_busy",void 0),t([mt()],Ce.prototype,"_error",void 0),customElements.get("irrigation-sites-card")||customElements.define("irrigation-sites-card",Ce);const Le=1e3;function Ne(t,e){return(null===t.begin||t.begin<=e)&&(null===t.end||e<t.end)}function ze(t,e,i){const s=(e,s)=>t.pumpAssignments.find(t=>t.target_kind===e&&t.target_id===s&&Ne(t,i))?.pump_id??null,n=s("location",e.id);if(n)return n;const a=new Map(t.sites.map(t=>[t.id,t]));for(let t=e.site_id?a.get(e.site_id):void 0,i=0;t&&i<20;i++){const e=s("site",t.id);if(e)return e;t=t.parent_id?a.get(t.parent_id):void 0}return null}function De(t,e,i){const s=t.pumpAssignments.filter(t=>t.pump_id===e&&"site"===t.target_kind&&Ne(t,i)).map(t=>t.target_id),n=[],a=[],r=e=>{const i=new Map(t.sites.map(t=>[t.id,t]));for(let t=e.site_id?i.get(e.site_id):void 0,n=0;t&&n<20;n++){if(s.includes(t.id))return!0;t=t.parent_id?i.get(t.parent_id):void 0}return!1};for(const s of t.locations){const o=ze(t,s,i);o===e?n.push(s.id):o&&r(s)&&a.push({mp:s.id,pump:o})}return{sites:s,mps:n,overridden:a}}function Oe(t,e){const i=new Date(t);return i.setMinutes(0,0,0),"day"===e&&i.setHours(0),i.getTime()}function Pe(t,e,i,s,n,a){const r=new Map,o=t=>{const e=Oe(t,a);let i=r.get(e);return i||r.set(e,i={start:e,pump:null,valves:0,consumers:0}),i},l="hour"===a?36e5:864e5;for(let t=Oe(s,a);t<n;t+=l)o(t);let d=null;for(const t of i[e.meter_entity]??[]){if(t.start<s||t.start>=n||"number"!=typeof t.change)continue;const e=o(t.start);e.pump=(e.pump??0)+t.change*Le,d=(d??0)+t.change*Le}let c=0;for(const i of t.runs){const a=Date.parse(i.end);if(a<s||a>=n||"number"!=typeof i.liters)continue;const r=At(t,i.device_id,a);r&&ze(t,r,a)===e.id&&(c+=i.liters,o(Date.parse(i.start)).valves+=i.liters)}let p=0;for(const a of function(t,e,i,s){return t.pumpConnections.filter(t=>t.pump_id===e&&(null===t.begin||t.begin<s)&&(null===t.end||t.end>i))}(t,e.id,s,n))if("consumer"===a.role&&a.meter_entity)for(const t of i[a.meter_entity]??[])t.start<s||t.start>=n||"number"!=typeof t.change||!Ne(a,t.start)||(p+=t.change*Le,o(t.start).consumers+=t.change*Le);return{pump:d,valves:c,consumers:p,unaccounted:null===d?null:d-c-p,buckets:[...r.values()].sort((t,e)=>t.start-e.start)}}const Te="__no_pump__";class Re extends dt{constructor(){super(...arguments),this.items=[],this.selected=null}render(){return this.items.map(t=>B`<button
        class="node ${t.id===this.selected?"on":""}"
        aria-current=${t.id===this.selected?"page":"false"}
        @click=${()=>this.dispatchEvent(new CustomEvent("xt-pump-open",{detail:t.id,bubbles:!0,composed:!0}))}
      >
        ${t.id===Te?B`<span class="dot none"></span>`:B`<span class="dot ${t.state}" title=${"unknown"===t.state?"No data from the pump":t.state}></span>`}
        <span class="label ${t.id===Te?"dim":""}">${t.name}</span>
        <span class="count">${t.count}</span>
      </button>`)}}Re.styles=[Gt,r`
      :host {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .node {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--primary-text-color);
        font-size: 0.95rem;
      }
      .node:hover {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }
      .node.on {
        background: color-mix(in srgb, var(--primary-color) 16%, transparent);
        font-weight: 500;
      }
      .node:focus-visible {
        outline: 2px solid var(--primary-color);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: none;
        background: var(--xt-ok);
      }
      .dot.running {
        background: var(--xt-water);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
      }
      .dot.unknown {
        background: var(--xt-off);
      }
      .dot.none {
        background: transparent;
        border: 1px dashed var(--xt-off);
        box-sizing: border-box;
      }
      .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dim {
        color: var(--xt-dim);
      }
      .count {
        color: var(--xt-dim);
        font-size: 0.8rem;
        font-variant-numeric: tabular-nums;
      }
    `],t([ht({attribute:!1})],Re.prototype,"items",void 0),t([ht({attribute:!1})],Re.prototype,"selected",void 0),customElements.get("xt-pump-list")||customElements.define("xt-pump-list",Re);const Ue=160;class He extends dt{constructor(){super(...arguments),this.buckets=[],this.period="hour"}_label(t){const e=new Date(t);return"hour"===this.period?e.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):e.toLocaleDateString(void 0,{weekday:"short",day:"numeric"})}render(){const t=this.buckets.length;if(!t)return G;const e=Math.max(1,...this.buckets.map(t=>Math.max(t.pump??0,t.valves+t.consumers))),i=100/t,s=t=>t/e*142,n=Math.ceil(t/8);return B`
      <svg viewBox="0 0 100 ${Ue}" preserveAspectRatio="none" role="img" aria-label="Pump delivery against valve and consumer use">
        ${this.buckets.map((t,e)=>{const n=e*i,a=t.valves+t.consumers,r=`${this._label(t.start)}: pump ${null===t.pump?"no data":se(t.pump)}, valves ${se(t.valves)}${t.consumers?`, consumers ${se(t.consumers)}`:""}${null!==t.pump?`, unaccounted ${se(t.pump-a)}`:""}`;return q`<g>
            <title>${r}</title>
            <rect class="hit" x=${n} y="0" width=${i} height=${142}></rect>
            ${null!==t.pump?q`<rect class="pump" x=${n+.1*i} y=${142-s(t.pump)} width=${.8*i} height=${s(t.pump)}></rect>`:G}
            <rect class="valves" x=${n+.25*i} y=${142-s(t.valves)} width=${.5*i} height=${s(t.valves)}></rect>
            <rect class="consumers" x=${n+.25*i} y=${142-s(a)} width=${.5*i} height=${s(t.consumers)}></rect>
          </g>`})}
      </svg>
      <div class="axis">
        ${this.buckets.map((t,e)=>B`<span style="left:${(e+.5)*i}%">${e%n===0?this._label(t.start):""}</span>`)}
      </div>
      <div class="legend">
        <span><i class="pump"></i>Pump delivered</span>
        <span><i class="valves"></i>Valves</span>
        <span><i class="consumers"></i>Metered consumers</span>
      </div>
    `}}He.styles=[Gt,r`
      :host {
        display: block;
        --xt-consumer: var(--teal-color, #009688);
      }
      svg {
        width: 100%;
        height: ${Ue}px;
        display: block;
      }
      .hit {
        fill: transparent;
      }
      g:hover .hit {
        fill: color-mix(in srgb, var(--primary-color) 6%, transparent);
      }
      .pump {
        fill: color-mix(in srgb, var(--xt-water) 14%, transparent);
        stroke: var(--xt-water);
        stroke-width: 0.25;
        vector-effect: non-scaling-stroke;
      }
      .valves {
        fill: var(--xt-water);
      }
      .consumers {
        fill: var(--xt-consumer);
      }
      .axis {
        position: relative;
        height: 16px;
        font-size: 0.7rem;
        color: var(--xt-dim);
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 0.8rem;
        color: var(--xt-dim);
        margin-top: 4px;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .legend i {
        width: 10px;
        height: 10px;
        border-radius: 2px;
      }
      i.pump {
        background: color-mix(in srgb, var(--xt-water) 14%, transparent);
        border: 1px solid var(--xt-water);
      }
      i.valves {
        background: var(--xt-water);
      }
      i.consumers {
        background: var(--xt-consumer);
      }
    `],t([ht({attribute:!1})],He.prototype,"buckets",void 0),t([ht()],He.prototype,"period",void 0),customElements.get("xt-pump-chart")||customElements.define("xt-pump-chart",He);class Ie extends dt{constructor(){super(...arguments),this.devices=[],this.exclude=[],this.placeholder="Search devices by name, area or model",this._q=""}render(){const t=this._q.trim().toLowerCase(),e=t?this.devices.filter(t=>!this.exclude.includes(t.id)).filter(e=>[e.name,e.area,e.model].some(e=>e?.toLowerCase().includes(t))).slice(0,30):[];return B`
      <input type="search" placeholder=${this.placeholder} .value=${this._q} @input=${t=>this._q=t.target.value} />
      ${t?B`<ul role="listbox">
            ${e.length?e.map(t=>B`<li
                    role="option"
                    tabindex="0"
                    @click=${()=>this._pick(t.id)}
                    @keydown=${e=>"Enter"===e.key&&this._pick(t.id)}
                  >
                    <span>${t.name}</span><span class="dim">${[t.area,t.model].filter(Boolean).join(" · ")}</span>
                  </li>`):B`<li class="dim">No device matches.</li>`}
          </ul>`:G}
    `}_pick(t){this._q="",this.dispatchEvent(new CustomEvent("xt-device-picked",{detail:t,bubbles:!0,composed:!0}))}}Ie.styles=[Gt,r`
      :host {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      input {
        font: inherit;
        color: var(--primary-text-color);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        padding: 6px 10px;
        min-height: 34px;
      }
      ul {
        margin: 0;
        padding: 4px;
        list-style: none;
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        max-height: 240px;
        overflow: auto;
      }
      li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
      }
      li:hover,
      li:focus-visible {
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        outline: none;
      }
      .dim {
        color: var(--xt-dim);
        font-size: 0.85rem;
      }
    `],t([ht({attribute:!1})],Ie.prototype,"devices",void 0),t([ht({attribute:!1})],Ie.prototype,"exclude",void 0),t([ht()],Ie.prototype,"placeholder",void 0),t([mt()],Ie.prototype,"_q",void 0),customElements.get("xt-device-picker")||customElements.define("xt-device-picker",Ie);const Fe={"24h":{ms:864e5,period:"hour"},"7d":{ms:6048e5,period:"day"},"30d":{ms:2592e6,period:"day"}},je="xt-pumps-range",We=["meter_entity","flow_entity","pressure_entity","status_entity"],Be={meter_entity:"Water meter (m³ total)",flow_entity:"Flow rate",pressure_entity:"Pressure",status_entity:"Status"},qe={meter_entity:/_fct_total_delivered_flow_mc$/,flow_entity:/_vf_flowliter$/,pressure_entity:/_vp_pressurebar$/,status_entity:/_pumpstatus$/};function Ve(){return new URLSearchParams(window.location.search).get("pump")}class Ge extends dt{constructor(){super(...arguments),this._selected=Ve(),this._range=function(){try{const t=localStorage.getItem(je);return t&&t in Fe?t:"7d"}catch{return"7d"}}(),this._stats={},this._edit=!1,this._busy=!1,this._error=null,this._connecting=null,this._statsKey="",this._farm=new Ut(this),this._balanceMemo=null,this._mpMemo=null,this._onLocation=()=>{this._selected=Ve()}}setConfig(t){}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),window.addEventListener("location-changed",this._onLocation),window.addEventListener("popstate",this._onLocation)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocation),window.removeEventListener("popstate",this._onLocation)}updated(){const t=`${this._range}|${this._farm.data.pumps.length}|${this._farm.data.pumpConnections.length}`;this.hass?.callApi&&this._farm.loaded&&t!==this._statsKey&&(this._statsKey=t,this._loadStats())}async _loadStats(){const{ms:t}=Fe[this._range],e=new Date(Date.now()-t).toISOString();try{const t=await this.hass.callApi("GET",`xtend_tuya/pump_stats?period=hour&start=${encodeURIComponent(e)}`);this._stats=t.series??{}}catch(t){this._error=`Could not load pump statistics: ${t instanceof Error?t.message:String(t)}`}}_state(t){return t?this.hass?.states[t]:void 0}_num(t){const e=this._state(t),i=Number(e?.state);return e&&""!==e.state&&Number.isFinite(i)?i:null}_pumpState(t){const e=this._state(t.status_entity)?.state,i=this._num(t.flow_entity),s=this._state(t.meter_entity)?.state;return s&&"unknown"!==s&&"unavailable"!==s?"Go"===e||null!==i&&i>0?"running":"idle":"unknown"}_devices(){const t=this.hass?.areas??{};return Object.values(this.hass?.devices??{}).map(e=>({id:e.id,name:e.name_by_user||e.name||e.id,area:e.area_id?t[e.area_id]?.name??null:null,model:e.model??null}))}_deviceName(t){const e=this.hass?.devices[t];return e&&(e.name_by_user||e.name)||t}_sensorsOf(t){return t&&this.hass?Object.values(this.hass.entities).filter(e=>e.device_id===t&&e.entity_id.startsWith("sensor.")).map(t=>t.entity_id).sort():[]}_deviceOf(t){return t?this.hass?.entities[t]?.device_id??null:null}_open(t){const e=new URL(window.location.href);t?e.searchParams.set("pump",t):e.searchParams.delete("pump"),window.history.pushState(null,"",e.pathname+e.search),this._selected=t,this._error=null,this._connecting=null}_setRange(t){this._range=t;try{localStorage.setItem(je,t)}catch{}}async _post(t){if(!this.hass?.callApi)return null;this._busy=!0,this._error=null;try{const e=await this.hass.callApi("POST","xtend_tuya/irrigation_locations",t);return await this._farm.refresh(!0),this._statsKey="",e}catch(t){const e=t;return this._error=e.body?.error??e.message??String(t),null}finally{this._busy=!1}}async _createPump(t){const e=this._sensorsOf(t),i=t=>e.find(e=>qe[t].test(e))??null,s=i("meter_entity");if(!s)return void(this._error=`${this._deviceName(t)} has no water meter sensor (…_fct_total_delivered_flow_mc). Create the pump from its meter's device.`);const n=await this._post({action:"create_pump",name:this._deviceName(t),meter_entity:s,flow_entity:i("flow_entity"),pressure_entity:i("pressure_entity"),status_entity:i("status_entity")}),a=n?.pump;a&&this._open(a.id)}_savePump(t,e){t.preventDefault();const i=t.target,s=t=>i.elements.namedItem(t).value,n={action:"update_pump",id:e.id,name:s("name")};for(const t of We)n[t]=s(t)||null;this._post(n)}_assign(t,e){t.preventDefault();const i=t.target.querySelector("select"),[s,n]=i.value.split(":");n&&this._post({action:"assign_pump",pump_id:e.id,target_kind:s,target_id:n})}_connect(t,e){t.preventDefault();const i=t.target,s=t=>i.elements.namedItem(t).value;this._post({action:"connect_device",pump_id:e.id,device_id:this._connecting,role:s("role"),meter_entity:s("meter_entity")||null}).then(t=>{t&&(this._connecting=null)})}_figures(t,e){const i=this._num(t.flow_entity),s=this._num(t.pressure_entity),n=this._state(t.status_entity)?.state,a=this._pumpState(t);return B`<div class="figures">
      ${"unknown"===a?B`<span class="warn" title="The pump's meter reports no value">No data from the pump</span>`:B`<span title="Pump status"><i class="dot ${a}"></i>${n??("running"===a?"Running":"Idle")}</span>`}
      ${null!==i?B`<span title="Live flow"><ha-icon icon="mdi:waves-arrow-right"></ha-icon>${i.toFixed(1)} L/min</span>`:G}
      ${null!==s?B`<span title="Pressure"><ha-icon icon="mdi:gauge"></ha-icon>${s.toFixed(1)} bar</span>`:G}
      <span title="Metering points and valves fed now"
        ><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${e.mps} metering points · ${e.valves} valves</span
      >
    </div>`}_balance(t){const{ms:e,period:i}=Fe[this._range],s=`${t.id}|${this._range}|${Math.floor(Date.now()/6e4)}`,n=this._balanceMemo;if(!n||n.key!==s||n.data!==this._farm.data||n.stats!==this._stats){const n=Date.now();this._balanceMemo={key:s,data:this._farm.data,stats:this._stats,value:Pe(this._farm.data,t,this._stats,n-e,n,i)}}const a=this._balanceMemo.value,r=t=>a.pump?` · ${Math.round(t/a.pump*100)} %`:"";return B`<section>
      <div class="section-head">
        <h3>Water balance</h3>
        <div class="chips" role="group" aria-label="Range">
          ${Object.keys(Fe).map(t=>B`<button class=${t===this._range?"on":""} @click=${()=>this._setRange(t)}>${t}</button>`)}
        </div>
      </div>
      <div class="tiles">
        <div title="What the pump's meter counted"><span class="dim">Pump delivered</span><b>${null===a.pump?"no data":se(a.pump)}</b></div>
        <div title="Runs of the valves this pump fed at the time"><span class="dim">Valves</span><b>${se(a.valves)}</b><span class="dim">${r(a.valves)}</span></div>
        <div title="Metered devices connected as consumers"><span class="dim">Metered consumers</span><b>${se(a.consumers)}</b><span class="dim">${r(a.consumers)}</span></div>
        <div title="Pump minus valves minus consumers: tanks, taps, unmetered valves, leaks">
          <span class="dim">Unaccounted</span><b>${null===a.unaccounted?"–":se(a.unaccounted)}</b
          ><span class="dim">${null===a.unaccounted?"":r(a.unaccounted)}</span>
        </div>
      </div>
      <xt-pump-chart .buckets=${a.buckets} period=${i}></xt-pump-chart>
    </section>`}_feeds(t,e){const i=this._farm.data,s=De(i,t.id,Date.now()),n=t=>B`<xt-mp-card .summary=${e.get(t)}></xt-mp-card>`,a=new Set,r=s.sites.map(t=>{const e=jt(i.sites,t),n=s.mps.filter(t=>{const s=i.locations.find(e=>e.id===t);return s?.site_id&&e.has(s.site_id)});return n.forEach(t=>a.add(t)),{siteId:t,path:Wt(i.sites,t),mps:n}}).sort((t,e)=>t.path.localeCompare(e.path)),o=s.mps.filter(t=>!a.has(t));return B`<section>
      <h3>Feeds <span class="count">${s.mps.length}</span></h3>
      ${this._edit?this._assignForm(t):G}
      ${s.mps.length||r.length?G:B`<div class="msg">This pump is not assigned to a site or metering point yet.</div>`}
      ${r.map(t=>B`<div class="group">
            <span>${t.path}</span><span class="dim">assigned here · ${t.mps.length}</span>
            ${this._edit?B`<button class="link danger" ?disabled=${this._busy}
                  @click=${()=>this._post({action:"end_pump_assignment",target_kind:"site",target_id:t.siteId})}>Unassign</button>`:G}
          </div>
          <div class="grid">${t.mps.map(n)}</div>`)}
      ${o.length?B`<div class="group"><span>Assigned directly</span><span class="dim">${o.length}</span></div>
            <div class="grid">${o.map(n)}</div>`:G}
      ${s.overridden.length?B`<div class="group"><span>Overridden</span><span class="dim">in these sites, fed by another pump</span></div>
            <ul class="plain">
              ${s.overridden.map(t=>{return B`<li>
                  ${e=t.mp,i.locations.find(t=>t.id===e)?.name??e} →
                  <a href="#" @click=${e=>(e.preventDefault(),this._open(t.pump))}>${(t=>i.pumps.find(e=>e.id===t)?.name??t)(t.pump)}</a>
                </li>`;var e})}
            </ul>`:G}
    </section>`}_assignForm(t){const e=this._farm.data,i=e.sites.map(t=>({v:`site:${t.id}`,l:Wt(e.sites,t.id)})).sort((t,e)=>t.l.localeCompare(e.l)),s=e.locations.map(t=>({v:`location:${t.id}`,l:t.name})).sort((t,e)=>t.l.localeCompare(e.l));return B`<form class="editor" @submit=${e=>this._assign(e,t)}>
      <label
        >Assign this pump to
        <select>
          <optgroup label="Sites (with everything below)">${i.map(t=>B`<option value=${t.v}>${t.l}</option>`)}</optgroup>
          <optgroup label="Metering points (override)">${s.map(t=>B`<option value=${t.v}>${t.l}</option>`)}</optgroup>
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Assign</button>
    </form>`}_connections(t,e){const i=this._farm.data.pumpConnections.filter(e=>e.pump_id===t.id&&null===e.end);return B`<section>
      <h3>Connected devices <span class="count">${i.length+e}</span></h3>
      <ul class="rows">
        <li>
          <ha-icon icon="mdi:valve"></ha-icon><span>${e} valves</span>
          <span class="chip">consumer</span><span class="dim">through the metering points it feeds</span>
        </li>
        ${i.map(e=>{const i=this._state(e.meter_entity);return B`<li>
            <ha-icon icon=${"consumer"===e.role?"mdi:water-outline":"mdi:eye-outline"}></ha-icon>
            <span>${this._deviceName(e.device_id)}</span>
            <span class="chip ${e.role}">${e.role}</span>
            ${i?B`<span class="dim" title=${e.meter_entity??""}>${i.state} ${i.attributes.unit_of_measurement??""}</span>`:B`<span class="dim">${"consumer"===e.role?"not metered":""}</span>`}
            ${this._edit?B`<button class="link danger" ?disabled=${this._busy}
                  @click=${()=>this._post({action:"disconnect_device",pump_id:t.id,device_id:e.device_id})}>Disconnect</button>`:G}
          </li>`})}
      </ul>
      ${this._edit?this._connectForm(t,i.map(t=>t.device_id)):G}
    </section>`}_connectForm(t,e){if(!this._connecting)return B`<div class="editor">
        <label>Connect a device
          <xt-device-picker
            .devices=${this._devices()}
            .exclude=${[...e,...this._valveDevices()]}
            @xt-device-picked=${t=>this._connecting=t.detail}
          ></xt-device-picker>
        </label>
      </div>`;const i=this._sensorsOf(this._connecting).filter(t=>{const e=this.hass?.states[t]?.attributes.unit_of_measurement;return"m³"===e||"L"===e});return B`<form class="editor" @submit=${e=>this._connect(e,t)}>
      <label>Device <input .value=${this._deviceName(this._connecting)} disabled /></label>
      <label
        >Role
        <select name="role">
          <option value="consumer">Consumer: uses this pump's water</option>
          <option value="monitor">Monitor: pressure, tank level …</option>
        </select>
      </label>
      <label
        >Meter (counts in the balance)
        <select name="meter_entity">
          <option value="">— none —</option>
          ${i.map(t=>B`<option value=${t}>${t}</option>`)}
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Connect</button>
      <button type="button" @click=${()=>this._connecting=null}>Cancel</button>
    </form>`}_valveDevices(){return this._farm.valves.map(t=>this.hass?.entities[t.registry_entity]?.device_id).filter(t=>!!t)}_pumpForm(t){const e=this._deviceOf(t.meter_entity),i=[...new Set([...this._sensorsOf(e),...We.map(e=>t[e]).filter(t=>!!t)])].sort();return B`<form class="editor" @submit=${e=>this._savePump(e,t)}>
      <label>Name <input name="name" .value=${t.name} required /></label>
      ${We.map(e=>B`<label
          >${Be[e]}
          <select name=${e}>
            ${"meter_entity"===e?G:B`<option value="" ?selected=${!t[e]}>— none —</option>`}
            ${i.map(i=>B`<option value=${i} ?selected=${i===t[e]}>${i}</option>`)}
          </select>
        </label>`)}
      <button type="submit" ?disabled=${this._busy}>Save</button>
    </form>`}render(){if(!this.hass)return G;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading pumps…</div></ha-card>`;const t=this._farm.data,e=Date.now(),i=this._farm.summaries();this._mpMemo?.valves!==i&&(this._mpMemo={valves:i,map:new Map(t.locations.map(s=>[s.id,ge(s,t,i,e)]))});const s=this._mpMemo.map,n=t.locations.filter(t=>!t.pump),a=[...t.pumps].sort((t,e)=>t.name.localeCompare(e.name)).map(i=>({id:i.id,name:i.name,state:this._pumpState(i),count:De(t,i.id,e).mps.length}));n.length&&a.push({id:Te,name:"No pump",state:"unknown",count:n.length});const r=this._selected&&a.some(t=>t.id===this._selected)?this._selected:a[0]?.id??null,o=r&&r!==Te?t.pumps.find(t=>t.id===r)??null:null,l=!!this.hass.user?.is_admin,d=o?De(t,o.id,e).mps:[],c=d.reduce((t,e)=>t+(s.get(e)?.valves.length??0),0);return B`<div
      class="layout"
      @xt-pump-open=${t=>this._open(t.detail)}
      @xt-valve-open=${t=>Vt(t.detail)}
    >
      <aside>
        <xt-pump-list .items=${a} .selected=${r}></xt-pump-list>
        ${this._edit?B`<div class="editor">
              <label>New pump from an HA device
                <xt-device-picker
                  placeholder="Search the pump's device (e.g. Big Farm 2)"
                  .devices=${this._devices()}
                  @xt-device-picked=${t=>this._createPump(t.detail)}
                ></xt-device-picker>
              </label>
            </div>`:G}
      </aside>
      <main>
        <div class="title-row">
          <h2>${o?o.name:r===Te?"No pump":"Pumps"}</h2>
          ${l?B`<button class="edit ${this._edit?"on":""}" @click=${()=>(this._edit=!this._edit,this._connecting=null)}>
                <ha-icon icon=${this._edit?"mdi:check":"mdi:pencil-outline"}></ha-icon>${this._edit?"Done":"Edit"}
              </button>`:G}
        </div>
        ${this._error?B`<div class="msg err">${this._error}</div>`:G}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:G}
        ${a.length?G:B`<div class="msg">No pumps yet. ${l?"Use Edit to create one from its HA device.":""}</div>`}
        ${o?B`${this._figures(o,{mps:d.length,valves:c})}
              ${this._edit?this._pumpForm(o):G} ${this._balance(o)} ${this._feeds(o,s)}
              ${this._connections(o,c)}`:G}
        ${r===Te?B`<p class="dim">Metering points no pump feeds: set a pump on their site or on them.</p>
              <div class="grid">${n.map(t=>B`<xt-mp-card .summary=${s.get(t.id)}></xt-mp-card>`)}</div>`:G}
      </main>
    </div>`}}Ge.styles=[Gt,Ee,r`
      section {
        margin-top: 24px;
      }
      .section-head {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .section-head h3 {
        margin: 0;
        flex: 1;
      }
      .chips {
        display: flex;
        gap: 4px;
      }
      .chips button {
        border-radius: 18px;
        padding: 4px 12px;
        min-height: 30px;
      }
      .chips button.on {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 12px 0 16px;
      }
      .tiles div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--xt-track);
      }
      .tiles b {
        font-size: 1.3rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .dim {
        color: var(--xt-dim);
      }
      .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--xt-ok);
      }
      .dot.running {
        background: var(--xt-water);
      }
      .group {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 16px 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--primary-color);
      }
      .group .dim {
        text-transform: none;
        letter-spacing: 0;
        font-weight: 400;
      }
      .link {
        border: none;
        background: none;
        min-height: 0;
        padding: 2px 6px;
        text-transform: none;
        font-weight: 400;
        letter-spacing: 0;
      }
      .link.danger {
        color: var(--xt-bad);
        margin-left: auto;
      }
      ul.rows,
      ul.plain {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      ul.rows li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid var(--xt-track);
        border-radius: 10px;
      }
      .chip {
        font-size: 0.75rem;
        padding: 1px 8px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--xt-water) 14%, transparent);
      }
      .chip.monitor {
        background: color-mix(in srgb, var(--xt-dim) 14%, transparent);
      }
      main xt-device-picker {
        min-width: 280px;
      }
      aside .editor {
        margin-top: 12px;
        padding: 10px;
      }
      aside .editor label {
        width: 100%;
      }
    `],t([ht({attribute:!1})],Ge.prototype,"hass",void 0),t([mt()],Ge.prototype,"_selected",void 0),t([mt()],Ge.prototype,"_range",void 0),t([mt()],Ge.prototype,"_stats",void 0),t([mt()],Ge.prototype,"_edit",void 0),t([mt()],Ge.prototype,"_busy",void 0),t([mt()],Ge.prototype,"_error",void 0),t([mt()],Ge.prototype,"_connecting",void 0),customElements.get("irrigation-pumps-card")||customElements.define("irrigation-pumps-card",Ge);class Ke extends dt{constructor(){super(...arguments),this.runs=[],this.metered=!0,this._shown=15}render(){const t=[...this.runs].sort((t,e)=>Date.parse(e.start)-Date.parse(t.start));return t.length?B`
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th class="num">Duration</th>
            <th class="num">Liters</th>
          </tr>
        </thead>
        <tbody>
          ${t.slice(0,this._shown).map(t=>{const e=Date.parse(t.start),i="number"==typeof t.liters?`${Math.round(t.liters)} L`:"–";return B`<tr class=${this.metered&&0===t.liters?"dry":""}>
              <td>${Xt(e)}</td>
              <td>${Zt(e)}</td>
              <td>${Zt(Date.parse(t.end))}</td>
              <td class="num">${function(t){const e=Math.round(t/60);return e<60?`${e} min`:`${Math.floor(e/60)} h ${e%60} min`}(t.duration_seconds??0)}</td>
              <td class="num" title=${this.metered&&0===t.liters?"No water measured":""}>
                ${this.metered?i:"–"}
              </td>
            </tr>`})}
        </tbody>
      </table>
      ${t.length>this._shown?B`<button @click=${()=>this._shown+=15}>Show more (${t.length-this._shown})</button>`:G}
    `:B`<div class="empty">No runs recorded in the last 30 days.</div>`}}Ke.styles=[Gt,r`
      :host {
        display: block;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
      }
      th {
        text-align: left;
        font-weight: 500;
        color: var(--xt-dim);
        font-size: 0.8rem;
        padding: 4px 6px;
        border-bottom: 1px solid var(--xt-track);
      }
      td {
        padding: 6px;
        border-bottom: 1px solid color-mix(in srgb, var(--xt-track) 60%, transparent);
      }
      .num {
        text-align: right;
      }
      tr.dry td:last-child {
        color: var(--xt-bad);
      }
      .empty {
        color: var(--xt-dim);
        padding: 8px 0;
      }
      button {
        all: unset;
        cursor: pointer;
        color: var(--primary-color);
        padding: 8px 6px 0;
        font-size: 0.9rem;
      }
    `],t([ht({attribute:!1})],Ke.prototype,"runs",void 0),t([ht({type:Boolean})],Ke.prototype,"metered",void 0),t([mt()],Ke.prototype,"_shown",void 0),customElements.get("xt-run-history")||customElements.define("xt-run-history",Ke);class Je extends dt{constructor(){super(...arguments),this._data=yt,this._loaded=!1}setConfig(t){if(!t.device_id)throw new Error("device_id is required");this._config=t}getCardSize(){return 6}updated(){this.hass&&!this._loaded&&(this._loaded=!0,wt(this.hass).then(t=>this._data=t,()=>{}))}render(){if(!this._config)return G;const t=this._data.runs.filter(t=>t.device_id===this._config.device_id);return B`<ha-card>
      <div class="title"><ha-icon icon="mdi:format-list-bulleted"></ha-icon>${this._config.title??"Watering log"}</div>
      <div class="content">
        <xt-run-history .runs=${t} ?metered=${!1!==this._config.metered}></xt-run-history>
      </div>
    </ha-card>`}}Je.styles=r`
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 8px;
      font-size: 1.1em;
      font-weight: 500;
    }
    .title ha-icon {
      color: var(--secondary-text-color);
    }
    .content {
      padding: 0 16px 12px;
    }
  `,t([ht({attribute:!1})],Je.prototype,"hass",void 0),t([mt()],Je.prototype,"_config",void 0),t([mt()],Je.prototype,"_data",void 0),t([mt()],Je.prototype,"_loaded",void 0),customElements.get("irrigation-run-history-card")||customElements.define("irrigation-run-history-card",Je);class Ye extends dt{connectedCallback(){super.connectedCallback(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label","Loading")}}Ye.styles=[Gt,r`
      :host {
        display: inline-block;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid color-mix(in srgb, var(--xt-water) 25%, transparent);
        border-top-color: var(--xt-water);
        box-sizing: border-box;
        animation: spin 0.9s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `],customElements.get("xt-spinner")||customElements.define("xt-spinner",Ye);const Xe={low_battery:["Low battery","Battery below 20 %","warn"],stale:["No report 36 h","The valve has not reported for more than 36 hours","warn"],missed:["Missed","A planned run in the last 24 hours did not happen","bad"],no_flow:["No water flow","The last run measured no water","bad"],flow_low:["Flow low","Mean flow of the last 30 days is well below the expected L/min","bad"],flow_high:["Flow high","Mean flow of the last 30 days is well above the expected L/min (leak?)","bad"]};class Ze extends dt{constructor(){super(...arguments),this._farm=new Ut(this)}setConfig(t){if(!t.device_id)throw new Error("device_id is required");this._config=t}getCardSize(){return 3}render(){if(!this._config||!this.hass)return G;if(!this._farm.loaded)return B`<ha-card class="loading"><xt-spinner></xt-spinner></ha-card>`;const t=Date.now(),e=this._farm.summaryOf(this._config.device_id);if(!e)return B`<ha-card><div class="msg">Valve not found.</div></ha-card>`;const i=this._farm.data.locations.find(t=>t.valves.includes(e.device_id)),s=i?i.valves.map(t=>t===e.device_id?e:this._farm.summaryOf(t)).filter(t=>!!t):[],n=i?ge(i,this._farm.data,s,t):null,a=n?.week??e.week,r=n?.last??e.last,o=[...new Set([...n?.badges.filter(t=>"no_valve"!==t)??[],...e.badges])],l=e.number?e.name.replace(/\s*\(\d+\)\s*$/,""):e.name,d="watering"===e.status?B`<span class="status watering"><i></i>Watering${e.since?` since ${Zt(e.since)}`:""}${null!==e.flow_lpm?` · ${e.flow_lpm.toFixed(1)} L/min`:""}</span>`:"offline"===e.status?B`<span class="status offline"><i></i>Offline${e.since?` for ${te(e.since)}`:""}</span>`:B`<span class="status"><i></i>Idle</span>`,c="L"===a.unit?se(a.liters):`${Math.round(a.minutes)} min`;return B`<ha-card>
      <div class="top">
        <div class="who">
          <div class="name-row">
            <h1>${l}</h1>
            ${e.number?B`<span class="num" title="Valve number">#${e.number}</span>`:G}
            ${null!==e.battery?B`<span class="battery ${e.badges.includes("low_battery")?"low":""}" title="Battery ${Math.round(e.battery)} %"
                  ><ha-icon icon=${ie(e.battery)}></ha-icon>${Math.round(e.battery)} %</span
                >`:G}
          </div>
          ${d}
          <div class="where">
            ${i?B`<span title="Metering point"><ha-icon icon="mdi:map-marker-outline"></ha-icon>${i.name}</span>
                  ${e.site?B`<span title="Site"><ha-icon icon="mdi:sprout-outline"></ha-icon>${e.site.name}</span>`:G}`:B`<span class="dim">No metering point</span>`}
            ${n?.pump?B`<span title="Pump${n.pump.via?`, inherited from ${n.pump.via}`:""}"
                  ><ha-icon icon="mdi:pump"></ha-icon>${n.pump.name}${n.pump.via?B`<span class="dim"> · via ${n.pump.via}</span>`:G}</span
                >`:G}
          </div>
          ${o.length?B`<div class="badges">
                ${o.map(t=>{const[e,i,s]=Xe[t]??[t,t,"warn"];return B`<span class="badge ${s}" title=${i}>${e}</span>`})}
              </div>`:G}
        </div>
        <div class="tiles">
          <div title="Last run: when, how long, how much">
            <span class="lbl"><ha-icon icon="mdi:history"></ha-icon>Last run</span>
            <b>${r?Qt(r.start):"–"}</b>
            <span class="dim">${r?function(t){const e=[`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}(r):""}</span>
          </div>
          <div title="Next planned run">
            <span class="lbl"><ha-icon icon="mdi:calendar-clock"></ha-icon>Next run</span>
            <b>${e.next?Qt(e.next.start):"–"}</b>
            <span class="dim">${e.next?`${Math.round(e.next.minutes)} min`:"nothing planned"}</span>
          </div>
          <div title="Last 7 days${n?" at this metering point":""}">
            <span class="lbl"><ha-icon icon="mdi:chart-bar"></ha-icon>7 days</span>
            <b>${c}</b>
            <span class="week"><xt-week-bars .daily=${a.daily} unit=${a.unit}></xt-week-bars><span class="dim">${a.runs} runs</span></span>
          </div>
          ${null!=n?.avg_lpm?B`<div title="Mean flow of the last 30 days' runs${n.expected_lpm?" vs. the expected L/min":""}">
                <span class="lbl"><ha-icon icon="mdi:speedometer"></ha-icon>Flow</span>
                <b>${n.avg_lpm.toFixed(1)} L/min</b>
                <span class="dim">${n.expected_lpm?`expected ${n.expected_lpm}`:"30-day mean"}</span>
              </div>`:G}
        </div>
      </div>
    </ha-card>`}}Ze.styles=[Gt,r`
      ha-card {
        padding: 16px 18px;
      }
      ha-card.loading {
        min-height: 96px;
        display: grid;
        place-items: center;
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        gap: 16px 32px;
        align-items: flex-start;
      }
      .who {
        flex: 1 1 280px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .name-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 400;
      }
      .num {
        color: var(--primary-color);
        font-variant-numeric: tabular-nums;
      }
      .battery {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        color: var(--xt-dim);
        font-variant-numeric: tabular-nums;
      }
      .battery.low,
      .battery.low ha-icon {
        color: var(--xt-bad);
      }
      ha-icon {
        --mdc-icon-size: 18px;
        color: var(--xt-dim);
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.05rem;
      }
      .status i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--xt-ok);
      }
      .status.watering {
        font-weight: 500;
      }
      .status.watering i {
        background: var(--xt-water);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--xt-water) 30%, transparent);
      }
      .status.offline i {
        background: var(--xt-off);
      }
      .where {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 16px;
      }
      .where > span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .dim {
        color: var(--xt-dim);
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .badge {
        font-size: 0.8rem;
        padding: 2px 10px;
        border-radius: 12px;
      }
      .badge.warn {
        background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
      }
      .badge.bad {
        background: color-mix(in srgb, var(--xt-bad) 18%, transparent);
      }
      .tiles {
        flex: 2 1 480px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .tiles > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border: 1px solid var(--xt-track);
        border-radius: 12px;
        min-width: 0;
      }
      .lbl {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--xt-dim);
      }
      .lbl ha-icon {
        --mdc-icon-size: 15px;
      }
      .tiles b {
        font-size: 1.15rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .week {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .msg {
        padding: 16px;
        color: var(--xt-dim);
      }
    `],t([ht({attribute:!1})],Ze.prototype,"hass",void 0),t([mt()],Ze.prototype,"_config",void 0),customElements.get("irrigation-valve-header-card")||customElements.define("irrigation-valve-header-card",Ze);const Qe=864e5,ti=36e5,ei="xt-irrigation-calendar-mode",ii="xt-irrigation-calendar-range";function si(t){return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function ni(t,e){const i=new Date(t);return i.setDate(i.getDate()+e),i}const ai=t=>String(t).padStart(2,"0"),ri=t=>{const e=new Date(t);return`${ai(e.getHours())}:${ai(e.getMinutes())}`},oi=t=>t>0?String(Math.round(t/6e4)):"–";function li(t){const e=/·\s*~?([\d.,]+)\s*L\s*$/.exec(t);return e?Number(e[1].replace(",",".")):null}function di(t){return("ran"===t.kind||"unplanned"===t.kind)&&0===t.liters}const ci="xt-irrigation-calendar-filter";function pi(t,e){try{return localStorage.getItem(t)??e}catch{return e}}function ui(t,e){try{localStorage.setItem(t,e)}catch{}}class hi extends dt{constructor(){super(...arguments),this._config=null,this._mode=["day","week","timeline"].includes(pi(ei,"day"))?pi(ei,"day"):"day",this._range=[1,3,7].includes(Number(pi(ii,"1")))?Number(pi(ii,"1")):1,this._anchor=si(new Date),this._events=[],this._problemsOnly=!1,this._filter=function(){try{return{...Ht,...JSON.parse(localStorage.getItem(ci)??"{}"),status:"all"}}catch{return Ht}}(),this._farm=yt,this._farmLoaded=!1,this._loading=!1,this._error=null,this._loadedKey=""}setConfig(t){this._config=t}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>this._load(!0),3e5)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}updated(){!this._farmLoaded&&this.hass?.callApi&&(this._farmLoaded=!0,wt(this.hass).then(t=>this._farm=t,()=>{}));const t=`${this._mode}|${this._range}|${this._anchor.getTime()}`;t!==this._loadedKey&&this.hass?.callApi&&(this._loadedKey=t,this._load())}_window(){if("week"===this._mode){const t=function(t){const e=si(t);return e.setDate(e.getDate()-(e.getDay()+6)%7),e}(this._anchor);return[t,ni(t,7)]}const t=si(this._anchor);return[t,ni(t,"timeline"===this._mode?this._range:1)]}_valveByRegistry(){const t=new Map;for(const e of this._config?.valves??[])t.set(e.registry_entity,e);return t}async _load(t=!1){if(!this.hass?.callApi)return;const[e,i]=this._window(),s=`?start=${encodeURIComponent(e.toISOString())}&end=${encodeURIComponent(i.toISOString())}`,n=this._config?.planned_entity??"calendar.irrigation_planned",a=this._config?.completed_entity??"calendar.irrigation_completed";t||(this._loading=!0),this._error=null;try{const[t,e]=await Promise.all([this.hass.callApi("GET",`calendars/${n}${s}`),this.hass.callApi("GET",`calendars/${a}${s}`)]),i=this._valveByRegistry(),r=(t,e)=>{const s=Date.parse(t.start.dateTime??t.start.date??"");let n=Date.parse(t.end.dateTime??t.end.date??"");if(!Number.isFinite(s))return null;(!Number.isFinite(n)||n<=s)&&(n=s+6e4);const a=(t.uid??"").split("#")[0],r=i.get(a);return{start:s,end:n,kind:e,key:a,name:r?.valve_name??t.summary.split(" · ")[0],summary:t.summary,liters:"planned"===e?null:li(t.summary),path:r?.view_path}},o=(e??[]).map(t=>r(t,/Type: In progress/.test(t.description??"")?"running":"ran")).filter(t=>!!t),l=(t??[]).map(t=>r(t,"planned")).filter(t=>!!t);this._events=Ct(l,o,Date.now())}catch(t){this._error=function(t){const e=t;return e?.body?.message??e?.message??String(t)}(t)}finally{this._loading=!1,t||this.updateComplete.then(()=>this._scrollToFirst())}}_scrollToFirst(){if("timeline"===this._mode)return;const[t,e]=this._window();let i=null;for(const s of this._events){if(s.end<=t.getTime()||s.start>=e.getTime())continue;const n=new Date(Math.max(s.start,t.getTime())),a=n.getHours()+n.getMinutes()/60;(null===i||a<i)&&(i=a)}const s=this.renderRoot.querySelector(".scroll");s&&null!==i&&(s.scrollTop=Math.max(0,(i-1)*this._hourPx()))}_hourPx(){return this._config?.hour_height??Math.max(36,Math.round(.72*window.innerHeight/8))}_setMode(t){this._mode=t,ui(ei,t)}_setRange(t){this._range=t,ui(ii,String(t))}_shift(t){const e="week"===this._mode?7:"timeline"===this._mode?this._range:1;this._anchor=ni(this._anchor,e*t)}_open(t){if(!t)return;const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",`/${e}/${t}`),this.dispatchEvent(new Event("location-changed",{bubbles:!0,composed:!0}))}_rangeLabel(){const[t,e]=this._window(),i={weekday:"short",day:"numeric",month:"short"};return e.getTime()-t.getTime()<=Qe?t.toLocaleDateString(void 0,i):`${t.toLocaleDateString(void 0,{day:"numeric",month:"short"})} – ${ni(e,-1).toLocaleDateString(void 0,i)}`}_placeOf(t){const e=this._farm.locationOf[t.device_id],i=e?.site_id??null;return{site:i,siteName:i?Wt(this._farm.sites,i):null,mp:e?.name??null}}_visible(){const t=this._filter,e=t.site?jt(this._farm.sites,t.site):null,i=t.search.trim().toLowerCase();return(this._config?.valves??[]).filter(t=>{const s=this._placeOf(t);return!!(!e||s.site&&e.has(s.site))&&(!i||[t.valve_name,s.mp,s.siteName].some(t=>t?.toLowerCase().includes(i)))})}_shownEvents(){if(!this._filter.site&&!this._filter.search.trim())return this._events;const t=new Set(this._visible().map(t=>t.registry_entity));return this._events.filter(e=>t.has(e.key))}_onFilter(t){this._filter=t.detail;try{localStorage.setItem(ci,JSON.stringify(t.detail))}catch{}}_legend(t){const e={planned:0,ran:0,missed:0,unplanned:0,running:0,dry:0};for(const i of t)e[i.kind]++,di(i)&&e.dry++;const i=(t,e,i,s)=>B`<span class="lg" title=${s}><i class="sw ${t}"></i><b>${e}</b> ${i}</span>`;return B`<div class="legend">
      ${i("ran",e.ran,"ran","Planned runs that happened (filled blue)")}
      ${i("missed",e.missed,"missed","Planned runs that did not happen (red outline)")}
      ${i("planned",e.planned,"ahead","Planned runs still to come (outline)")}
      ${e.unplanned?i("unplanned",e.unplanned,"unplanned","Runs nobody planned (striped)"):G}
      ${e.running?i("running",e.running,"running","Watering now"):G}
      ${e.dry?i("dry",e.dry,"no water","Runs that measured no water (red)"):G}
    </div>`}render(){if(!this._config)return G;const t=this._mode,e=this._shownEvents(),i=(t,e,i)=>B`<button class="chip ${t?"on":""}" aria-pressed=${t} @click=${i}>${e}</button>`;return B`
      <ha-card>
        <div class="head">
          <div class="title-row">
            <h2>${this._config.title??"Irrigation calendar"}</h2>
            ${this._loading?B`<xt-spinner></xt-spinner>`:G}
          </div>
          <div class="bar">
            <div class="chips" role="group" aria-label="View">
              ${i("day"===t,"Day",()=>this._setMode("day"))}
              ${i("week"===t,"Week",()=>this._setMode("week"))}
              ${i("timeline"===t,"Timeline",()=>this._setMode("timeline"))}
            </div>
            ${"timeline"===t?B`<div class="chips" role="group" aria-label="Range">
                  ${[1,3,7].map(t=>i(this._range===t,`${t} d`,()=>this._setRange(t)))}
                </div>`:G}
            <div class="datenav">
              <button class="icon" @click=${()=>this._shift(-1)} aria-label="Previous"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <span class="range-label">${this._rangeLabel()}</span>
              <button class="icon" @click=${()=>this._shift(1)} aria-label="Next"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
              ${i(!1,"Today",()=>this._anchor=si(new Date))}
            </div>
          </div>
          <xt-valve-filter-bar
            .sites=${this._farm.sites}
            .value=${this._filter}
            .statuses=${!1}
            @xt-filter-changed=${this._onFilter}
          ></xt-valve-filter-bar>
          <div class="bar">
            ${this._legend(e)}
            ${"timeline"===t?i(this._problemsOnly,this._problemsOnly?"Showing problems":"Problems only",()=>this._problemsOnly=!this._problemsOnly):G}
          </div>
        </div>
        ${this._error?B`<div class="err">${this._error}</div>`:G}
        ${"timeline"===t?this._renderTimeline(e):this._renderGrid(e)}
      </ha-card>
    `}_renderGrid(t){const[e]=this._window(),i="day"===this._mode?1:7,s=this._hourPx(),n=si(new Date).getTime();return B`
      <div class="scroll">
        <div class="grid" style="--hour:${s}px;--days:${i}">
          <div class="hours">
            ${i>1?B`<div class="colhead"></div>`:G}
            ${Array.from({length:24},(t,e)=>B`<div class="hour">${ai(e)}:00</div>`)}
          </div>
          ${Array.from({length:i},(a,r)=>{const o=ni(e,r).getTime(),l=o+Qe,d=t.filter(t=>t.start<l&&t.end>o).map(t=>({...t,start:Math.max(t.start,o),end:Math.min(Math.max(t.end,t.start+9e5),l)})),c=function(t){const e=[...t].sort((t,e)=>t.start-e.start||Mt[t.kind]-Mt[e.kind]||t.name.localeCompare(e.name)),i=[];let s=[],n=[],a=-1/0;const r=()=>{const t=s.length;for(const e of n)e.lanes=t;n=[],s=[]};for(const t of e){t.start>=a&&r();let e=s.findIndex(e=>e<=t.start);-1===e?(e=s.length,s.push(t.end)):s[e]=t.end;const o={ev:t,lane:e,lanes:0};n.push(o),i.push(o),a=Math.max(a,t.end)}return r(),i}(d),p=c.reduce((t,e)=>Math.max(t,e.lanes),1),u=i>1?40:72;return B`
              <div
                class="col ${o===n?"today":""}"
                style="min-width:${Math.max(110,p*u)}px"
              >
                ${i>1?B`<div class="colhead"><span>${new Date(o).toLocaleDateString(void 0,{weekday:"short",day:"numeric"})}</span></div>`:G}
                <div class="lines"></div>
                ${c.map(({ev:t,lane:e,lanes:i})=>{const n=(t.start-o)/ti*s,a=Math.max((t.end-t.start)/ti*s,s/4),r=100/i;return B`<div
                    class="ev ${t.kind} ${di(t)?"dry":""} ${t.path?"link":""}"
                    style="top:${n}px;height:${a}px;left:${e*r}%;width:calc(${r}% - 2px)"
                    title=${t.summary}
                    @click=${()=>this._open(t.path)}
                  >
                    <b>${t.name}</b>
                    <span>${ri(t.start)}–${ri(t.end)}${null!=t.liters?` · ${Math.round(t.liters)} L`:""}</span>
                  </div>`})}
              </div>
            `})}
        </div>
      </div>
    `}_renderTimeline(t){const[e,i]=this._window(),s=e.getTime(),n=i.getTime()-s,a=t=>(t-s)/n*100,r=Date.now(),o=new Map;for(const e of t)(o.get(e.key)??o.set(e.key,[]).get(e.key)).push(e);const l=this._visible(),d=t=>{const e=this._placeOf(t);return e.siteName??(e.mp?"No site":"No metering point")},c=new Map;for(const t of[...l].sort((t,e)=>d(t).localeCompare(d(e))||t.valve_name.localeCompare(e.valve_name)))(c.get(d(t))??c.set(d(t),[]).get(d(t))).push(t);const p=[...c.keys()],u=1===this._range?3:3===this._range?12:24,h=[];for(let t=s;t<i.getTime();t+=u*ti){const e=new Date(t);h.push({left:a(t),label:u>=24||0===e.getHours()&&this._range>1?e.toLocaleDateString(void 0,{weekday:"short"}):`${ai(e.getHours())}`})}const m=Array.from({length:this._range-1},(t,e)=>a(s+(e+1)*Qe)),v=r>s&&r<i.getTime()?a(r):null;let g=0;const f=p.map(t=>{const e=c.get(t).map(t=>{const e=o.get(t.registry_entity)??[],i=e.some(t=>"missed"===t.kind||"unplanned"===t.kind||t.end-t.start>144e5);return{v:t,evs:e,problem:i}}).filter(t=>!this._problemsOnly||t.problem);return e.length?(g+=e.length,B`
        <div class="grouphdr">${t}</div>
        ${e.map(({v:t,evs:e,problem:i})=>{const s=e.reduce((t,e)=>"planned"===e.kind||"missed"===e.kind?t+(e.end-e.start):null!=e.planStart&&null!=e.planEnd?t+(e.planEnd-e.planStart):t,0),n=e.filter(t=>"ran"===t.kind||"unplanned"===t.kind||"running"===t.kind),r=n.reduce((t,e)=>t+(e.end-e.start),0),o=n.reduce((t,e)=>null==e.liters?t:(t??0)+e.liters,null);return B`
            <div class="row clickable ${i?"problem":""}" @click=${()=>this._open(t.view_path)}>
              <div class="name" title=${t.valve_name}>${t.valve_name}</div>
              <div class="track">
                ${m.map(t=>B`<i class="dayline" style="left:${t}%"></i>`)}
                ${e.map(t=>B`<i
                    class="bar ${t.kind} ${di(t)?"dry":""}"
                    style="left:${a(t.start)}%;width:${Math.max(a(t.end)-a(t.start),.4)}%"
                    title=${t.summary}
                  ></i>`)}
                ${null!==v?B`<i class="now" style="left:${v}%"></i>`:G}
              </div>
              <div class="metric ${s?"":"muted"}">${oi(s)}</div>
              <div class="metric ${r?"":"muted"}">${oi(r)}</div>
              <div class="metric ${null==o?"muted":""}">${(t=>null==t?"–":String(Math.round(t)))(o)}</div>
            </div>
          `})}
      `):G});return B`
      <div class="tl">
        <div class="row header">
          <div></div>
          <div class="axis">
            ${h.map(t=>B`<span style="left:${t.left}%">${t.label}</span>`)}
          </div>
          <div class="metric" title="Planned minutes in this range"><span class="lbl-long">plan min</span><span class="lbl-short">plan</span></div>
          <div class="metric" title="Minutes actually watered in this range"><span class="lbl-long">ran min</span><span class="lbl-short">ran</span></div>
          <div class="metric"><span class="lbl-long">water (L)</span><span class="lbl-short">L</span></div>
        </div>
        ${f}
        ${l.length?this._problemsOnly&&0===g?B`<div class="empty">No missed or unplanned runs in this range.</div>`:G:B`<div class="empty">No valves on this dashboard yet. Use "Re-sync valves" on the overview.</div>`}
      </div>
    `}}if(hi.styles=[Gt,r`
    :host {
      --cc-text: var(--primary-text-color, #212121);
      --cc-dim: var(--xt-dim);
      --cc-line: var(--xt-track);
      --cc-primary: var(--primary-color, #03a9f4);
      --cc-bg: var(--card-background-color, #fff);
      --cc-hover: var(--secondary-background-color, #f5f5f5);
      /* water that ran: blue; a plan: an outline; missed: red dashed */
      --cc-water: var(--xt-water);
      --cc-ran-bg: color-mix(in srgb, var(--xt-water) 28%, var(--cc-bg));
      --cc-missed: var(--xt-bad);
      --cc-dry-bg: color-mix(in srgb, var(--xt-bad) 20%, var(--cc-bg));
      /* unplanned run: still water, but striped so it reads as "nobody scheduled this" */
      --cc-water-stripes: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--cc-water) 45%, var(--cc-bg)) 0 3px,
        color-mix(in srgb, var(--cc-water) 12%, var(--cc-bg)) 3px 7px
      );
    }
    ha-card {
      padding-bottom: 8px;
      color: var(--cc-text);
    }
    .head {
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 400;
    }
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
    }
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chip {
      font: inherit;
      font-size: 0.9rem;
      color: var(--cc-text);
      background: var(--cc-bg);
      border: 1px solid var(--cc-line);
      border-radius: 18px;
      padding: 4px 12px;
      min-height: 32px;
      cursor: pointer;
    }
    .chip.on {
      background: var(--cc-primary);
      border-color: var(--cc-primary);
      color: var(--text-primary-color, #fff);
    }
    .chip:focus-visible,
    .icon:focus-visible {
      outline: 2px solid var(--cc-primary);
      outline-offset: 1px;
    }
    .datenav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .icon {
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 50%;
      padding: 4px;
      display: flex;
      color: var(--cc-text);
    }
    .icon:hover {
      background: var(--cc-hover);
    }
    .range-label {
      font-weight: 500;
      padding: 0 4px;
      min-width: 9em;
      text-align: center;
    }
    xt-valve-filter-bar {
      margin-bottom: 0;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      font-size: 0.9rem;
      flex: 1;
    }
    .lg {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-variant-numeric: tabular-nums;
    }
    .lg b {
      font-weight: 500;
    }
    .sw {
      display: inline-block;
      width: 14px;
      height: 12px;
      border-radius: 3px;
      box-sizing: border-box;
    }
    .sw.planned {
      box-shadow: inset 0 0 0 1.5px var(--cc-dim);
    }
    .sw.ran {
      background: var(--cc-ran-bg);
      border-left: 3px solid var(--cc-water);
    }
    .sw.running {
      background: var(--cc-water);
    }
    .sw.missed {
      border: 1.5px dashed var(--cc-missed);
    }
    .sw.unplanned {
      background: var(--cc-water-stripes);
    }
    .sw.dry {
      background: var(--cc-dry-bg);
      border-left: 3px solid var(--cc-missed);
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
    /* 5-minute grid (Trello Sijuj2Dd): faint 5-min, stronger 15-min, solid hour lines */
    .lines {
      height: calc(var(--hour) * 24);
      background-image:
        linear-gradient(to bottom, var(--cc-line) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--cc-line) 70%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--cc-line) 35%, transparent) 1px, transparent 1px);
      background-size:
        100% var(--hour),
        100% calc(var(--hour) / 4),
        100% calc(var(--hour) / 12);
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
    /* one line: a 15-min block is ~20 px tall (8 h per screen) */
    .ev {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .ev b,
    .ev span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev span {
      flex: 1 1 0;
      min-width: 0;
    }
    .ev b {
      flex: 0 1 auto;
    }
    .ev b {
      font-weight: 500;
    }
    .ev span {
      color: var(--cc-dim);
    }
    .ev.planned {
      box-shadow: inset 0 0 0 1.5px var(--cc-dim);
    }
    .ev.ran,
    .ev.running {
      background: var(--cc-ran-bg);
      border-left: 3px solid var(--cc-water);
    }
    .ev.unplanned {
      background: var(--cc-water-stripes);
    }
    .ev.running {
      box-shadow: inset 0 0 0 2px var(--cc-water);
    }
    .ev.missed {
      border: 1.5px dashed var(--cc-missed);
      background: color-mix(in srgb, var(--cc-missed) 6%, var(--cc-bg));
    }
    .ev.dry {
      background: var(--cc-dry-bg);
      border-left: 3px solid var(--cc-missed);
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
    .bar {
      border-radius: 2px;
      box-sizing: border-box;
    }
    .bar.planned {
      background: color-mix(in srgb, var(--cc-dim) 12%, var(--cc-bg));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cc-dim) 70%, transparent);
    }
    .bar.missed {
      border: 1.5px dashed var(--cc-missed);
    }
    .bar.ran,
    .bar.running {
      background: var(--cc-water);
    }
    .bar.unplanned {
      background: var(--cc-water-stripes);
    }
    .bar.running {
      box-shadow: inset 0 0 0 2px var(--cc-text);
    }
    .bar.dry {
      background: var(--cc-missed);
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
      .head {
        padding-left: 10px;
        padding-right: 10px;
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .bar.running {
        animation: xt-pulse 2s ease-in-out infinite;
      }
      @keyframes xt-pulse {
        50% {
          opacity: 0.6;
        }
      }
    }
  `],t([ht({attribute:!1})],hi.prototype,"hass",void 0),t([mt()],hi.prototype,"_config",void 0),t([mt()],hi.prototype,"_mode",void 0),t([mt()],hi.prototype,"_range",void 0),t([mt()],hi.prototype,"_anchor",void 0),t([mt()],hi.prototype,"_events",void 0),t([mt()],hi.prototype,"_problemsOnly",void 0),t([mt()],hi.prototype,"_filter",void 0),t([mt()],hi.prototype,"_farm",void 0),t([mt()],hi.prototype,"_loading",void 0),t([mt()],hi.prototype,"_error",void 0),!customElements.get("irrigation-calendar-card")){customElements.define("irrigation-calendar-card",hi);const t=window;t.customCards=t.customCards||[],t.customCards.some(t=>"irrigation-calendar-card"===t.type)||t.customCards.push({type:"irrigation-calendar-card",name:"Irrigation Calendar",description:"Planned, ran, missed and unplanned irrigation runs as a day grid, week grid or per-valve timeline."})}const mi=r`
  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 16px 4px;
  }
  .titlebar > ha-icon {
    --mdc-icon-size: 20px;
    color: var(--xt-dim);
  }
  .titlebar .title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .titlebar .title b {
    font-size: 1.1em;
    font-weight: 500;
  }
  .titlebar .title span {
    font-size: 0.85em;
    color: var(--xt-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9em;
    white-space: nowrap;
  }
  .status i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--xt-ok);
  }
  .status.watering {
    font-weight: 500;
  }
  .status.watering i {
    background: var(--xt-water);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
  }
  .status.manual i {
    background: var(--xt-warn);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-warn) 30%, transparent);
  }
  .status.offline i {
    background: var(--xt-off);
  }
  .body {
    padding: 8px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .label {
    font-size: 0.8em;
    color: var(--xt-dim);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    font: inherit;
    font-size: 0.9em;
    color: var(--primary-text-color);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--xt-track);
    border-radius: 18px;
    padding: 5px 14px;
    min-height: 34px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .chip ha-icon {
    --mdc-icon-size: 18px;
  }
  .chip.on {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .chip:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field input,
  .field select {
    font: inherit;
    font-size: 1.05em;
    color: var(--primary-text-color);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--xt-track);
    border-radius: 10px;
    padding: 8px 12px;
    min-height: 40px;
    box-sizing: border-box;
    width: 7em;
  }
  .field input:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  .field .unit {
    color: var(--xt-dim);
  }
  .btn {
    font: inherit;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    min-height: 42px;
    border-radius: 12px;
    border: 1px solid var(--xt-track);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .btn ha-icon {
    --mdc-icon-size: 20px;
  }
  .btn.primary {
    background: var(--xt-water);
    border-color: var(--xt-water);
    color: #fff;
  }
  .btn.warn {
    background: var(--xt-warn);
    border-color: var(--xt-warn);
    color: #fff;
  }
  .btn.danger {
    color: var(--xt-bad);
  }
  .btn.wide {
    width: 100%;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .icon-btn {
    border: none;
    background: none;
    border-radius: 50%;
    padding: 6px;
    display: flex;
    cursor: pointer;
    color: var(--xt-dim);
  }
  .icon-btn:hover:not([disabled]) {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  }
  .dim {
    color: var(--xt-dim);
  }
`;class vi extends dt{setConfig(t){this._config=t}getCardSize(){return 3}_delay(t){const e=this._config?.rain_snow_delay,i=e?this.hass?.states[e]:void 0;if(!e||!i)return;const s=i.attributes,n=Number(s.min??0),a=Number(s.max??7),r=Math.min(a,Math.max(n,Number(i.state)+t*Number(s.step??1)));this.hass.callService("number","set_value",{entity_id:e,value:r})}render(){if(!this._config||!this.hass)return G;const t=this._config.sleep_mode?this.hass.states[this._config.sleep_mode]:void 0,e=this._config.rain_snow_delay?this.hass.states[this._config.rain_snow_delay]:void 0,i=e?Number(e.state):NaN,s=t=>!t||"unavailable"===t.state||"unknown"===t.state;return B`<ha-card>
      <div class="titlebar">
        <ha-icon icon="mdi:cog-outline"></ha-icon>
        <div class="title"><b>Settings</b></div>
      </div>
      <div class="body">
        ${t?B`<div class="setting">
              <ha-icon icon="mdi:sleep"></ha-icon>
              <div class="text">
                <b>Sleep mode</b>
                <!-- DP work_mode (118): what the firmware does with it is undocumented. -->
                <span class="dim" title="Tuya DP work_mode; the same switch as in SmartLife">${"on"===t.state?"On":"Off"} · as in SmartLife</span>
              </div>
              <ha-switch
                .checked=${"on"===t.state}
                ?disabled=${s(t)}
                @change=${()=>this.hass.callService("switch","toggle",{entity_id:this._config.sleep_mode})}
              ></ha-switch>
            </div>`:G}
        ${e?B`<div class="setting">
              <ha-icon icon="mdi:weather-pouring"></ha-icon>
              <div class="text">
                <b>Rain delay</b>
                <span class="dim"
                  >${Number.isFinite(i)&&i>0?`Timers skip the next ${i} day${1===i?"":"s"}`:"Off: pause the timers for a few days after rain"}</span
                >
              </div>
              <div class="stepper">
                <button class="icon-btn" aria-label="One day less" ?disabled=${s(e)||i<=0} @click=${()=>this._delay(-1)}>
                  <ha-icon icon="mdi:minus"></ha-icon>
                </button>
                <b>${Number.isFinite(i)?i:"–"} d</b>
                <button class="icon-btn" aria-label="One day more" ?disabled=${s(e)} @click=${()=>this._delay(1)}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              </div>
            </div>`:G}
      </div>
    </ha-card>`}}vi.styles=[Gt,mi,r`
      .setting {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .setting > ha-icon {
        color: var(--xt-dim);
      }
      .text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .text b {
        font-weight: 500;
      }
      .text span {
        font-size: 0.85em;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 4px;
        font-variant-numeric: tabular-nums;
      }
      .stepper b {
        min-width: 2.5em;
        text-align: center;
        font-weight: 500;
      }
    `],t([ht({attribute:!1})],vi.prototype,"hass",void 0),t([mt()],vi.prototype,"_config",void 0),customElements.get("irrigation-valve-settings-card")||customElements.define("irrigation-valve-settings-card",vi);
