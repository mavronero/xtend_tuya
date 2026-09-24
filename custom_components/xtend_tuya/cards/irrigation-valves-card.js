function t(t,e,s,i){var n,r=arguments.length,o=r<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(o=(r<3?n(o):r>3?n(e,s,o):n(e,s))||o);return r>3&&o&&Object.defineProperty(e,s,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),n=new WeakMap;let r=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&n.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new r(s,t,i)},a=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:u,getPrototypeOf:p}=Object,f=globalThis,_=f.trustedTypes,m=_?_.emptyScript:"",v=f.reactiveElementPolyfillSupport,g=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},y=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&c(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);n?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const t=this.properties,e=[...h(t),...u(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),n=e.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const n=(void 0!==s.converter?.toAttribute?s.converter:$).toAttribute(e,s.type);this._$Em=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=i;const r=n.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){if(void 0!==t){const r=this.constructor;if(!1===i&&(n=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??y)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[g("elementProperties")]=new Map,w[g("finalized")]=new Map,v?.({ReactiveElement:w}),(f.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,A=t=>t,E=x.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+C,M=`<${O}>`,P=document,N=()=>P.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,D="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,L=/>/g,j=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,W=/"/g,I=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),F=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),q=new WeakMap,G=P.createTreeWalker(P,129);function J(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const s=t.length-1,i=[];let n,r=2===e?"<svg>":3===e?"<math>":"",o=H;for(let e=0;e<s;e++){const s=t[e];let a,l,c=-1,d=0;for(;d<s.length&&(o.lastIndex=d,l=o.exec(s),null!==l);)d=o.lastIndex,o===H?"!--"===l[1]?o=R:void 0!==l[1]?o=L:void 0!==l[2]?(I.test(l[2])&&(n=RegExp("</"+l[2],"g")),o=j):void 0!==l[3]&&(o=j):o===j?">"===l[0]?(o=n??H,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?j:'"'===l[3]?W:z):o===W||o===z?o=j:o===R||o===L?o=H:(o=j,n=void 0);const h=o===j&&t[e+1].startsWith("/>")?" ":"";r+=o===H?s+M:c>=0?(i.push(a),s.slice(0,c)+k+s.slice(c)+C+h):s+C+(-2===c?e:h)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Z{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,r=0;const o=t.length-1,a=this.parts,[l,c]=K(t,e);if(this.el=Z.createElement(l,s),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=G.nextNode())&&a.length<o;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(k)){const e=c[r++],s=i.getAttribute(t).split(C),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:o[2],strings:s,ctor:"."===o[1]?et:"?"===o[1]?st:"@"===o[1]?it:tt}),i.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:n}),i.removeAttribute(t));if(I.test(i.tagName)){const t=i.textContent.split(C),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],N()),G.nextNode(),a.push({type:2,index:++n});i.append(t[e],N())}}}else if(8===i.nodeType)if(i.data===O)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=i.data.indexOf(C,t+1));)a.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const s=P.createElement("template");return s.innerHTML=t,s}}function Y(t,e,s=t,i){if(e===F)return e;let n=void 0!==i?s._$Co?.[i]:s._$Cl;const r=T(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=n:s._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,i)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??P).importNode(e,!0);G.currentNode=i;let n=G.nextNode(),r=0,o=0,a=s[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new X(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new nt(n,this,t)),this._$AV.push(e),a=s[++o]}r!==a?.index&&(n=G.nextNode(),r++)}return G.currentNode=P,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),T(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Z.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Q(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new Z(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new X(this.O(N()),this.O(N()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=V}_$AI(t,e=this,s,i){const n=this.strings;let r=!1;if(void 0===n)t=Y(this,t,e,0),r=!T(t)||t!==this._$AH&&t!==F,r&&(this._$AH=t);else{const i=t;let o,a;for(t=n[0],o=0;o<n.length-1;o++)a=Y(this,i[s+o],e,o),a===F&&(a=this._$AH[o]),r||=!T(a)||a!==this._$AH[o],a===V?t=V:t!==V&&(t+=(a??"")+n[o+1]),this._$AH[o]=a}r&&!i&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class st extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class it extends tt{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??V)===F)return;const s=this._$AH,i=t===V&&s!==V||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==V&&(s===V||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(Z,X),(x.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class at extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let n=i._$litPart$;if(void 0===n){const t=s?.renderBefore??null;i._$litPart$=n=new X(e.insertBefore(N(),t),t,void 0,s??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}}at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:y},dt=(t=ct,e,s)=>{const{kind:i,metadata:n}=s;let r=globalThis.litPropertyMetadata.get(n);if(void 0===r&&globalThis.litPropertyMetadata.set(n,r=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),r.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const n=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,n,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const n=this[i];e.call(this,s),this.requestUpdate(i,n,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function ht(t){return(e,s)=>"object"==typeof s?dt(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ut(t){return ht({...t,state:!0,attribute:!1})}async function pt(t){if(!t.callApi)return{};try{const e=await t.callApi("GET","xtend_tuya/valve_locations");return e?.locations??{}}catch{return{}}}const ft="irrigation_timer_registry",_t={start_time:"start_time_sensor",close_time:"end_time_sensor",end_time:"end_time_sensor",watering_mode:"mode_sensor",watering_value:"value_sensor",watering_volume:"volume_sensor",watering_flow_rate:"flow_rate_sensor",battery_level:"battery_level",last_report:"last_report",watering_duration:"duration",rain_snow_delay:"rain_snow_delay",battery:"battery_level",indexed_irrigation_duration:"duration"},mt=[[/_last_watering_start$/,"start_time_sensor"],[/_last_watering_end$/,"end_time_sensor"],[/_watering_flow_rate$/,"flow_rate_sensor"],[/_watering_value$/,"value_sensor"],[/_watering_volume$/,"volume_sensor"],[/_watering_duration$/,"duration"],[/_watering_mode$/,"mode_sensor"],[/_rain_snow_delay$/,"rain_snow_delay"],[/_battery_level$/,"battery_level"]];function vt(t,e,s,i,n,r={}){const o=t.devices[s],a=n.attributes.valve_name??n.attributes.valve_factory_name??o?.name_by_user??o?.name??i,l=n.attributes.valve_factory_name??o?.name??a,c=`${gt}?id=${encodeURIComponent(i)}`;const d={device_id:i,registry_entity:e,valve_name:a,factory_name:l,valve_home:r[i]?.home??r[s]?.home??n.attributes.valve_home??null,valve_room:r[i]?.room??r[s]?.room??n.attributes.valve_room??null,view_path:c},h=(t,e)=>{d[t]||(d[t]=e)};let u;for(const e of Object.values(t.entities)){if(e.device_id!==s)continue;if(!t.states[e.entity_id])continue;if(e.entity_id.startsWith("switch.")&&("valve"===e.translation_key||"indexed_switch"===e.translation_key||e.entity_id.endsWith("_valve"))){d.switch||(d.switch=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&"switch_1"===e.translation_key){u||(u=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&e.entity_id.endsWith("_sleep_mode")){d.sleep_mode=e.entity_id;continue}const i=e.translation_key;if(i){const t=_t[i];if(t){h(t,e.entity_id);continue}}for(const[t,s]of mt)if(t.test(e.entity_id)){h(s,e.entity_id);break}}return!d.switch&&u&&(d.switch=u),d}const gt="valve";const $t={runs:[],planned:[],sites:[],locationOf:{}};let yt=null;function bt(t,e=Date.now()){if(!yt||e-yt.at>6e4){const s=async function(t,e){if(!t.callApi)return $t;const s=t=>encodeURIComponent(new Date(t).toISOString()),[i,n,r]=await Promise.all([t.callApi("GET",`xtend_tuya/runs?since=${s(e-2592e6)}`),t.callApi("GET","xtend_tuya/irrigation_locations"),t.callApi("GET",`calendars/calendar.irrigation_planned?start=${s(e-1728e5)}&end=${s(e+6912e5)}`)]),o={};for(const t of n?.locations??[])for(const e of t.devices??[])null===e.end&&(o[e.device_id]={id:t.id,name:t.name,site_id:t.site_id??null});const a=[];for(const t of r??[]){const e=Date.parse(t.start.dateTime??t.start.date??""),s=Date.parse(t.end.dateTime??t.end.date??"");Number.isFinite(e)&&a.push({key:(t.uid??"").split("#")[0],start:e,end:s>e?s:e+6e4})}return{runs:i?.runs??[],planned:a,sites:n?.sites??[],locationOf:o}}(t,e);yt={at:e,data:s},s.catch(()=>{yt?.data===s&&(yt=null)})}return yt.data}const wt=864e5,xt=864e5,At=/\((\d+)\)\s*$/;function Et(t){if(!t)return null;const e=Number(t.state);return Number.isFinite(e)&&""!==t.state?e:null}function St(t){return!t||"unavailable"===t.state||"unknown"===t.state}function kt(t){const e=new Date(t);return e.setHours(0,0,0,0),e.getTime()}function Ct(t,e,s,i){const n=e[t.registry_entity],r=t.switch?e[t.switch]:void 0,o=St(n)&&St(r),a=!o&&"on"===r?.state,l=s.runs.filter(e=>e.device_id===t.device_id).map(t=>({r:t,start:Date.parse(t.start),end:Date.parse(t.end)})).filter(t=>Number.isFinite(t.start)&&Number.isFinite(t.end)).sort((t,e)=>t.start-e.start),c=l[l.length-1],d=s.planned.filter(e=>e.key===t.registry_entity).sort((t,e)=>t.start-e.start),h=d.find(t=>t.start>i),u=d.filter(t=>t.end>i-wt&&t.end<i).map(e=>({start:e.start,end:e.end,kind:"planned",name:t.valve_name,key:t.device_id})),p=l.filter(t=>t.end>i-wt-xt).map(e=>({start:e.start,end:e.end,kind:"ran",name:t.valve_name,key:t.device_id})),f=function(t,e,s,i=9e5){const n=new Set,r=[];for(const o of[...t].sort((t,e)=>t.start-e.start)){let t=null;for(const s of e){if(n.has(s)||s.key!==o.key)continue;const e=Math.abs(s.start-o.start);e<=i&&(!t||e<Math.abs(t.start-o.start))&&(t=s)}t?(n.add(t),r.push({...t,kind:"running"===t.kind?"running":"ran",planStart:o.start,planEnd:o.end,summary:`${t.summary??""}\nplanned ${o.summary??""}`})):o.end+i<s?r.push({...o,kind:"missed"}):r.push(o)}for(const t of e)n.has(t)||r.push("running"===t.kind?t:{...t,kind:"unplanned"});return r}(u,p,i).filter(t=>"missed"===t.kind).length,_=!!t.volume_sensor,m=kt(i)-5184e5,v=[0,0,0,0,0,0,0];let g=0,$=0,y=0;for(const t of l){if(t.start<m)continue;const e=Math.min(6,Math.floor((kt(t.start)-m)/xt+.5)),s=(t.r.duration_seconds??0)/60,i="number"==typeof t.r.liters?t.r.liters:0;g+=1,$+=i,y+=s,v[e]+=_?i:s}const b=o?null:Et(t.battery_level?e[t.battery_level]:void 0),w=t.last_report?Date.parse(e[t.last_report]?.state??""):NaN,x=c?((t,e)=>({start:e,minutes:(t.duration_seconds??0)/60,liters:"number"==typeof t.liters?t.liters:null}))(c.r,c.start):null,A=[];o||(null!==b&&b<20&&A.push("low_battery"),Number.isFinite(w)&&i-w>1296e5&&A.push("stale"),f>0&&A.push("missed"),_&&x&&0===x.liters&&x.minutes>=1&&A.push("no_flow"));const E=s.locationOf[t.device_id]??null,S=E?.site_id?s.sites.find(t=>t.id===E.site_id)??null:null,k=t=>t?.last_changed?Date.parse(t.last_changed):null;return{device_id:t.device_id,name:t.valve_name,number:At.exec(t.valve_name)?.[1]??null,view_path:t.view_path,status:o?"offline":a?"watering":"idle",since:a?k(r):o?k(n):null,flow_lpm:a?Et(t.flow_rate_sensor?e[t.flow_rate_sensor]:void 0):null,battery:b,has_flow_meter:_,last:x,next:h?{start:h.start,minutes:(h.end-h.start)/6e4,liters:null}:null,week:{runs:g,liters:$,minutes:y,daily:v,unit:_?"L":"min"},missed:f,badges:A,location:E?{id:E.id,name:E.name}:null,site:S?{id:S.id,name:S.name}:null}}const Ot={site:null,status:"all",search:""},Mt={watering:"Watering now",attention:"Needs attention",sites:"Valves",offline:"Offline",unassigned:"Without location"},Pt=["watering","attention","sites","offline","unassigned"];function Nt(t,e){const s=new Map(t.map(t=>[t.id,t])),i=[];for(let t=s.get(e);t&&i.length<20;t=t.parent_id?s.get(t.parent_id):void 0)i.unshift(t.name);return i.join(" › ")}function Tt(t){return"offline"!==t.status&&t.badges.length>0}function Ut(t,e,s){const i=e.site?function(t,e){const s=new Set([e]);for(let e=!0;e;){e=!1;for(const i of t)i.parent_id&&s.has(i.parent_id)&&!s.has(i.id)&&(s.add(i.id),e=!0)}return s}(s,e.site):null,n=e.search.trim().toLowerCase();return t.filter(t=>(!i||null!==t.site&&i.has(t.site.id))&&("all"===e.status||"watering"===e.status&&"watering"===t.status||"offline"===e.status&&"offline"===t.status||"attention"===e.status&&Tt(t))&&(!n||t.name.toLowerCase().includes(n)||(t.location?.name.toLowerCase().includes(n)??!1)||(t.site?.name.toLowerCase().includes(n)??!1)))}const Dt=[["all","All"],["watering","Watering"],["attention","Attention"],["offline","Offline"]];class Ht extends at{constructor(){super(...arguments),this.sites=[],this.value=Ot,this.counts={}}_set(t){this.value={...this.value,...t},this.dispatchEvent(new CustomEvent("xt-filter-changed",{detail:this.value,bubbles:!0,composed:!0}))}render(){const t=[...this.sites].map(t=>({id:t.id,path:Nt(this.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path));return B`
      <select
        aria-label="Site"
        .value=${this.value.site??""}
        @change=${t=>this._set({site:t.target.value||null})}
      >
        <option value="">All sites</option>
        ${t.map(t=>B`<option value=${t.id} ?selected=${t.id===this.value.site}>${t.path}</option>`)}
      </select>
      <div class="chips" role="group" aria-label="Status">
        ${Dt.map(([t,e])=>B`<button
            class=${this.value.status===t?"on":""}
            aria-pressed=${this.value.status===t}
            @click=${()=>this._set({status:t})}
          >
            ${e}${void 0!==this.counts[t]?B` <span>${this.counts[t]}</span>`:""}
          </button>`)}
      </div>
      <input
        type="search"
        placeholder="Search valve, location, site"
        aria-label="Search"
        .value=${this.value.search}
        @input=${t=>this._set({search:t.target.value})}
      />
    `}}Ht.styles=o`
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
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 18px;
      padding: 6px 12px;
      min-height: 36px;
      box-sizing: border-box;
    }
    input {
      flex: 1;
      min-width: 180px;
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
  `,t([ht({attribute:!1})],Ht.prototype,"sites",void 0),t([ht({attribute:!1})],Ht.prototype,"value",void 0),t([ht({attribute:!1})],Ht.prototype,"counts",void 0),customElements.get("xt-valve-filter-bar")||customElements.define("xt-valve-filter-bar",Ht);const Rt={low_battery:"Low battery",stale:"No report 36 h",missed:"Missed",no_flow:"No water flow"},Lt={low_battery:"Battery below 20 %",stale:"The valve has not reported for more than 36 hours",missed:"A planned run in the last 24 hours did not happen",no_flow:"The last run measured no water"};const jt=864e5;function zt(t,e=Date.now()){const s=new Date(t),i=new Date(e);i.setHours(0,0,0,0);const n=Math.floor((s.getTime()-i.getTime())/jt);return 0===n?"Today":-1===n?"Yesterday":1===n?"Tomorrow":s.toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"})}function Wt(t){return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function It(t){const e=[`${zt(t.start)} ${Wt(t.start)}`,`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}function Bt(t){return(t.number?t.name.replace(/\s*\(\d+\)\s*$/,""):t.name)||t.name}class Ft extends at{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:this.summary.view_path,bubbles:!0,composed:!0}))}_status(t){if("watering"===t.status){const e=null!==t.flow_lpm?` · ${t.flow_lpm.toFixed(1)} L/min`:"";return B`<span class="status watering" title="Watering now"><i></i>Watering${t.since?` since ${Wt(t.since)}`:""}${e}</span>`}return"offline"===t.status?B`<span class="status offline" title="Not reachable"><i></i>Offline${t.since?` for ${function(t,e=Date.now()){const s=Math.round((e-t)/6e4);if(s<60)return`${s} min`;const i=Math.round(s/60);return i<48?`${i} h`:`${Math.round(i/24)} d`}(t.since)}`:""}</span>`:B`<span class="status idle" title="Online, not watering"><i></i>Idle</span>`}_week(t){const e=Math.max(...t.week.daily,0),s=t.week.unit,i="L"===s?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`,n=new Date;n.setHours(12,0,0,0);return B`<div class="week">
      <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
      <div class="bars">
        ${t.week.daily.map((t,i)=>B`<span
              title="${(t=>new Date(n.getTime()-(6-t)*jt).toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"}))(i)}: ${Math.round(t)} ${s}"
              style="height:${e>0?Math.max(8,t/e*100):8}%"
              class=${t>0?"on":""}
            ></span>`)}
      </div>
      <span class="dim" title="Last 7 days: number of runs and total ${"L"===s?"water":"watering time"}"
        >${t.week.runs} runs · ${i}</span
      >
    </div>`}render(){const t=this.summary;if(!t)return V;const e=t.location&&t.location.name!==Bt(t)?t.location.name:null,s=t.location?[e,t.site?.name].filter(Boolean).join(" · "):"No location";return B`<ha-card class=${t.status} @click=${this._open} tabindex="0" role="link" aria-label=${t.name}>
      <div class="head">
        <span class="name" title=${t.name}>${Bt(t)}</span>
        ${t.number?B`<span class="num" title="Valve number">#${t.number}</span>`:V}
        ${null!==t.battery?B`<span class="battery ${t.badges.includes("low_battery")?"low":""}" title="Battery ${Math.round(t.battery)} %"
              ><ha-icon icon=${i=t.battery,i>=95?"mdi:battery":i<10?"mdi:battery-outline":"mdi:battery-"+10*Math.floor(i/10)}></ha-icon>${Math.round(t.battery)} %</span
            >`:V}
      </div>
      ${s?B`<div class="place dim" title="Metering point · site">
            <ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${s}</span>
          </div>`:V}
      ${this._status(t)}
      <dl>
        <dt title="Last run"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run: start · duration${t.has_flow_meter?" · water":""}">${t.last?It(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?It(t.next):"–"}</dd>
      </dl>
      ${this._week(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>B`<span class="badge ${e}" title=${Lt[e]}>${Rt[e]}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`)}
          </div>`:V}
    </ha-card>`;var i}}Ft.styles=o`
    :host {
      display: block;
      --xt-water: var(--state-switch-active-color, #f9a825);
      --xt-dim: var(--secondary-text-color, #727272);
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
      color: var(--error-color, #db4437);
    }
    .battery.low {
      color: var(--error-color, #db4437);
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
      background: var(--success-color, #4caf50);
    }
    .status.watering {
      font-weight: 500;
    }
    .status.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    .status.offline i {
      background: var(--disabled-text-color, #bdbdbd);
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
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 22px;
      width: 70px;
      flex: none;
    }
    .bars span {
      flex: 1;
      border-radius: 2px;
      background: var(--divider-color, #e0e0e0);
    }
    .bars span.on {
      background: var(--xt-water);
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
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
      color: var(--primary-text-color);
    }
    .badge.missed,
    .badge.no_flow {
      background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent);
    }
  `,t([ht({attribute:!1})],Ft.prototype,"summary",void 0),customElements.get("xt-valve-card")||customElements.define("xt-valve-card",Ft);class Vt extends at{constructor(){super(...arguments),this.collapsed=!1}render(){const t=this.section;return t?B`
      <button class="title" @click=${()=>this.collapsed=!this.collapsed} aria-expanded=${!this.collapsed}>
        <span>${t.title}</span><span class="count">${t.count}</span>
        <ha-icon icon=${this.collapsed?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
      </button>
      ${this.collapsed?V:t.groups.map(t=>B`
              ${t.title?B`<div class="group">${t.title} <span class="count">${t.valves.length}</span></div>`:V}
              <div class="grid">${t.valves.map(t=>B`<xt-valve-card .summary=${t}></xt-valve-card>`)}</div>
            `)}
    `:V}}Vt.styles=o`
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
      color: var(--secondary-text-color);
    }
    .count {
      color: var(--secondary-text-color);
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
  `,t([ht({attribute:!1})],Vt.prototype,"section",void 0),t([ht({type:Boolean,reflect:!0})],Vt.prototype,"collapsed",void 0),customElements.get("xt-valve-section")||customElements.define("xt-valve-section",Vt);const qt="xt-valves-filter";class Gt extends at{constructor(){super(...arguments),this._data=$t,this._filter=function(){try{return{...Ot,...JSON.parse(localStorage.getItem(qt)??"{}")}}catch{return Ot}}(),this._error=null,this._valves=[],this._valvesAt=0}setConfig(t){this._config=t}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>{this._refresh()},6e4),this._refresh()}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}updated(t){t.has("hass")&&!t.get("hass")&&this.hass&&this._refresh()}async _refresh(){const t=this.hass;if(t)try{const[e,s]=await Promise.all([bt(t),pt(t)]);this._valves=function(t,e={}){const s=new Set;for(const e of Object.values(t.entities))e.translation_key===ft&&s.add(e.entity_id);for(const e of Object.keys(t.states))e.startsWith("sensor.")&&(e.endsWith(ft)||e.endsWith("_time_task_registry"))&&s.add(e);const i=[];for(const n of s){const s=t.states[n],r=t.entities[n];if(!s||!r||!r.device_id)continue;const o=s.attributes.device_id??r.device_id,a=vt(t,n,r.device_id,o,s,e);a&&i.push(a)}return i.sort((t,e)=>t.valve_name.localeCompare(e.valve_name)),i}(t,s),this._valvesAt=Date.now(),this._data=e,this._error=null}catch(t){this._error=t instanceof Error?t.message:String(t)}}_onFilter(t){this._filter=t.detail,function(t){try{localStorage.setItem(qt,JSON.stringify(t))}catch{}}(t.detail)}_onOpen(t){const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",`/${e}/${t.detail}`),window.dispatchEvent(new Event("location-changed"))}render(){if(!this._config||!this.hass)return V;if(!this._valvesAt)return B`<ha-card><div class="msg">Loading valves…</div></ha-card>`;const t=Date.now(),e=this._valves.map(e=>Ct(e,this.hass.states,this._data,t)),s=this._config.site??null,i={...this._filter,site:s??this._filter.site},n=Ut(e,{...i,status:"all"},this._data.sites),r={};for(const t of["all","watering","attention","offline"])r[t]="all"===t?n.length:Ut(n,{...Ot,status:t},this._data.sites).length;const o=function(t,e,s=Pt){const i=(t,e)=>t.name.localeCompare(e.name),n=(t,e)=>({key:t,title:Mt[t],groups:[{site:null,title:"",valves:[...e].sort(i)}],count:e.length}),r=t.filter(t=>"offline"!==t.status),o=r.filter(t=>t.location),a=new Map;for(const t of o){const e=t.site?.id??null;a.set(e,[...a.get(e)??[],t])}const l=[...a.entries()].map(([t,s])=>({site:t,title:t?Nt(e,t):"No site",valves:s.sort(i)})).sort((t,e)=>null===t.site?1:null===e.site?-1:t.title.localeCompare(e.title)),c={watering:n("watering",r.filter(t=>"watering"===t.status)),attention:n("attention",r.filter(Tt)),sites:{key:"sites",title:Mt.sites,groups:l,count:o.length},offline:n("offline",t.filter(t=>"offline"===t.status)),unassigned:n("unassigned",r.filter(t=>!t.location))};return s.map(t=>c[t]).filter(t=>t.count>0)}(Ut(n,{...Ot,status:i.status},this._data.sites),this._data.sites,this._config.sections??Pt),a=new Set(this._config.collapsed??["offline"]);return B`
      <div @xt-valve-open=${this._onOpen}>
        ${!1===this._config.filter?V:B`<xt-valve-filter-bar
              .sites=${s?[]:this._data.sites}
              .value=${i}
              .counts=${r}
              @xt-filter-changed=${this._onFilter}
            ></xt-valve-filter-bar>`}
        ${this._error?B`<div class="msg err">Could not load farm data: ${this._error}</div>`:V}
        ${o.length?o.map(t=>B`<xt-valve-section .section=${t} ?collapsed=${a.has(t.key)}></xt-valve-section>`):B`<div class="msg">No valves match the filter.</div>`}
      </div>
    `}}Gt.styles=o`
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
  `,t([ht({attribute:!1})],Gt.prototype,"hass",void 0),t([ut()],Gt.prototype,"_config",void 0),t([ut()],Gt.prototype,"_data",void 0),t([ut()],Gt.prototype,"_filter",void 0),t([ut()],Gt.prototype,"_error",void 0),t([ut()],Gt.prototype,"_valves",void 0),t([ut()],Gt.prototype,"_valvesAt",void 0),customElements.get("irrigation-valves-card")||customElements.define("irrigation-valves-card",Gt);export{Gt as IrrigationValvesCard};
