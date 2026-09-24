function t(t,e,i,s){var n,a=arguments.length,r=a<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(n=t[o])&&(r=(a<3?n(r):a>3?n(e,i,r):n(e,i))||r);return a>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,m=globalThis,v=m.trustedTypes,f=v?v.emptyScript:"",g=m.reactiveElementPolyfillSupport,_=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},x=(t,e)=>!l(t,e),$={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let y=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...p(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??x)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[_("elementProperties")]=new Map,y[_("finalized")]=new Map,g?.({ReactiveElement:y}),(m.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,k=t=>t,A=w.trustedTypes,E=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,N=`<${M}>`,L=document,P=()=>L.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,z="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,U=/-->/g,H=/>/g,R=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,W=/"/g,I=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),F=new WeakMap,G=L.createTreeWalker(L,129);function J(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",r=D;for(let e=0;e<i;e++){const i=t[e];let o,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===D?"!--"===l[1]?r=U:void 0!==l[1]?r=H:void 0!==l[2]?(I.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=R):void 0!==l[3]&&(r=R):r===R?">"===l[0]?(r=n??D,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?R:'"'===l[3]?W:j):r===W||r===j?r=R:r===U||r===H?r=D:(r=R,n=void 0);const p=r===R&&t[e+1].startsWith("/>")?" ":"";a+=r===D?i+N:d>=0?(s.push(o),i.slice(0,d)+S+i.slice(d)+C+p):i+C+(-2===d?e:p)}return[J(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const r=t.length-1,o=this.parts,[l,d]=K(t,e);if(this.el=Z.createElement(l,i),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=G.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=d[a++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],P()),G.nextNode(),o.push({type:2,index:++n});s.append(t[e],P())}}}else if(8===s.nodeType)if(s.data===M)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)o.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=L.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=O(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??L).importNode(e,!0);G.currentNode=s;let n=G.nextNode(),a=0,r=0,o=i[0];for(;void 0!==o;){if(a===o.index){let e;2===o.type?e=new X(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new nt(n,this,t)),this._$AV.push(e),o=i[++r]}a!==o?.index&&(n=G.nextNode(),a++)}return G.currentNode=L,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),O(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(L.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Z(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(P()),this.O(P()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=Y(this,t,e,0),a=!O(t)||t!==this._$AH&&t!==V,a&&(this._$AH=t);else{const s=t;let r,o;for(t=n[0],r=0;r<n.length-1;r++)o=Y(this,s[i+r],e,r),o===V&&(o=this._$AH[r]),a||=!O(o)||o!==this._$AH[r],o===q?t=q:t!==q&&(t+=(o??"")+n[r+1]),this._$AH[r]=o}a&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??q)===V)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const at=w.litHtmlPolyfillSupport;at?.(Z,X),(w.litHtmlVersions??=[]).push("3.3.2");const rt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ot extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(P(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}ot._$litElement$=!0,ot.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ot});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:ot}),(rt.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:x},ct=(t=dt,e,i)=>{const{kind:s,metadata:n}=i;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),a.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ct(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ht(t){return pt({...t,state:!0,attribute:!1})}async function ut(t){if(!t.callApi)return{};try{const e=await t.callApi("GET","xtend_tuya/valve_locations");return e?.locations??{}}catch{return{}}}const mt="irrigation_timer_registry",vt={start_time:"start_time_sensor",close_time:"end_time_sensor",end_time:"end_time_sensor",watering_mode:"mode_sensor",watering_value:"value_sensor",watering_volume:"volume_sensor",watering_flow_rate:"flow_rate_sensor",battery_level:"battery_level",last_report:"last_report",watering_duration:"duration",rain_snow_delay:"rain_snow_delay",battery:"battery_level",indexed_irrigation_duration:"duration"},ft=[[/_last_watering_start$/,"start_time_sensor"],[/_last_watering_end$/,"end_time_sensor"],[/_watering_flow_rate$/,"flow_rate_sensor"],[/_watering_value$/,"value_sensor"],[/_watering_volume$/,"volume_sensor"],[/_watering_duration$/,"duration"],[/_watering_mode$/,"mode_sensor"],[/_rain_snow_delay$/,"rain_snow_delay"],[/_battery_level$/,"battery_level"]];function gt(t,e,i,s,n,a={}){const r=t.devices[i],o=n.attributes.valve_name??n.attributes.valve_factory_name??r?.name_by_user??r?.name??s,l=n.attributes.valve_factory_name??r?.name??o,d=`${_t}?id=${encodeURIComponent(s)}`;const c={device_id:s,registry_entity:e,valve_name:o,factory_name:l,valve_home:a[s]?.home??a[i]?.home??n.attributes.valve_home??null,valve_room:a[s]?.room??a[i]?.room??n.attributes.valve_room??null,view_path:d},p=(t,e)=>{c[t]||(c[t]=e)};let h;for(const e of Object.values(t.entities)){if(e.device_id!==i)continue;if(!t.states[e.entity_id])continue;if(e.entity_id.startsWith("switch.")&&("valve"===e.translation_key||"indexed_switch"===e.translation_key||e.entity_id.endsWith("_valve"))){c.switch||(c.switch=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&"switch_1"===e.translation_key){h||(h=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&e.entity_id.endsWith("_sleep_mode")){c.sleep_mode=e.entity_id;continue}const s=e.translation_key;if(s){const t=vt[s];if(t){p(t,e.entity_id);continue}}for(const[t,i]of ft)if(t.test(e.entity_id)){p(i,e.entity_id);break}}return!c.switch&&h&&(c.switch=h),c}const _t="valve";const bt={runs:[],planned:[],sites:[],locations:[],locationOf:{},pumps:[],pumpAssignments:[]};let xt=null;function $t(t,e=Date.now()){if(!xt||e-xt.at>6e4){const i=async function(t,e){if(!t.callApi)return bt;const i=t=>encodeURIComponent(new Date(t).toISOString()),[s,n,a]=await Promise.all([t.callApi("GET",`xtend_tuya/runs?since=${i(e-2592e6)}`),t.callApi("GET","xtend_tuya/irrigation_locations"),t.callApi("GET",`calendars/calendar.irrigation_planned?start=${i(e-1728e5)}&end=${i(e+6912e5)}`)]),r=t=>t?Date.parse(t):null,o=new Map((n?.sites??[]).map(t=>[t.id,t.name])),l=[],d={};for(const t of n?.locations??[]){const e=t.devices??[],i=t.pump?{name:t.pump.name,via:t.pump.inherited_from?o.get(t.pump.inherited_from)??null:null}:null,s={id:t.id,name:t.name,site_id:t.site_id??null,valves:e.filter(t=>null===t.end).map(t=>t.device_id),assignments:e.map(t=>({device_id:t.device_id,begin:r(t.begin),end:r(t.end)})),expected_lpm:t.expected_lpm??null,description:t.description??"",pump:i};l.push(s);for(const t of s.valves)d[t]=s}const c=[];for(const t of a??[]){const e=Date.parse(t.start.dateTime??t.start.date??""),i=Date.parse(t.end.dateTime??t.end.date??"");Number.isFinite(e)&&c.push({key:(t.uid??"").split("#")[0],start:e,end:i>e?i:e+6e4})}return{runs:s?.runs??[],planned:c,sites:n?.sites??[],locations:l,locationOf:d,pumps:n?.pumps??[],pumpAssignments:n?.pump_assignments??[]}}(t,e);xt={at:e,data:i},i.catch(()=>{xt?.data===i&&(xt=null)})}return xt.data}const yt=864e5,wt=864e5,kt=/\((\d+)\)\s*$/;function At(t){if(!t)return null;const e=Number(t.state);return Number.isFinite(e)&&""!==t.state?e:null}function Et(t){return!t||"unavailable"===t.state||"unknown"===t.state}function St(t){const e=new Date(t);return e.setHours(0,0,0,0),e.getTime()}function Ct(t,e,i){const s=St(e)-5184e5,n={runs:0,liters:0,minutes:0,daily:[0,0,0,0,0,0,0],unit:i?"L":"min"};for(const e of t){if(e.start<s)continue;const t=Math.min(6,Math.round((St(e.start)-s)/wt));n.runs+=1,n.liters+=e.liters??0,n.minutes+=e.minutes,n.daily[t]+=i?e.liters??0:e.minutes}return n}function Mt(t,e,i,s){const n=e[t.registry_entity],a=t.switch?e[t.switch]:void 0,r=Et(n)&&Et(a),o=!r&&"on"===a?.state,l=i.runs.filter(e=>e.device_id===t.device_id).map(t=>({r:t,start:Date.parse(t.start),end:Date.parse(t.end)})).filter(t=>Number.isFinite(t.start)&&Number.isFinite(t.end)).sort((t,e)=>t.start-e.start),d=(t,e)=>({start:e,minutes:(t.duration_seconds??0)/60,liters:"number"==typeof t.liters?t.liters:null}),c=l[l.length-1],p=i.planned.filter(e=>e.key===t.registry_entity).sort((t,e)=>t.start-e.start),h=p.find(t=>t.start>s),u=p.filter(t=>t.end>s-yt&&t.end<s).map(e=>({start:e.start,end:e.end,kind:"planned",name:t.valve_name,key:t.device_id})),m=l.filter(t=>t.end>s-yt-wt).map(e=>({start:e.start,end:e.end,kind:"ran",name:t.valve_name,key:t.device_id})),v=function(t,e,i,s=9e5){const n=new Set,a=[];for(const r of[...t].sort((t,e)=>t.start-e.start)){let t=null;for(const i of e){if(n.has(i)||i.key!==r.key)continue;const e=Math.abs(i.start-r.start);e<=s&&(!t||e<Math.abs(t.start-r.start))&&(t=i)}t?(n.add(t),a.push({...t,kind:"running"===t.kind?"running":"ran",planStart:r.start,planEnd:r.end,summary:`${t.summary??""}\nplanned ${r.summary??""}`})):r.end+s<i?a.push({...r,kind:"missed"}):a.push(r)}for(const t of e)n.has(t)||a.push("running"===t.kind?t:{...t,kind:"unplanned"});return a}(u,m,s).filter(t=>"missed"===t.kind).length,f=!!t.volume_sensor,g=r?null:At(t.battery_level?e[t.battery_level]:void 0),_=t.last_report?Date.parse(e[t.last_report]?.state??""):NaN,b=c?d(c.r,c.start):null,x=[];r||(null!==g&&g<20&&x.push("low_battery"),Number.isFinite(_)&&s-_>1296e5&&x.push("stale"),v>0&&x.push("missed"),f&&b&&0===b.liters&&b.minutes>=1&&x.push("no_flow"));const $=i.locationOf[t.device_id]??null,y=$?.site_id?i.sites.find(t=>t.id===$.site_id)??null:null,w=t=>t?.last_changed?Date.parse(t.last_changed):null;return{device_id:t.device_id,name:t.valve_name,number:kt.exec(t.valve_name)?.[1]??null,view_path:t.view_path,status:r?"offline":o?"watering":"idle",since:o?w(a):r?w(n):null,flow_lpm:o?At(t.flow_rate_sensor?e[t.flow_rate_sensor]:void 0):null,battery:g,has_flow_meter:f,last:b,next:h?{start:h.start,minutes:(h.end-h.start)/6e4,liters:null}:null,week:Ct(l.map(t=>d(t.r,t.start)),s,f),missed:v,badges:x,location:$?{id:$.id,name:$.name}:null,site:y?{id:y.id,name:y.name}:null}}class Nt{constructor(t){this.valves=[],this.data=bt,this.loaded=!1,this.error=null,this.busy=!1,this.host=t,t.addController(this)}hostConnected(){this.timer=window.setInterval(()=>{this.refresh()},6e4)}hostDisconnected(){this.timer&&window.clearInterval(this.timer)}hostUpdated(){this.loaded||this.busy||!this.host.hass||this.refresh()}async refresh(t=!1){const e=this.host.hass;if(e&&!this.busy){t&&(xt=null),this.busy=!0;try{const[t,i]=await Promise.all([$t(e),ut(e)]);this.valves=function(t,e={}){const i=new Set;for(const e of Object.values(t.entities))e.translation_key===mt&&i.add(e.entity_id);for(const e of Object.keys(t.states))e.startsWith("sensor.")&&(e.endsWith(mt)||e.endsWith("_time_task_registry"))&&i.add(e);const s=[];for(const n of i){const i=t.states[n],a=t.entities[n];if(!i||!a||!a.device_id)continue;const r=i.attributes.device_id??a.device_id,o=gt(t,n,a.device_id,r,i,e);o&&s.push(o)}return s.sort((t,e)=>t.valve_name.localeCompare(e.valve_name)),s}(e,i),this.data=t,this.error=null}catch(t){this.error=t instanceof Error?t.message:String(t)}finally{this.busy=!1,this.loaded=!0,this.host.requestUpdate()}}}summaries(){const t=this.host.hass;if(!t)return[];const e=Date.now();return this.valves.map(i=>Mt(i,t.states,this.data,e))}}const Lt={site:null,status:"all",search:""},Pt={watering:"Watering now",attention:"Needs attention",sites:"Valves",offline:"Offline",unassigned:"Without location"},Ot=["watering","attention","sites","offline","unassigned"];function Tt(t,e){const i=new Set([e]);for(let e=!0;e;){e=!1;for(const s of t)s.parent_id&&i.has(s.parent_id)&&!i.has(s.id)&&(i.add(s.id),e=!0)}return i}function zt(t,e){const i=new Map(t.map(t=>[t.id,t])),s=[];for(let t=i.get(e);t&&s.length<20;t=t.parent_id?i.get(t.parent_id):void 0)s.unshift(t.name);return s.join(" › ")}function Dt(t){return"offline"!==t.status&&t.badges.length>0}function Ut(t,e,i){const s=e.site?Tt(i,e.site):null,n=e.search.trim().toLowerCase();return t.filter(t=>(!s||null!==t.site&&s.has(t.site.id))&&("all"===e.status||"watering"===e.status&&"watering"===t.status||"offline"===e.status&&"offline"===t.status||"attention"===e.status&&Dt(t))&&(!n||t.name.toLowerCase().includes(n)||(t.location?.name.toLowerCase().includes(n)??!1)||(t.site?.name.toLowerCase().includes(n)??!1)))}function Ht(t){const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",t.startsWith("/")?t:`/${e}/${t}`),window.dispatchEvent(new Event("location-changed"))}const Rt=r`
  :host {
    --xt-water: var(--blue-color, #1e88e5);
    --xt-dim: var(--secondary-text-color, #727272);
    --xt-ok: var(--success-color, #4caf50);
    --xt-off: var(--disabled-text-color, #bdbdbd);
    --xt-warn: var(--warning-color, #ffa600);
    --xt-bad: var(--error-color, #db4437);
    --xt-track: var(--divider-color, #e0e0e0);
  }
`,jt=[["all","All"],["watering","Watering"],["attention","Attention"],["offline","Offline"]];class Wt extends ot{constructor(){super(...arguments),this.sites=[],this.value=Lt,this.counts={}}_set(t){this.value={...this.value,...t},this.dispatchEvent(new CustomEvent("xt-filter-changed",{detail:this.value,bubbles:!0,composed:!0}))}render(){const t=[...this.sites].map(t=>({id:t.id,path:zt(this.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path));return B`
      <select
        aria-label="Site"
        .value=${this.value.site??""}
        @change=${t=>this._set({site:t.target.value||null})}
      >
        <option value="">All sites</option>
        ${t.map(t=>B`<option value=${t.id} ?selected=${t.id===this.value.site}>${t.path}</option>`)}
      </select>
      <div class="chips" role="group" aria-label="Status">
        ${jt.map(([t,e])=>B`<button
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
    `}}Wt.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],Wt.prototype,"sites",void 0),t([pt({attribute:!1})],Wt.prototype,"value",void 0),t([pt({attribute:!1})],Wt.prototype,"counts",void 0),customElements.get("xt-valve-filter-bar")||customElements.define("xt-valve-filter-bar",Wt);const It=864e5;function Bt(t){return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Vt(t){return`${function(t,e=Date.now()){const i=new Date(t),s=new Date(e);s.setHours(0,0,0,0);const n=Math.floor((i.getTime()-s.getTime())/It);return 0===n?"Today":-1===n?"Yesterday":1===n?"Tomorrow":i.toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"})}(t)} ${Bt(t)}`}function qt(t){return`${Math.round(t).toLocaleString()} L`}function Ft(t){return t>=95?"mdi:battery":t<10?"mdi:battery-outline":"mdi:battery-"+10*Math.floor(t/10)}class Gt extends ot{constructor(){super(...arguments),this.daily=[],this.unit="L"}render(){const t=Math.max(...this.daily,0),e=new Date;e.setHours(12,0,0,0);const i=this.daily.length;return this.daily.map((s,n)=>B`<span
          title="${(t=>new Date(e.getTime()-(i-1-t)*It).toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"}))(n)}: ${Math.round(s).toLocaleString()} ${this.unit}"
          style="height:${t>0?Math.max(8,s/t*100):8}%"
          class=${s>0?"on":""}
        ></span>`)}}Gt.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],Gt.prototype,"daily",void 0),t([pt()],Gt.prototype,"unit",void 0),customElements.get("xt-week-bars")||customElements.define("xt-week-bars",Gt);const Jt={low_battery:"Low battery",stale:"No report 36 h",missed:"Missed",no_flow:"No water flow"},Kt={low_battery:"Battery below 20 %",stale:"The valve has not reported for more than 36 hours",missed:"A planned run in the last 24 hours did not happen",no_flow:"The last run measured no water"};function Zt(t){const e=[Vt(t.start),`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}function Yt(t){return(t.number?t.name.replace(/\s*\(\d+\)\s*$/,""):t.name)||t.name}class Qt extends ot{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:this.summary.view_path,bubbles:!0,composed:!0}))}_status(t){if("watering"===t.status){const e=null!==t.flow_lpm?` · ${t.flow_lpm.toFixed(1)} L/min`:"";return B`<span class="status watering" title="Watering now"><i></i>Watering${t.since?` since ${Bt(t.since)}`:""}${e}</span>`}return"offline"===t.status?B`<span class="status offline" title="Not reachable"><i></i>Offline${t.since?` for ${function(t,e=Date.now()){const i=Math.round((e-t)/6e4);if(i<60)return`${i} min`;const s=Math.round(i/60);return s<48?`${s} h`:`${Math.round(s/24)} d`}(t.since)}`:""}</span>`:B`<span class="status idle" title="Online, not watering"><i></i>Idle</span>`}_week(t){const e=t.week.unit,i="L"===e?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`;return B`<div class="week">
      <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
      <xt-week-bars .daily=${t.week.daily} unit=${e}></xt-week-bars>
      <span class="dim" title="Last 7 days: number of runs and total ${"L"===e?"water":"watering time"}"
        >${t.week.runs} runs · ${i}</span
      >
    </div>`}render(){const t=this.summary;if(!t)return q;const e=t.location&&t.location.name!==Yt(t)?t.location.name:null,i=t.location?[e,t.site?.name].filter(Boolean).join(" · "):"No location";return B`<ha-card class=${t.status} @click=${this._open} tabindex="0" role="link" aria-label=${t.name}>
      <div class="head">
        <span class="name" title=${t.name}>${Yt(t)}</span>
        ${t.number?B`<span class="num" title="Valve number">#${t.number}</span>`:q}
        ${null!==t.battery?B`<span class="battery ${t.badges.includes("low_battery")?"low":""}" title="Battery ${Math.round(t.battery)} %"
              ><ha-icon icon=${Ft(t.battery)}></ha-icon>${Math.round(t.battery)} %</span
            >`:q}
      </div>
      ${i?B`<div class="place dim" title="Metering point · site">
            <ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${i}</span>
          </div>`:q}
      ${this._status(t)}
      <dl>
        <dt title="Last run"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run: start · duration${t.has_flow_meter?" · water":""}">${t.last?Zt(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?Zt(t.next):"–"}</dd>
      </dl>
      ${this._week(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>B`<span class="badge ${e}" title=${Kt[e]}>${Jt[e]}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`)}
          </div>`:q}
    </ha-card>`}}Qt.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],Qt.prototype,"summary",void 0),customElements.get("xt-valve-card")||customElements.define("xt-valve-card",Qt);class Xt extends ot{constructor(){super(...arguments),this.collapsed=!1}render(){const t=this.section;return t?B`
      <button class="title" @click=${()=>this.collapsed=!this.collapsed} aria-expanded=${!this.collapsed}>
        <span>${t.title}</span><span class="count">${t.count}</span>
        <ha-icon icon=${this.collapsed?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
      </button>
      ${this.collapsed?q:t.groups.map(t=>B`
              ${t.title?B`<div class="group">${t.title} <span class="count">${t.valves.length}</span></div>`:q}
              <div class="grid">${t.valves.map(t=>B`<xt-valve-card .summary=${t}></xt-valve-card>`)}</div>
            `)}
    `:q}}Xt.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],Xt.prototype,"section",void 0),t([pt({type:Boolean,reflect:!0})],Xt.prototype,"collapsed",void 0),customElements.get("xt-valve-section")||customElements.define("xt-valve-section",Xt);const te="xt-valves-filter";class ee extends ot{constructor(){super(...arguments),this._filter=function(){try{return{...Lt,...JSON.parse(localStorage.getItem(te)??"{}")}}catch{return Lt}}(),this._farm=new Nt(this)}setConfig(t){this._config=t}getCardSize(){return 12}_onFilter(t){this._filter=t.detail,function(t){try{localStorage.setItem(te,JSON.stringify(t))}catch{}}(t.detail)}_onOpen(t){Ht(t.detail)}render(){if(!this._config||!this.hass)return q;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading valves…</div></ha-card>`;const t=this._farm.summaries(),e=this._farm.data,i=this._config.site??null,s={...this._filter,site:i??this._filter.site},n=Ut(t,{...s,status:"all"},e.sites),a={};for(const t of["all","watering","attention","offline"])a[t]="all"===t?n.length:Ut(n,{...Lt,status:t},e.sites).length;const r=function(t,e,i=Ot){const s=(t,e)=>t.name.localeCompare(e.name),n=(t,e)=>({key:t,title:Pt[t],groups:[{site:null,title:"",valves:[...e].sort(s)}],count:e.length}),a=t.filter(t=>"offline"!==t.status),r=a.filter(t=>t.location),o=new Map;for(const t of r){const e=t.site?.id??null;o.set(e,[...o.get(e)??[],t])}const l=[...o.entries()].map(([t,i])=>({site:t,title:t?zt(e,t):"No site",valves:i.sort(s)})).sort((t,e)=>null===t.site?1:null===e.site?-1:t.title.localeCompare(e.title)),d={watering:n("watering",a.filter(t=>"watering"===t.status)),attention:n("attention",a.filter(Dt)),sites:{key:"sites",title:Pt.sites,groups:l,count:r.length},offline:n("offline",t.filter(t=>"offline"===t.status)),unassigned:n("unassigned",a.filter(t=>!t.location))};return i.map(t=>d[t]).filter(t=>t.count>0)}(Ut(n,{...Lt,status:s.status},e.sites),e.sites,this._config.sections??Ot),o=new Set(this._config.collapsed??["offline"]);return B`
      <div @xt-valve-open=${this._onOpen}>
        ${!1===this._config.filter?q:B`<xt-valve-filter-bar
              .sites=${i?[]:e.sites}
              .value=${s}
              .counts=${a}
              @xt-filter-changed=${this._onFilter}
            ></xt-valve-filter-bar>`}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:q}
        ${r.length?r.map(t=>B`<xt-valve-section .section=${t} ?collapsed=${o.has(t.key)}></xt-valve-section>`):B`<div class="msg">No valves match the filter.</div>`}
      </div>
    `}}ee.styles=r`
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
  `,t([pt({attribute:!1})],ee.prototype,"hass",void 0),t([ht()],ee.prototype,"_config",void 0),t([ht()],ee.prototype,"_filter",void 0),customElements.get("irrigation-valves-card")||customElements.define("irrigation-valves-card",ee);const ie="__no_site__";function se(t,e){return t.filter(t=>t.parent_id===e).sort((t,e)=>t.name.localeCompare(e.name))}function ne(t,e,i){const s=t===ie,n=s?null:e.sites.find(e=>e.id===t)??null,a=s?null:Tt(e.sites,t),r=i.filter(t=>a?!!t.site_id&&a.has(t.site_id):!t.site_id),o=r.flatMap(t=>t.valves),l=[0,0,0,0,0,0,0];let d=0,c=0;for(const t of r)d+=t.week.runs,c+=t.week.liters,"L"===t.week.unit&&t.week.daily.forEach((t,e)=>l[e]+=t);const p=r.map(t=>t.last?.start).filter(t=>"number"==typeof t),h=r.map(t=>t.next?.start).filter(t=>"number"==typeof t),u=s?null:function(t,e){const i=new Map(t.sites.map(t=>[t.id,t]));for(let s=i.get(e),n=0;s&&n<20;s=s.parent_id?i.get(s.parent_id):void 0,n++){const i=t.pumpAssignments.find(t=>"site"===t.target_kind&&t.target_id===s.id),n=i&&t.pumps.find(t=>t.id===i.pump_id);if(n)return{pump:n,via:s.id===e?null:s.name}}return null}(e,t);return{id:t,name:n?.name??"No site",path:n?zt(e.sites,n.id):"No site",parent_id:n?.parent_id??null,children:s?[]:se(e.sites,t).map(t=>t.id),mps:r.length,valves:o.length,online:o.filter(t=>"offline"!==t.status).length,watering:o.filter(t=>"watering"===t.status).length,attention:r.filter(t=>"offline"!==t.status&&t.badges.length>0).length,offline:o.filter(t=>"offline"===t.status).length,last:p.length?Math.max(...p):null,next:h.length?Math.min(...h):null,week:{runs:d,liters:c,daily:l},pump:u?{name:u.pump.name,via:u.via}:null}}function ae(t,e,i,s){const n=t.valves.map(t=>i.find(e=>e.device_id===t)).filter(t=>!!t),a=function(t,e){const i=[];for(const s of e.runs){const e=Date.parse(s.end),n=t.assignments.some(t=>t.device_id===s.device_id&&(null===t.begin||t.begin<=e)&&(null===t.end||e<t.end));n&&i.push({start:Date.parse(s.start),minutes:(s.duration_seconds??0)/60,liters:"number"==typeof s.liters?s.liters:null})}return i.sort((t,e)=>t.start-e.start)}(t,e),r=n.some(t=>t.has_flow_meter)||a.some(t=>null!==t.liters&&t.liters>0),o=a.filter(t=>t.start>=s-2592e6&&null!==t.liters&&t.minutes>=1),l=o.reduce((t,e)=>t+e.minutes,0),d=r&&l>0?o.reduce((t,e)=>t+(e.liters??0),0)/l:null,c=n.length?n.some(t=>"watering"===t.status)?"watering":n.every(t=>"offline"===t.status)?"offline":"idle":"empty",p=n.map(t=>t.next).filter(t=>!!t),h=a[a.length-1]??null,u=n.reduce((t,e)=>t+e.missed,0),m=[];t.valves.length||m.push("no_valve");for(const t of["low_battery","stale"])n.some(e=>e.badges.includes(t))&&m.push(t);if(u>0&&m.push("missed"),r&&h&&0===h.liters&&h.minutes>=1&&m.push("no_flow"),null!==d&&t.expected_lpm){const e=(d-t.expected_lpm)/t.expected_lpm;e<-.25?m.push("flow_low"):e>.25&&m.push("flow_high")}return{id:t.id,name:t.name,site_id:t.site_id,valves:n.map(t=>({device_id:t.device_id,number:t.number,name:t.name,status:t.status,battery:t.battery,view_path:t.view_path})),status:c,last:h,next:p.length?p.reduce((t,e)=>e.start<t.start?e:t):null,week:Ct(a,s,r),avg_lpm:d,expected_lpm:t.expected_lpm,pump:t.pump,missed:u,badges:m}}class re extends ot{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-site-open",{detail:this.summary.id,bubbles:!0,composed:!0}))}render(){const t=this.summary;if(!t)return q;const e=t.watering?B`<span class="status watering" title="Valves watering now"><i></i>${t.watering} watering</span>`:B`<span class="status" title="Valves online / valves in this site"><i></i>${t.online} / ${t.valves} online</span>`;return B`<ha-card @click=${this._open} tabindex="0" role="link" aria-label=${t.path}>
      <div class="head">
        <span class="name" title=${t.path}>${t.name}</span>
        ${t.children.length?B`<span class="dim" title="Sub-sites"><ha-icon icon="mdi:file-tree-outline"></ha-icon>${t.children.length}</span>`:q}
        <span class="dim" title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${t.mps}</span>
      </div>
      ${t.pump?B`<div class="row dim" title="Pump${t.pump.via?`, inherited from ${t.pump.via}`:""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>
          </div>`:q}
      ${e}
      <dl>
        <dt title="Last run in this site"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run in this site">${t.last?Vt(t.last):"–"}</dd>
        <dt title="Next planned run in this site"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run in this site">${t.next?Vt(t.next):"–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${t.week.daily}></xt-week-bars>
        <span class="dim" title="Last 7 days: runs and water of all valves in this site"
          >${t.week.runs} runs · ${qt(t.week.liters)}</span
        >
      </div>
      ${t.attention||t.offline?B`<div class="badges">
            ${t.attention?B`<span class="badge warn" title="Metering points with a warning (battery, no report, missed run, no water, flow)"
                  >${t.attention} need attention</span
                >`:q}
            ${t.offline?B`<span class="badge" title="Valves not reachable">${t.offline} offline</span>`:q}
          </div>`:q}
    </ha-card>`}}re.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],re.prototype,"summary",void 0),customElements.get("xt-site-card")||customElements.define("xt-site-card",re);class oe extends ot{constructor(){super(...arguments),this.sites=[],this.selected=null,this.counts={},this.noSite=!1,this._closed=new Set}_open(t){this.dispatchEvent(new CustomEvent("xt-site-open",{detail:t,bubbles:!0,composed:!0}))}_toggle(t,e){t.stopPropagation();const i=new Set(this._closed);i.has(e)?i.delete(e):i.add(e),this._closed=i}_node(t,e){const i=se(this.sites,t.id),s=this._closed.has(t.id);return B`
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
      ${s?q:i.map(t=>this._node(t,e+1))}
    `}render(){return B`
      <button class="node all ${null===this.selected?"on":""}" @click=${()=>this._open(null)}>
        <ha-icon class="chev" icon="mdi:sprout-outline"></ha-icon><span class="label">All sites</span>
      </button>
      ${se(this.sites,null).map(t=>this._node(t,0))}
      ${this.noSite?B`<button class="node ${this.selected===ie?"on":""}" @click=${()=>this._open(ie)}>
            <span class="chev"></span><span class="label dim">No site</span>
            <span class="count">${this.counts[ie]??""}</span>
          </button>`:q}
    `}}oe.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],oe.prototype,"sites",void 0),t([pt({attribute:!1})],oe.prototype,"selected",void 0),t([pt({attribute:!1})],oe.prototype,"counts",void 0),t([pt({type:Boolean})],oe.prototype,"noSite",void 0),t([ht()],oe.prototype,"_closed",void 0),customElements.get("xt-site-tree")||customElements.define("xt-site-tree",oe);const le={no_valve:["No valve","No valve is assigned to this metering point","warn"],low_battery:["Low battery","The valve's battery is below 20 %","warn"],stale:["No report 36 h","The valve has not reported for more than 36 hours","warn"],missed:["Missed","A planned run in the last 24 hours did not happen","bad"],no_flow:["No water flow","The last run here measured no water","bad"],flow_low:["Flow low","Mean flow of the last 30 days is well below the expected L/min","bad"],flow_high:["Flow high","Mean flow of the last 30 days is well above the expected L/min (leak?)","bad"]},de={watering:"Watering",idle:"Idle",offline:"Offline"};function ce(t){const e=[Vt(t.start),`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}class pe extends ot{constructor(){super(...arguments),this.editable=!1}_openValve(t,e){t.stopPropagation(),this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:e.view_path,bubbles:!0,composed:!0}))}_valve(t){return B`<button class="valve ${t.status}" @click=${e=>this._openValve(e,t)} title="Open valve ${t.name}">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${t.number?`#${t.number}`:t.name}</span>
      <i></i><span>${de[t.status]}</span>
      ${null!==t.battery?B`<span class="battery" title="Battery ${Math.round(t.battery)} %"
            ><ha-icon icon=${Ft(t.battery)}></ha-icon>${Math.round(t.battery)} %</span
          >`:q}
    </button>`}_flow(t){if(null===t.avg_lpm)return q;const e=t.expected_lpm?` · expected ${t.expected_lpm}`:"";return B`<div class="row" title="Mean flow of the last 30 days' runs${t.expected_lpm?" vs. the expected L/min":""}">
      <ha-icon icon="mdi:speedometer"></ha-icon><span>${t.avg_lpm.toFixed(1)} L/min${e}</span>
    </div>`}render(){const t=this.summary;if(!t)return q;const e=t.week.unit,i="L"===e?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`;return B`<ha-card class=${t.status}>
      <div class="head">
        <span class="name" title="Metering point">${t.name}</span>
        ${this.editable?B`<button
              class="edit"
              aria-label="Edit ${t.name}"
              title="Edit metering point"
              @click=${()=>this.dispatchEvent(new CustomEvent("xt-mp-edit",{detail:t.id,bubbles:!0,composed:!0}))}
            >
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>`:q}
      </div>
      ${t.valves.length?t.valves.map(t=>this._valve(t)):B`<div class="row dim">No valve assigned</div>`}
      ${t.pump?B`<div class="row" title="Pump${t.pump.via?`, inherited from ${t.pump.via}`:""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>
          </div>`:q}
      <dl>
        <dt title="Last run here"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run here: start · duration · water">${t.last?ce(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?ce(t.next):"–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${t.week.daily} unit=${e}></xt-week-bars>
        <span class="dim" title="Last 7 days here, across valve exchanges">${t.week.runs} runs · ${i}</span>
      </div>
      ${this._flow(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>{const[i,s,n]=le[e];return B`<span class="badge ${n}" title=${s}>${i}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`})}
          </div>`:q}
    </ha-card>`}}pe.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],pe.prototype,"summary",void 0),t([pt({type:Boolean})],pe.prototype,"editable",void 0),customElements.get("xt-mp-card")||customElements.define("xt-mp-card",pe);const he={watering:"Watering",idle:"Idle",offline:"Offline"};function ue(t){return new Date(t).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}class me extends ot{constructor(){super(...arguments),this.sites=[],this.valves=[],this.busy=!1,this.error=null}_fire(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_save(t){t.preventDefault();const e=t.target,i=t=>e.elements.namedItem(t).value,s=i("expected_lpm").trim();this._fire("xt-mp-save",{name:i("name"),description:i("description"),expected_lpm:""===s?null:Number(s),site_id:i("site_id")||null})}_valveLine(t,e){return B`<div class="valve">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${t?.label??e}</span>
      ${t?B`<i class=${t.status}></i><span>${he[t.status]}</span>`:q}
      ${null!=t?.battery?B`<span class="dim"><ha-icon icon=${Ft(t.battery)}></ha-icon>${Math.round(t.battery)} %</span>`:q}
      <button type="button" class="link danger" ?disabled=${this.busy} @click=${()=>this._fire("xt-mp-unassign",e)}>
        Remove
      </button>
    </div>`}render(){const t=this.mp;if(!t)return q;const e=new Map(this.valves.map(t=>[t.device_id,t])),i=this.valves.filter(e=>!t.valves.includes(e.device_id)).sort((t,e)=>Number(!!t.at)-Number(!!e.at)||t.label.localeCompare(e.label,void 0,{numeric:!0})),s=[...t.assignments].sort((t,e)=>(e.begin??0)-(t.begin??0));return B`
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
                      >${t.begin?ue(t.begin):"from the start"} – ${t.end?ue(t.end):"now"}</span
                    >
                  </li>`)}
              </ul>
            </section>`:q}
        ${this.error?B`<div class="error">${this.error}</div>`:q}
      </aside>
    `}}me.styles=[Rt,r`
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
    `],t([pt({attribute:!1})],me.prototype,"mp",void 0),t([pt({attribute:!1})],me.prototype,"sites",void 0),t([pt({attribute:!1})],me.prototype,"valves",void 0),t([pt({type:Boolean})],me.prototype,"busy",void 0),t([pt()],me.prototype,"error",void 0),customElements.get("xt-mp-editor")||customElements.define("xt-mp-editor",me);const ve="xtend_tuya/irrigation_locations";function fe(){return new URLSearchParams(window.location.search).get("site")}class ge extends ot{constructor(){super(...arguments),this._selected=fe(),this._edit=!1,this._editing=null,this._busy=!1,this._error=null,this._farm=new Nt(this),this._onLocation=()=>{this._selected=fe()}}setConfig(t){}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),window.addEventListener("location-changed",this._onLocation),window.addEventListener("popstate",this._onLocation)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocation),window.removeEventListener("popstate",this._onLocation)}_open(t){const e=new URL(window.location.href);t?e.searchParams.set("site",t):e.searchParams.delete("site"),window.history.pushState(null,"",e.pathname+e.search),this._selected=t,this._error=null}async _post(t){if(!this.hass?.callApi)return!1;this._busy=!0,this._error=null;try{return await this.hass.callApi("POST",ve,t),await this._farm.refresh(!0),!0}catch(t){const e=t;return this._error=e.body?.error??e.message??String(t),!1}finally{this._busy=!1}}async _createSite(t,e){const i=t.querySelector("input");i.value.trim()&&await this._post({action:"create_site",name:i.value,parent_id:e})&&(i.value="")}async _saveSite(t,e){const i=t.querySelector("input").value,s=t.querySelector("select").value||null;await this._post({action:"update_site",id:e.id,name:i,parent_id:s})}async _deleteSite(t){await this._post({action:"delete_site",id:t.id})&&this._open(t.parent_id)}_header(t,e){const i=[{id:null,name:"All sites"}];if(t&&t.id!==ie){const e=new Map(this._farm.data.sites.map(t=>[t.id,t])),s=[];for(let i=e.get(t.id);i&&s.length<20;i=i.parent_id?e.get(i.parent_id):void 0)s.unshift(i);i.push(...s.map(t=>({id:t.id,name:t.name})))}else t&&i.push({id:ie,name:"No site"});const s=i[i.length-1].name;return B`<div class="header">
      <nav class="crumbs" aria-label="Site path">
        ${i.slice(0,-1).map(t=>B`<a href="#" @click=${e=>(e.preventDefault(),this._open(t.id))}>${t.name}</a><span>›</span>`)}
      </nav>
      <div class="title-row">
        <h2>${s}</h2>
        ${this.hass?.user?.is_admin?B`<button class="edit ${this._edit?"on":""}" @click=${()=>this._edit=!this._edit}>
              <ha-icon icon=${this._edit?"mdi:check":"mdi:pencil-outline"}></ha-icon>${this._edit?"Done":"Edit"}
            </button>`:q}
      </div>
      <div class="figures">
        ${t?B`
              <span title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${t.mps} metering points</span>
              <span title="Valves online / valves"><ha-icon icon="mdi:valve"></ha-icon>${t.online} / ${t.valves} online</span>
              ${t.watering?B`<span class="water" title="Valves watering now"><i></i>${t.watering} watering</span>`:q}
              ${t.attention?B`<span class="warn" title="Metering points with a warning">${t.attention} need attention</span>`:q}
              <span title="Last 7 days"
                ><xt-week-bars .daily=${t.week.daily}></xt-week-bars>${t.week.runs} runs · ${qt(t.week.liters)}</span
              >
              ${t.pump?B`<span title="Pump"><ha-icon icon="mdi:pump"></ha-icon>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>`:q}
            `:B`
              <span><ha-icon icon="mdi:sprout-outline"></ha-icon>${e.sites} sites</span>
              <span><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${e.mps} metering points</span>
              <span><ha-icon icon="mdi:valve"></ha-icon>${e.online} / ${e.valves} online</span>
            `}
      </div>
    </div>`}_editSite(t){const e=this._farm.data.sites,i=Tt(e,t.id),s=e.filter(t=>!i.has(t.id)).map(t=>({id:t.id,path:zt(e,t.id)})).sort((t,e)=>t.path.localeCompare(e.path)),n=!e.some(e=>e.parent_id===t.id)&&!this._farm.data.locations.some(e=>e.site_id===t.id);return B`<form class="editor" @submit=${e=>(e.preventDefault(),this._saveSite(e.target,t))}>
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
    </form>`}async _saveMp(t,e){await this._post({action:"update_location",id:t.id,name:e.name,description:e.description,expected_lpm:e.expected_lpm})&&e.site_id!==t.site_id&&await this._post({action:"set_location_site",location_id:t.id,site_id:e.site_id})}async _createMp(t,e){const i=t.querySelector("input");if(i.value.trim()&&this.hass?.callApi){this._busy=!0,this._error=null;try{const t=await this.hass.callApi("POST",ve,{action:"create_location",name:i.value});e&&await this.hass.callApi("POST",ve,{action:"set_location_site",location_id:t.location.id,site_id:e}),i.value="",await this._farm.refresh(!0),this._editing=t.location.id}catch(t){const e=t;this._error=e.body?.error??e.message??String(t)}finally{this._busy=!1}}}_editor(t,e){const i=this._farm.data,s=i.sites.map(t=>({id:t.id,path:zt(i.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path)),n=e.map(t=>({device_id:t.device_id,label:t.number?`#${t.number}`:t.name,status:t.status,battery:t.battery,at:i.locationOf[t.device_id]?.name??null}));return B`<xt-mp-editor
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
    </form>`}render(){if(!this.hass)return q;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading sites…</div></ha-card>`;const t=this._farm.data,e=this._farm.summaries(),i=Date.now(),s=t.locations.map(s=>ae(s,t,e,i)),n=new Map(s.map(t=>[t.id,t])),a=t.locations.some(t=>!t.site_id),r=this._selected&&(this._selected===ie||t.sites.some(t=>t.id===this._selected))?this._selected:null,o=r&&r!==ie?t.sites.find(t=>t.id===r)??null:null,l=r?ne(r,t,s):null,d=r?l.children:[...se(t.sites,null).map(t=>t.id),...a?[ie]:[]],c=d.map(e=>ne(e,t,s)),p=r?t.locations.filter(t=>r===ie?!t.site_id:t.site_id===r).sort((t,e)=>t.name.localeCompare(e.name)):[],h={};for(const e of t.sites)h[e.id]=t.locations.filter(i=>Tt(t.sites,e.id).has(i.site_id??"")).length;h[ie]=t.locations.filter(t=>!t.site_id).length;const u=s.flatMap(t=>t.valves),m={sites:t.sites.length,mps:t.locations.length,valves:u.length,online:u.filter(t=>"offline"!==t.status).length},v=this._editing?t.locations.find(t=>t.id===this._editing):void 0;return B`<div
      class="layout"
      @xt-site-open=${t=>this._open(t.detail)}
      @xt-valve-open=${t=>Ht(t.detail)}
      @xt-mp-edit=${t=>(this._editing=t.detail,this._error=null)}
    >
      <aside>
        <xt-site-tree .sites=${t.sites} .selected=${r} .counts=${h} ?noSite=${a}></xt-site-tree>
      </aside>
      <main>
        ${this._header(l,m)}
        ${this._error&&!v?B`<div class="msg err">${this._error}</div>`:q}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:q}
        ${this._edit&&o?this._editSite(o):q}
        ${c.length||this._edit&&r!==ie?B`<h3>${r?"Sub-sites":"Sites"} <span class="count">${c.length}</span></h3>
              <div class="grid">${c.map(t=>B`<xt-site-card .summary=${t}></xt-site-card>`)}</div>
              ${this._edit&&r!==ie?this._addSite(r):q}`:q}
        ${p.length||this._edit&&r?B`<h3>Metering points <span class="count">${p.length}</span></h3>
              <div class="grid">
                ${p.map(t=>B`<xt-mp-card .summary=${n.get(t.id)} ?editable=${this._edit}></xt-mp-card>`)}
              </div>
              ${this._edit&&r?this._addMp(r===ie?null:r):q}`:q}
        ${r||t.sites.length?q:B`<div class="msg">No sites yet. Sites are created from the Tuya rooms once the valves report them, or by hand in Edit.</div>`}
      </main>
      ${v?this._editor(v,e):q}
    </div>`}}ge.styles=[Rt,r`
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
  `],t([pt({attribute:!1})],ge.prototype,"hass",void 0),t([ht()],ge.prototype,"_selected",void 0),t([ht()],ge.prototype,"_edit",void 0),t([ht()],ge.prototype,"_editing",void 0),t([ht()],ge.prototype,"_busy",void 0),t([ht()],ge.prototype,"_error",void 0),customElements.get("irrigation-sites-card")||customElements.define("irrigation-sites-card",ge);
