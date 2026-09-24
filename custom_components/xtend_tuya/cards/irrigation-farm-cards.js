function t(t,e,i,s){var n,a=arguments.length,r=a<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(n=t[o])&&(r=(a<3?n(r):a>3?n(e,i,r):n(e,i))||r);return a>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,v=f?f.emptyScript:"",g=m.reactiveElementPolyfillSupport,_=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...p(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:$).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[_("elementProperties")]=new Map,x[_("finalized")]=new Map,g?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,k=w.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,P=`<${M}>`,N=document,O=()=>N.createComment(""),L=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,U="[ \t\n\f\r]",z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,H=/>/g,R=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,W=/"/g,I=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),F=new WeakMap,G=N.createTreeWalker(N,129);function J(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",r=z;for(let e=0;e<i;e++){const i=t[e];let o,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===z?"!--"===l[1]?r=D:void 0!==l[1]?r=H:void 0!==l[2]?(I.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=R):void 0!==l[3]&&(r=R):r===R?">"===l[0]?(r=n??z,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?R:'"'===l[3]?W:j):r===W||r===j?r=R:r===D||r===H?r=z:(r=R,n=void 0);const p=r===R&&t[e+1].startsWith("/>")?" ":"";a+=r===z?i+P:d>=0?(s.push(o),i.slice(0,d)+E+i.slice(d)+C+p):i+C+(-2===d?e:p)}return[J(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const r=t.length-1,o=this.parts,[l,d]=K(t,e);if(this.el=Z.createElement(l,i),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=G.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(E)){const e=d[a++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),G.nextNode(),o.push({type:2,index:++n});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===M)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)o.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=L(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??N).importNode(e,!0);G.currentNode=s;let n=G.nextNode(),a=0,r=0,o=i[0];for(;void 0!==o;){if(a===o.index){let e;2===o.type?e=new X(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new nt(n,this,t)),this._$AV.push(e),o=i[++r]}a!==o?.index&&(n=G.nextNode(),a++)}return G.currentNode=N,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),L(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&L(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Z(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=Y(this,t,e,0),a=!L(t)||t!==this._$AH&&t!==V,a&&(this._$AH=t);else{const s=t;let r,o;for(t=n[0],r=0;r<n.length-1;r++)o=Y(this,s[i+r],e,r),o===V&&(o=this._$AH[r]),a||=!L(o)||o!==this._$AH[r],o===q?t=q:t!==q&&(t+=(o??"")+n[r+1]),this._$AH[r]=o}a&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??q)===V)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const at=w.litHtmlPolyfillSupport;at?.(Z,X),(w.litHtmlVersions??=[]).push("3.3.2");const rt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ot extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(O(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}ot._$litElement$=!0,ot.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ot});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:ot}),(rt.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:y},ct=(t=dt,e,i)=>{const{kind:s,metadata:n}=i;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),a.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ct(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ht(t){return pt({...t,state:!0,attribute:!1})}async function ut(t){if(!t.callApi)return{};try{const e=await t.callApi("GET","xtend_tuya/valve_locations");return e?.locations??{}}catch{return{}}}const mt="irrigation_timer_registry",ft={start_time:"start_time_sensor",close_time:"end_time_sensor",end_time:"end_time_sensor",watering_mode:"mode_sensor",watering_value:"value_sensor",watering_volume:"volume_sensor",watering_flow_rate:"flow_rate_sensor",battery_level:"battery_level",last_report:"last_report",watering_duration:"duration",rain_snow_delay:"rain_snow_delay",battery:"battery_level",indexed_irrigation_duration:"duration"},vt=[[/_last_watering_start$/,"start_time_sensor"],[/_last_watering_end$/,"end_time_sensor"],[/_watering_flow_rate$/,"flow_rate_sensor"],[/_watering_value$/,"value_sensor"],[/_watering_volume$/,"volume_sensor"],[/_watering_duration$/,"duration"],[/_watering_mode$/,"mode_sensor"],[/_rain_snow_delay$/,"rain_snow_delay"],[/_battery_level$/,"battery_level"]];function gt(t,e,i,s,n,a={}){const r=t.devices[i],o=n.attributes.valve_name??n.attributes.valve_factory_name??r?.name_by_user??r?.name??s,l=n.attributes.valve_factory_name??r?.name??o,d=`${_t}?id=${encodeURIComponent(s)}`;const c={device_id:s,registry_entity:e,valve_name:o,factory_name:l,valve_home:a[s]?.home??a[i]?.home??n.attributes.valve_home??null,valve_room:a[s]?.room??a[i]?.room??n.attributes.valve_room??null,view_path:d},p=(t,e)=>{c[t]||(c[t]=e)};let h;for(const e of Object.values(t.entities)){if(e.device_id!==i)continue;if(!t.states[e.entity_id])continue;if(e.entity_id.startsWith("switch.")&&("valve"===e.translation_key||"indexed_switch"===e.translation_key||e.entity_id.endsWith("_valve"))){c.switch||(c.switch=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&"switch_1"===e.translation_key){h||(h=e.entity_id);continue}if(e.entity_id.startsWith("switch.")&&e.entity_id.endsWith("_sleep_mode")){c.sleep_mode=e.entity_id;continue}const s=e.translation_key;if(s){const t=ft[s];if(t){p(t,e.entity_id);continue}}for(const[t,i]of vt)if(t.test(e.entity_id)){p(i,e.entity_id);break}}return!c.switch&&h&&(c.switch=h),c}const _t="valve";const $t={runs:[],planned:[],sites:[],locations:[],locationOf:{},pumps:[],pumpAssignments:[]};let yt=null;function bt(t,e=Date.now()){if(!yt||e-yt.at>6e4){const i=async function(t,e){if(!t.callApi)return $t;const i=t=>encodeURIComponent(new Date(t).toISOString()),[s,n,a]=await Promise.all([t.callApi("GET",`xtend_tuya/runs?since=${i(e-2592e6)}`),t.callApi("GET","xtend_tuya/irrigation_locations"),t.callApi("GET",`calendars/calendar.irrigation_planned?start=${i(e-1728e5)}&end=${i(e+6912e5)}`)]),r=[],o={};for(const t of n?.locations??[]){const e=(t.devices??[]).find(t=>null===t.end),i={id:t.id,name:t.name,site_id:t.site_id??null,valve:e?.device_id??null};r.push(i);for(const e of t.devices??[])null===e.end&&(o[e.device_id]=i)}const l=[];for(const t of a??[]){const e=Date.parse(t.start.dateTime??t.start.date??""),i=Date.parse(t.end.dateTime??t.end.date??"");Number.isFinite(e)&&l.push({key:(t.uid??"").split("#")[0],start:e,end:i>e?i:e+6e4})}return{runs:s?.runs??[],planned:l,sites:n?.sites??[],locations:r,locationOf:o,pumps:n?.pumps??[],pumpAssignments:n?.pump_assignments??[]}}(t,e);yt={at:e,data:i},i.catch(()=>{yt?.data===i&&(yt=null)})}return yt.data}const xt=864e5,wt=864e5,At=/\((\d+)\)\s*$/;function kt(t){if(!t)return null;const e=Number(t.state);return Number.isFinite(e)&&""!==t.state?e:null}function St(t){return!t||"unavailable"===t.state||"unknown"===t.state}function Et(t){const e=new Date(t);return e.setHours(0,0,0,0),e.getTime()}function Ct(t,e,i,s){const n=e[t.registry_entity],a=t.switch?e[t.switch]:void 0,r=St(n)&&St(a),o=!r&&"on"===a?.state,l=i.runs.filter(e=>e.device_id===t.device_id).map(t=>({r:t,start:Date.parse(t.start),end:Date.parse(t.end)})).filter(t=>Number.isFinite(t.start)&&Number.isFinite(t.end)).sort((t,e)=>t.start-e.start),d=l[l.length-1],c=i.planned.filter(e=>e.key===t.registry_entity).sort((t,e)=>t.start-e.start),p=c.find(t=>t.start>s),h=c.filter(t=>t.end>s-xt&&t.end<s).map(e=>({start:e.start,end:e.end,kind:"planned",name:t.valve_name,key:t.device_id})),u=l.filter(t=>t.end>s-xt-wt).map(e=>({start:e.start,end:e.end,kind:"ran",name:t.valve_name,key:t.device_id})),m=function(t,e,i,s=9e5){const n=new Set,a=[];for(const r of[...t].sort((t,e)=>t.start-e.start)){let t=null;for(const i of e){if(n.has(i)||i.key!==r.key)continue;const e=Math.abs(i.start-r.start);e<=s&&(!t||e<Math.abs(t.start-r.start))&&(t=i)}t?(n.add(t),a.push({...t,kind:"running"===t.kind?"running":"ran",planStart:r.start,planEnd:r.end,summary:`${t.summary??""}\nplanned ${r.summary??""}`})):r.end+s<i?a.push({...r,kind:"missed"}):a.push(r)}for(const t of e)n.has(t)||a.push("running"===t.kind?t:{...t,kind:"unplanned"});return a}(h,u,s).filter(t=>"missed"===t.kind).length,f=!!t.volume_sensor,v=Et(s)-5184e5,g=[0,0,0,0,0,0,0];let _=0,$=0,y=0;for(const t of l){if(t.start<v)continue;const e=Math.min(6,Math.floor((Et(t.start)-v)/wt+.5)),i=(t.r.duration_seconds??0)/60,s="number"==typeof t.r.liters?t.r.liters:0;_+=1,$+=s,y+=i,g[e]+=f?s:i}const b=r?null:kt(t.battery_level?e[t.battery_level]:void 0),x=t.last_report?Date.parse(e[t.last_report]?.state??""):NaN,w=d?((t,e)=>({start:e,minutes:(t.duration_seconds??0)/60,liters:"number"==typeof t.liters?t.liters:null}))(d.r,d.start):null,A=[];r||(null!==b&&b<20&&A.push("low_battery"),Number.isFinite(x)&&s-x>1296e5&&A.push("stale"),m>0&&A.push("missed"),f&&w&&0===w.liters&&w.minutes>=1&&A.push("no_flow"));const k=i.locationOf[t.device_id]??null,S=k?.site_id?i.sites.find(t=>t.id===k.site_id)??null:null,E=t=>t?.last_changed?Date.parse(t.last_changed):null;return{device_id:t.device_id,name:t.valve_name,number:At.exec(t.valve_name)?.[1]??null,view_path:t.view_path,status:r?"offline":o?"watering":"idle",since:o?E(a):r?E(n):null,flow_lpm:o?kt(t.flow_rate_sensor?e[t.flow_rate_sensor]:void 0):null,battery:b,has_flow_meter:f,last:w,next:p?{start:p.start,minutes:(p.end-p.start)/6e4,liters:null}:null,week:{runs:_,liters:$,minutes:y,daily:g,unit:f?"L":"min"},missed:m,badges:A,location:k?{id:k.id,name:k.name}:null,site:S?{id:S.id,name:S.name}:null}}class Mt{constructor(t){this.valves=[],this.data=$t,this.loaded=!1,this.error=null,this.busy=!1,this.host=t,t.addController(this)}hostConnected(){this.timer=window.setInterval(()=>{this.refresh()},6e4)}hostDisconnected(){this.timer&&window.clearInterval(this.timer)}hostUpdated(){this.loaded||this.busy||!this.host.hass||this.refresh()}async refresh(t=!1){const e=this.host.hass;if(e&&!this.busy){t&&(yt=null),this.busy=!0;try{const[t,i]=await Promise.all([bt(e),ut(e)]);this.valves=function(t,e={}){const i=new Set;for(const e of Object.values(t.entities))e.translation_key===mt&&i.add(e.entity_id);for(const e of Object.keys(t.states))e.startsWith("sensor.")&&(e.endsWith(mt)||e.endsWith("_time_task_registry"))&&i.add(e);const s=[];for(const n of i){const i=t.states[n],a=t.entities[n];if(!i||!a||!a.device_id)continue;const r=i.attributes.device_id??a.device_id,o=gt(t,n,a.device_id,r,i,e);o&&s.push(o)}return s.sort((t,e)=>t.valve_name.localeCompare(e.valve_name)),s}(e,i),this.data=t,this.error=null}catch(t){this.error=t instanceof Error?t.message:String(t)}finally{this.busy=!1,this.loaded=!0,this.host.requestUpdate()}}}summaries(){const t=this.host.hass;if(!t)return[];const e=Date.now();return this.valves.map(i=>Ct(i,t.states,this.data,e))}}const Pt={site:null,status:"all",search:""},Nt={watering:"Watering now",attention:"Needs attention",sites:"Valves",offline:"Offline",unassigned:"Without location"},Ot=["watering","attention","sites","offline","unassigned"];function Lt(t,e){const i=new Set([e]);for(let e=!0;e;){e=!1;for(const s of t)s.parent_id&&i.has(s.parent_id)&&!i.has(s.id)&&(i.add(s.id),e=!0)}return i}function Tt(t,e){const i=new Map(t.map(t=>[t.id,t])),s=[];for(let t=i.get(e);t&&s.length<20;t=t.parent_id?i.get(t.parent_id):void 0)s.unshift(t.name);return s.join(" › ")}function Ut(t){return"offline"!==t.status&&t.badges.length>0}function zt(t,e,i){const s=e.site?Lt(i,e.site):null,n=e.search.trim().toLowerCase();return t.filter(t=>(!s||null!==t.site&&s.has(t.site.id))&&("all"===e.status||"watering"===e.status&&"watering"===t.status||"offline"===e.status&&"offline"===t.status||"attention"===e.status&&Ut(t))&&(!n||t.name.toLowerCase().includes(n)||(t.location?.name.toLowerCase().includes(n)??!1)||(t.site?.name.toLowerCase().includes(n)??!1)))}function Dt(t){const e=window.location.pathname.split("/")[1]||"lovelace";window.history.pushState(null,"",t.startsWith("/")?t:`/${e}/${t}`),window.dispatchEvent(new Event("location-changed"))}const Ht=[["all","All"],["watering","Watering"],["attention","Attention"],["offline","Offline"]];class Rt extends ot{constructor(){super(...arguments),this.sites=[],this.value=Pt,this.counts={}}_set(t){this.value={...this.value,...t},this.dispatchEvent(new CustomEvent("xt-filter-changed",{detail:this.value,bubbles:!0,composed:!0}))}render(){const t=[...this.sites].map(t=>({id:t.id,path:Tt(this.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path));return B`
      <select
        aria-label="Site"
        .value=${this.value.site??""}
        @change=${t=>this._set({site:t.target.value||null})}
      >
        <option value="">All sites</option>
        ${t.map(t=>B`<option value=${t.id} ?selected=${t.id===this.value.site}>${t.path}</option>`)}
      </select>
      <div class="chips" role="group" aria-label="Status">
        ${Ht.map(([t,e])=>B`<button
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
    `}}Rt.styles=r`
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
  `,t([pt({attribute:!1})],Rt.prototype,"sites",void 0),t([pt({attribute:!1})],Rt.prototype,"value",void 0),t([pt({attribute:!1})],Rt.prototype,"counts",void 0),customElements.get("xt-valve-filter-bar")||customElements.define("xt-valve-filter-bar",Rt);const jt=864e5;function Wt(t){return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function It(t){return`${function(t,e=Date.now()){const i=new Date(t),s=new Date(e);s.setHours(0,0,0,0);const n=Math.floor((i.getTime()-s.getTime())/jt);return 0===n?"Today":-1===n?"Yesterday":1===n?"Tomorrow":i.toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"})}(t)} ${Wt(t)}`}function Bt(t){return`${Math.round(t).toLocaleString()} L`}class Vt extends ot{constructor(){super(...arguments),this.daily=[],this.unit="L"}render(){const t=Math.max(...this.daily,0),e=new Date;e.setHours(12,0,0,0);const i=this.daily.length;return this.daily.map((s,n)=>B`<span
          title="${(t=>new Date(e.getTime()-(i-1-t)*jt).toLocaleDateString(void 0,{weekday:"short",day:"numeric",month:"short"}))(n)}: ${Math.round(s).toLocaleString()} ${this.unit}"
          style="height:${t>0?Math.max(8,s/t*100):8}%"
          class=${s>0?"on":""}
        ></span>`)}}Vt.styles=r`
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
      background: var(--divider-color, #e0e0e0);
    }
    span.on {
      background: var(--state-switch-active-color, #f9a825);
    }
  `,t([pt({attribute:!1})],Vt.prototype,"daily",void 0),t([pt()],Vt.prototype,"unit",void 0),customElements.get("xt-week-bars")||customElements.define("xt-week-bars",Vt);const qt={low_battery:"Low battery",stale:"No report 36 h",missed:"Missed",no_flow:"No water flow"},Ft={low_battery:"Battery below 20 %",stale:"The valve has not reported for more than 36 hours",missed:"A planned run in the last 24 hours did not happen",no_flow:"The last run measured no water"};function Gt(t){const e=[It(t.start),`${Math.round(t.minutes)} min`];return null!==t.liters&&e.push(`${Math.round(t.liters)} L`),e.join(" · ")}function Jt(t){return(t.number?t.name.replace(/\s*\(\d+\)\s*$/,""):t.name)||t.name}class Kt extends ot{constructor(){super(...arguments),this.siteContext=null}_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-valve-open",{detail:this.summary.view_path,bubbles:!0,composed:!0}))}_status(t){if("watering"===t.status){const e=null!==t.flow_lpm?` · ${t.flow_lpm.toFixed(1)} L/min`:"";return B`<span class="status watering" title="Watering now"><i></i>Watering${t.since?` since ${Wt(t.since)}`:""}${e}</span>`}return"offline"===t.status?B`<span class="status offline" title="Not reachable"><i></i>Offline${t.since?` for ${function(t,e=Date.now()){const i=Math.round((e-t)/6e4);if(i<60)return`${i} min`;const s=Math.round(i/60);return s<48?`${s} h`:`${Math.round(s/24)} d`}(t.since)}`:""}</span>`:B`<span class="status idle" title="Online, not watering"><i></i>Idle</span>`}_week(t){const e=t.week.unit,i="L"===e?`${Math.round(t.week.liters)} L`:`${Math.round(t.week.minutes)} min`;return B`<div class="week">
      <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
      <xt-week-bars .daily=${t.week.daily} unit=${e}></xt-week-bars>
      <span class="dim" title="Last 7 days: number of runs and total ${"L"===e?"water":"watering time"}"
        >${t.week.runs} runs · ${i}</span
      >
    </div>`}render(){const t=this.summary;if(!t)return q;const e=t.location&&t.location.name!==Jt(t)?t.location.name:null,i=t.site&&t.site.id!==this.siteContext?t.site.name:null,s=t.location?[e,i].filter(Boolean).join(" · "):"No location";return B`<ha-card class=${t.status} @click=${this._open} tabindex="0" role="link" aria-label=${t.name}>
      <div class="head">
        <span class="name" title=${t.name}>${Jt(t)}</span>
        ${t.number?B`<span class="num" title="Valve number">#${t.number}</span>`:q}
        ${null!==t.battery?B`<span class="battery ${t.badges.includes("low_battery")?"low":""}" title="Battery ${Math.round(t.battery)} %"
              ><ha-icon icon=${n=t.battery,n>=95?"mdi:battery":n<10?"mdi:battery-outline":"mdi:battery-"+10*Math.floor(n/10)}></ha-icon>${Math.round(t.battery)} %</span
            >`:q}
      </div>
      ${s?B`<div class="place dim" title="Metering point · site">
            <ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${s}</span>
          </div>`:q}
      ${this._status(t)}
      <dl>
        <dt title="Last run"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run: start · duration${t.has_flow_meter?" · water":""}">${t.last?Gt(t.last):"–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${t.next?Gt(t.next):"–"}</dd>
      </dl>
      ${this._week(t)}
      ${t.badges.length?B`<div class="badges">
            ${t.badges.map(e=>B`<span class="badge ${e}" title=${Ft[e]}>${qt[e]}${"missed"===e&&t.missed>1?` ${t.missed}`:""}</span>`)}
          </div>`:q}
    </ha-card>`;var n}}Kt.styles=r`
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
  `,t([pt({attribute:!1})],Kt.prototype,"summary",void 0),t([pt({attribute:!1})],Kt.prototype,"siteContext",void 0),customElements.get("xt-valve-card")||customElements.define("xt-valve-card",Kt);class Zt extends ot{constructor(){super(...arguments),this.collapsed=!1}render(){const t=this.section;return t?B`
      <button class="title" @click=${()=>this.collapsed=!this.collapsed} aria-expanded=${!this.collapsed}>
        <span>${t.title}</span><span class="count">${t.count}</span>
        <ha-icon icon=${this.collapsed?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
      </button>
      ${this.collapsed?q:t.groups.map(t=>B`
              ${t.title?B`<div class="group">${t.title} <span class="count">${t.valves.length}</span></div>`:q}
              <div class="grid">${t.valves.map(t=>B`<xt-valve-card .summary=${t}></xt-valve-card>`)}</div>
            `)}
    `:q}}Zt.styles=r`
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
  `,t([pt({attribute:!1})],Zt.prototype,"section",void 0),t([pt({type:Boolean,reflect:!0})],Zt.prototype,"collapsed",void 0),customElements.get("xt-valve-section")||customElements.define("xt-valve-section",Zt);const Yt="xt-valves-filter";class Qt extends ot{constructor(){super(...arguments),this._filter=function(){try{return{...Pt,...JSON.parse(localStorage.getItem(Yt)??"{}")}}catch{return Pt}}(),this._farm=new Mt(this)}setConfig(t){this._config=t}getCardSize(){return 12}_onFilter(t){this._filter=t.detail,function(t){try{localStorage.setItem(Yt,JSON.stringify(t))}catch{}}(t.detail)}_onOpen(t){Dt(t.detail)}render(){if(!this._config||!this.hass)return q;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading valves…</div></ha-card>`;const t=this._farm.summaries(),e=this._farm.data,i=this._config.site??null,s={...this._filter,site:i??this._filter.site},n=zt(t,{...s,status:"all"},e.sites),a={};for(const t of["all","watering","attention","offline"])a[t]="all"===t?n.length:zt(n,{...Pt,status:t},e.sites).length;const r=function(t,e,i=Ot){const s=(t,e)=>t.name.localeCompare(e.name),n=(t,e)=>({key:t,title:Nt[t],groups:[{site:null,title:"",valves:[...e].sort(s)}],count:e.length}),a=t.filter(t=>"offline"!==t.status),r=a.filter(t=>t.location),o=new Map;for(const t of r){const e=t.site?.id??null;o.set(e,[...o.get(e)??[],t])}const l=[...o.entries()].map(([t,i])=>({site:t,title:t?Tt(e,t):"No site",valves:i.sort(s)})).sort((t,e)=>null===t.site?1:null===e.site?-1:t.title.localeCompare(e.title)),d={watering:n("watering",a.filter(t=>"watering"===t.status)),attention:n("attention",a.filter(Ut)),sites:{key:"sites",title:Nt.sites,groups:l,count:r.length},offline:n("offline",t.filter(t=>"offline"===t.status)),unassigned:n("unassigned",a.filter(t=>!t.location))};return i.map(t=>d[t]).filter(t=>t.count>0)}(zt(n,{...Pt,status:s.status},e.sites),e.sites,this._config.sections??Ot),o=new Set(this._config.collapsed??["offline"]);return B`
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
    `}}Qt.styles=r`
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
  `,t([pt({attribute:!1})],Qt.prototype,"hass",void 0),t([ht()],Qt.prototype,"_config",void 0),t([ht()],Qt.prototype,"_filter",void 0),customElements.get("irrigation-valves-card")||customElements.define("irrigation-valves-card",Qt);const Xt="__no_site__";function te(t,e){return t.filter(t=>t.parent_id===e).sort((t,e)=>t.name.localeCompare(e.name))}function ee(t,e,i){const s=t===Xt,n=s?null:e.sites.find(e=>e.id===t)??null,a=s?null:Lt(e.sites,t),r=t=>a?!!t&&a.has(t):!t,o=i.filter(t=>t.location&&r(t.site?.id)),l=o.filter(t=>"offline"!==t.status),d=[0,0,0,0,0,0,0];let c=0,p=0;for(const t of o)c+=t.week.runs,p+=t.week.liters,"L"===t.week.unit&&t.week.daily.forEach((t,e)=>d[e]+=t);const h=t=>o.map(t).filter(t=>"number"==typeof t),u=h(t=>t.last?.start),m=h(t=>t.next?.start),f=s?null:function(t,e){const i=new Map(t.sites.map(t=>[t.id,t]));for(let s=i.get(e),n=0;s&&n<20;s=s.parent_id?i.get(s.parent_id):void 0,n++){const i=t.pumpAssignments.find(t=>"site"===t.target_kind&&t.target_id===s.id),n=i&&t.pumps.find(t=>t.id===i.pump_id);if(n)return{pump:n,via:s.id===e?null:s.name}}return null}(e,t);return{id:t,name:n?.name??"No site",path:n?Tt(e.sites,n.id):"No site",parent_id:n?.parent_id??null,children:s?[]:te(e.sites,t).map(t=>t.id),mps:e.locations.filter(t=>r(t.site_id)).length,valves:o.length,online:l.length,watering:l.filter(t=>"watering"===t.status).length,attention:l.filter(Ut).length,offline:o.length-l.length,last:u.length?Math.max(...u):null,next:m.length?Math.min(...m):null,week:{runs:c,liters:p,daily:d},pump:f?{name:f.pump.name,via:f.via}:null}}class ie extends ot{_open(){this.summary&&this.dispatchEvent(new CustomEvent("xt-site-open",{detail:this.summary.id,bubbles:!0,composed:!0}))}render(){const t=this.summary;if(!t)return q;const e=t.watering?B`<span class="status watering" title="Valves watering now"><i></i>${t.watering} watering</span>`:B`<span class="status" title="Valves online / valves in this site"><i></i>${t.online} / ${t.valves} online</span>`;return B`<ha-card @click=${this._open} tabindex="0" role="link" aria-label=${t.path}>
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
        <dd title="Last run in this site">${t.last?It(t.last):"–"}</dd>
        <dt title="Next planned run in this site"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run in this site">${t.next?It(t.next):"–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${t.week.daily}></xt-week-bars>
        <span class="dim" title="Last 7 days: runs and water of all valves in this site"
          >${t.week.runs} runs · ${Bt(t.week.liters)}</span
        >
      </div>
      ${t.attention||t.offline?B`<div class="badges">
            ${t.attention?B`<span class="badge warn" title="Valves with a warning (battery, no report, missed run, no water)"
                  >${t.attention} need attention</span
                >`:q}
            ${t.offline?B`<span class="badge" title="Valves not reachable">${t.offline} offline</span>`:q}
          </div>`:q}
    </ha-card>`}}ie.styles=r`
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
      background: var(--success-color, #4caf50);
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
      background: color-mix(in srgb, var(--disabled-text-color, #bdbdbd) 30%, transparent);
    }
    .badge.warn {
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
    }
  `,t([pt({attribute:!1})],ie.prototype,"summary",void 0),customElements.get("xt-site-card")||customElements.define("xt-site-card",ie);class se extends ot{constructor(){super(...arguments),this.sites=[],this.selected=null,this.counts={},this.noSite=!1,this._closed=new Set}_open(t){this.dispatchEvent(new CustomEvent("xt-site-open",{detail:t,bubbles:!0,composed:!0}))}_toggle(t,e){t.stopPropagation();const i=new Set(this._closed);i.has(e)?i.delete(e):i.add(e),this._closed=i}_node(t,e){const i=te(this.sites,t.id),s=this._closed.has(t.id);return B`
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
      ${te(this.sites,null).map(t=>this._node(t,0))}
      ${this.noSite?B`<button class="node ${this.selected===Xt?"on":""}" @click=${()=>this._open(Xt)}>
            <span class="chev"></span><span class="label dim">No site</span>
            <span class="count">${this.counts[Xt]??""}</span>
          </button>`:q}
    `}}se.styles=r`
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
      color: var(--secondary-text-color);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--secondary-text-color);
    }
    .count {
      color: var(--secondary-text-color);
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
    }
  `,t([pt({attribute:!1})],se.prototype,"sites",void 0),t([pt({attribute:!1})],se.prototype,"selected",void 0),t([pt({attribute:!1})],se.prototype,"counts",void 0),t([pt({type:Boolean})],se.prototype,"noSite",void 0),t([ht()],se.prototype,"_closed",void 0),customElements.get("xt-site-tree")||customElements.define("xt-site-tree",se);function ne(){return new URLSearchParams(window.location.search).get("site")}class ae extends ot{constructor(){super(...arguments),this._selected=ne(),this._edit=!1,this._busy=!1,this._error=null,this._farm=new Mt(this),this._onLocation=()=>{this._selected=ne()}}setConfig(t){}getCardSize(){return 12}connectedCallback(){super.connectedCallback(),window.addEventListener("location-changed",this._onLocation),window.addEventListener("popstate",this._onLocation)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocation),window.removeEventListener("popstate",this._onLocation)}_open(t){const e=new URL(window.location.href);t?e.searchParams.set("site",t):e.searchParams.delete("site"),window.history.pushState(null,"",e.pathname+e.search),this._selected=t,this._error=null}async _post(t){if(!this.hass?.callApi)return!1;this._busy=!0,this._error=null;try{return await this.hass.callApi("POST","xtend_tuya/irrigation_locations",t),await this._farm.refresh(!0),!0}catch(t){const e=t;return this._error=e.body?.error??e.message??String(t),!1}finally{this._busy=!1}}async _createSite(t,e){const i=t.querySelector("input");i.value.trim()&&await this._post({action:"create_site",name:i.value,parent_id:e})&&(i.value="")}async _saveSite(t,e){const i=t.querySelector("input").value,s=t.querySelector("select").value||null;await this._post({action:"update_site",id:e.id,name:i,parent_id:s})}async _deleteSite(t){await this._post({action:"delete_site",id:t.id})&&this._open(t.parent_id)}_header(t,e){const i=[{id:null,name:"All sites"}];if(t&&t.id!==Xt){const e=new Map(this._farm.data.sites.map(t=>[t.id,t])),s=[];for(let i=e.get(t.id);i&&s.length<20;i=i.parent_id?e.get(i.parent_id):void 0)s.unshift(i);i.push(...s.map(t=>({id:t.id,name:t.name})))}else t&&i.push({id:Xt,name:"No site"});const s=i[i.length-1].name;return B`<div class="header">
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
              ${t.attention?B`<span class="warn" title="Valves with a warning">${t.attention} need attention</span>`:q}
              <span title="Last 7 days"
                ><xt-week-bars .daily=${t.week.daily}></xt-week-bars>${t.week.runs} runs · ${Bt(t.week.liters)}</span
              >
              ${t.pump?B`<span title="Pump"><ha-icon icon="mdi:pump"></ha-icon>${t.pump.name}${t.pump.via?` · via ${t.pump.via}`:""}</span>`:q}
            `:B`
              <span><ha-icon icon="mdi:sprout-outline"></ha-icon>${e.sites} sites</span>
              <span><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${e.mps} metering points</span>
              <span><ha-icon icon="mdi:valve"></ha-icon>${e.online} / ${e.valves} online</span>
            `}
      </div>
    </div>`}_editSite(t){const e=this._farm.data.sites,i=Lt(e,t.id),s=e.filter(t=>!i.has(t.id)).map(t=>({id:t.id,path:Tt(e,t.id)})).sort((t,e)=>t.path.localeCompare(e.path)),n=!e.some(e=>e.parent_id===t.id)&&!this._farm.data.locations.some(e=>e.site_id===t.id);return B`<form class="editor" @submit=${e=>(e.preventDefault(),this._saveSite(e.target,t))}>
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
    </form>`}_mpCard(t,e){const i=t.valve?e.get(t.valve):void 0,s=i?B`<xt-valve-card .summary=${i} .siteContext=${t.site_id}></xt-valve-card>`:B`<ha-card class="empty-mp"
          ><strong>${t.name}</strong><span>No valve assigned</span></ha-card
        >`;if(!this._edit)return s;const n=this._farm.data.sites.map(t=>({id:t.id,path:Tt(this._farm.data.sites,t.id)})).sort((t,e)=>t.path.localeCompare(e.path));return B`<div class="mp-edit">
      ${s}
      <select
        aria-label="Move ${t.name} to site"
        ?disabled=${this._busy}
        @change=${e=>this._post({action:"set_location_site",location_id:t.id,site_id:e.target.value||null})}
      >
        <option value="" ?selected=${!t.site_id}>— no site —</option>
        ${n.map(e=>B`<option value=${e.id} ?selected=${e.id===t.site_id}>${e.path}</option>`)}
      </select>
    </div>`}render(){if(!this.hass)return q;if(!this._farm.loaded)return B`<ha-card><div class="msg">Loading sites…</div></ha-card>`;const t=this._farm.data,e=this._farm.summaries(),i=new Map(e.map(t=>[t.device_id,t])),s=t.locations.some(t=>!t.site_id),n=this._selected&&(this._selected===Xt||t.sites.some(t=>t.id===this._selected))?this._selected:null,a=n&&n!==Xt?t.sites.find(t=>t.id===n)??null:null,r=n?ee(n,t,e):null,o=n?r.children:[...te(t.sites,null).map(t=>t.id),...s?[Xt]:[]],l=o.map(i=>ee(i,t,e)),d=n?t.locations.filter(t=>n===Xt?!t.site_id:t.site_id===n).sort((t,e)=>t.name.localeCompare(e.name)):[],c={};for(const e of t.sites)c[e.id]=t.locations.filter(i=>Lt(t.sites,e.id).has(i.site_id??"")).length;c[Xt]=t.locations.filter(t=>!t.site_id).length;const p=e.filter(t=>t.location),h={sites:t.sites.length,mps:t.locations.length,valves:p.length,online:p.filter(t=>"offline"!==t.status).length};return B`<div class="layout" @xt-site-open=${t=>this._open(t.detail)} @xt-valve-open=${t=>Dt(t.detail)}>
      <aside>
        <xt-site-tree .sites=${t.sites} .selected=${n} .counts=${c} ?noSite=${s}></xt-site-tree>
      </aside>
      <main>
        ${this._header(r,h)}
        ${this._error?B`<div class="msg err">${this._error}</div>`:q}
        ${this._farm.error?B`<div class="msg err">Could not load farm data: ${this._farm.error}</div>`:q}
        ${this._edit&&a?this._editSite(a):q}
        ${l.length||this._edit&&n!==Xt?B`<h3>${n?"Sub-sites":"Sites"} <span class="count">${l.length}</span></h3>
              <div class="grid">${l.map(t=>B`<xt-site-card .summary=${t}></xt-site-card>`)}</div>
              ${this._edit&&n!==Xt?this._addSite(n):q}`:q}
        ${d.length?B`<h3>Metering points <span class="count">${d.length}</span></h3>
              <div class="grid">${d.map(t=>this._mpCard(t,i))}</div>`:q}
        ${n||t.sites.length?q:B`<div class="msg">No sites yet. Sites are created from the Tuya rooms once the valves report them, or by hand in Edit.</div>`}
      </main>
    </div>`}}ae.styles=r`
    :host {
      display: block;
      --xt-dim: var(--secondary-text-color, #727272);
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
      background: var(--state-switch-active-color, #f9a825);
    }
    .figures .warn {
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
    .empty-mp {
      padding: 12px 14px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: var(--xt-dim);
      font-size: 0.9rem;
    }
    .empty-mp strong {
      color: var(--primary-text-color);
      font-size: 1.05rem;
      font-weight: 500;
    }
    .mp-edit {
      display: flex;
      flex-direction: column;
      gap: 6px;
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
      color: var(--error-color, #db4437);
    }
    .msg {
      padding: 12px 0;
      color: var(--xt-dim);
    }
    .err {
      color: var(--error-color, #db4437);
    }
  `,t([pt({attribute:!1})],ae.prototype,"hass",void 0),t([ht()],ae.prototype,"_selected",void 0),t([ht()],ae.prototype,"_edit",void 0),t([ht()],ae.prototype,"_busy",void 0),t([ht()],ae.prototype,"_error",void 0),customElements.get("irrigation-sites-card")||customElements.define("irrigation-sites-card",ae);
