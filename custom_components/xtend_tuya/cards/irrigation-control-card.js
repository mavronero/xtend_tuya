function t(t,e,i,s){var r,n=arguments.length,o=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,i,o):r(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,_=globalThis,f=_.trustedTypes,g=f?f.emptyScript:"",m=_.reactiveElementPolyfillSupport,v=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!l(t,e),y={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);r?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:$).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const n=r.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const n=this.constructor;if(!1===s&&(r=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??b)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[v("elementProperties")]=new Map,x[v("finalized")]=new Map,m?.({ReactiveElement:x}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,S=w.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+k,M=`<${P}>`,O=document,T=()=>O.createComment(""),H=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,N="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,D=/>/g,L=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,F=/"/g,I=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),B=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),q=new WeakMap,J=O.createTreeWalker(O,129);function K(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":3===e?"<math>":"",o=R;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,h=0;for(;h<i.length&&(o.lastIndex=h,l=o.exec(i),null!==l);)h=o.lastIndex,o===R?"!--"===l[1]?o=z:void 0!==l[1]?o=D:void 0!==l[2]?(I.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=L):void 0!==l[3]&&(o=L):o===L?">"===l[0]?(o=r??R,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?L:'"'===l[3]?F:j):o===F||o===j?o=L:o===z||o===D?o=R:(o=L,r=void 0);const d=o===L&&t[e+1].startsWith("/>")?" ":"";n+=o===R?i+M:c>=0?(s.push(a),i.slice(0,c)+C+i.slice(c)+k+d):i+k+(-2===c?e:d)}return[K(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Q{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[l,c]=Z(t,e);if(this.el=Q.createElement(l,i),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=J.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(C)){const e=c[n++],i=s.getAttribute(t).split(k),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:i,ctor:"."===o[1]?et:"?"===o[1]?it:"@"===o[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(k)&&(a.push({type:6,index:r}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(k),e=t.length-1;if(e>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),J.nextNode(),a.push({type:2,index:++r});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===P)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(k,t+1));)a.push({type:7,index:r}),t+=k.length-1}r++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function G(t,e,i=t,s){if(e===B)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const n=H(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=G(t,r._$AS(t,e.values),r,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);J.currentNode=s;let r=J.nextNode(),n=0,o=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new Y(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new rt(r,this,t)),this._$AV.push(e),a=i[++o]}n!==a?.index&&(r=J.nextNode(),n++)}return J.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),H(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==B&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&H(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new Y(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=G(this,t,e,0),n=!H(t)||t!==this._$AH&&t!==B,n&&(this._$AH=t);else{const s=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=G(this,s[i+o],e,o),a===B&&(a=this._$AH[o]),n||=!H(a)||a!==this._$AH[o],a===V?t=V:t!==V&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}n&&!s&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class st extends tt{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??V)===B)return;const i=this._$AH,s=t===V&&i!==V||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==V&&(i===V||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(Q,Y),(w.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class at extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new Y(e.insertBefore(T(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:b},ht=(t=ct,e,i)=>{const{kind:s,metadata:r}=i;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function dt(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function pt(t){return dt({...t,state:!0,attribute:!1})}const ut=o`
  :host {
    --xt-water: var(--blue-color, #1e88e5);
    --xt-dim: var(--secondary-text-color, #727272);
    --xt-ok: var(--success-color, #4caf50);
    --xt-off: var(--disabled-text-color, #bdbdbd);
    --xt-warn: var(--warning-color, #ffa600);
    --xt-bad: var(--error-color, #db4437);
    --xt-track: var(--divider-color, #e0e0e0);
  }
`,_t=o`
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
`,ft=[300,600,900,1800],gt=[50,100,200];class mt extends at{constructor(){super(...arguments),this._mode="duration",this._target=300,this._initiatedHere=!1,this._tick=0,this._tickHandle=null}setConfig(t){if(!t.valve)throw new Error("Please define a valve switch entity");if(!t.device_id)throw new Error("Please define a device_id");this._config=t}getCardSize(){return 3}connectedCallback(){super.connectedCallback(),this._tickHandle=window.setInterval(()=>this._tick=Date.now(),1e3)}disconnectedCallback(){super.disconnectedCallback(),null!==this._tickHandle&&(window.clearInterval(this._tickHandle),this._tickHandle=null)}updated(t){t.has("hass")&&this.hass&&this._config&&void 0===t.get("hass")&&this._initTargetFromState()}_initTargetFromState(){if(!this._config.duration)return;const t=this.hass.states[this._config.duration];if(!t)return;const e=parseFloat(t.state);Number.isFinite(e)&&e>0&&(this._target=e)}_isOn(){const t=this.hass.states[this._config.valve];return"on"===t?.state}_activeMode(){if(!this._config.mode_sensor)return null;const t=this.hass.states[this._config.mode_sensor];return t?"duration"===t.state?"duration":"volume"===t.state?"volume":null:null}_targetValue(){if(!this._config.value_sensor)return null;const t=this.hass.states[this._config.value_sensor];if(!t)return null;const e=parseFloat(t.state);return Number.isFinite(e)?e:null}_startTime(){if(!this._config.start_time_sensor)return null;const t=this.hass.states[this._config.start_time_sensor];if(!t||!t.state)return null;const e=new Date(t.state.replace(" ","T"));return Number.isFinite(e.getTime())?e:null}_endTime(){if(!this._config.end_time_sensor)return null;const t=this.hass.states[this._config.end_time_sensor];if(!t||!t.state)return null;const e=new Date(t.state.replace(" ","T"));return Number.isFinite(e.getTime())?e:null}_runTiming(){const t=this._startTime(),e=this._endTime();if(!t||!e||!this._config.start_time_sensor)return null;const i=(e.getTime()-t.getTime())/1e3;if(!(i>0)||i>=86400)return null;const s=this.hass.states[this._config.start_time_sensor];if(!s?.last_changed)return null;const r=(Date.now()-new Date(s.last_changed).getTime())/1e3;return r<0||r>=i?null:{total:i,elapsed:r,remaining:Math.max(0,i-r)}}_currentVolume(){if(!this._config.volume_sensor)return null;const t=this.hass.states[this._config.volume_sensor];if(!t)return null;const e=parseFloat(t.state);return Number.isFinite(e)?e:null}_valveName(){if(!this._config.registry_entity)return null;const t=this.hass.states[this._config.registry_entity];return t?.attributes?.valve_name??null}_valveLocation(){if(!this._config.registry_entity)return null;const t=this.hass.states[this._config.registry_entity],e=t?.attributes?.valve_home,i=t?.attributes?.valve_room,s=[e,i].filter(t=>t&&String(t).trim());return s.length?s.join(" · "):null}async _toggleManual(){if(!this.hass)return;this._initiatedHere=!1;const t=this._isOn()?"turn_off":"turn_on";await this.hass.callService("switch",t,{entity_id:this._config.valve})}async _startSingleWatering(){if(this.hass){this._initiatedHere=!0;try{await this.hass.callService("xtend_tuya","fdm5kw_start_watering",{device_id:this._config.device_id,mode:this._mode,value:Math.max(1,Math.round(this._target))})}catch(t){throw this._initiatedHere=!1,t}}}async _stop(){if(this.hass){this._initiatedHere=!1;try{await this.hass.callService("xtend_tuya","fdm5kw_stop_watering",{device_id:this._config.device_id})}catch{await this.hass.callService("switch","turn_off",{entity_id:this._config.valve})}}}render(){if(!this._config||!this.hass)return V;const t=this.hass.states[this._config.valve]?.attributes?.friendly_name,e=this._config.name??this._valveName()??t?.replace(/\s+Valve$/i,"")??"Watering",i=this._valveLocation(),s=this._isOn(),r=this._startTime(),n=this._runTiming(),o=s&&(null!==n||this._initiatedHere);return W`
      <ha-card>
        <div class="titlebar">
          <ha-icon icon="mdi:water-pump"></ha-icon>
          <div class="title">
            <b>Water now</b>
            <span title=${i??""}>${e}${i?` · ${i}`:""}</span>
          </div>
          ${this._renderStatus(s,o)}
        </div>
        <div class="body">${o?this._renderProgress(r):this._renderControls()}</div>
      </ha-card>
    `}_renderStatus(t,e){return e?W`<span class="status watering" title="A watering cycle is running"><i></i>Watering</span>`:t?W`<span class="status manual" title="Opened by hand: it will not stop by itself"><i></i>Open, no auto-stop</span>`:W`<span class="status" title="Closed"><i></i>Idle</span>`}_renderProgress(t){this._tick;const e=this._activeMode()??this._mode,i=this._targetValue()??this._target;if("volume"===e){const t=this._currentVolume()??0,e=i>0?Math.min(100,t/i*100):0,s=Math.max(0,i-t);return W`
        <div class="progress">
          <div class="progress-text"><span class="big">${s.toFixed(0)} L</span><span class="dim">to go of ${i} L</span></div>
          <div class="bar"><div class="fill" style="width:${e}%"></div></div>
          <div class="dim">${t.toFixed(1)} L delivered</div>
        </div>
        <button class="btn wide" @click=${this._stop}><ha-icon icon="mdi:stop"></ha-icon>Stop watering</button>
      `}const s=this._runTiming();let r,n,o;if(null!==s)({total:r,elapsed:n,remaining:o}=s);else{r=i;const e=t?(Date.now()-t.getTime())/1e3:0;n=Math.max(0,Math.min(r,e)),o=Math.max(0,r-n)}const a=r>0?Math.min(100,n/r*100):0;return W`
      <div class="progress">
        <div class="progress-text"><span class="big">${vt(o)}</span><span class="dim">left of ${vt(r)}</span></div>
        <div class="bar"><div class="fill" style="width:${a}%"></div></div>
        <div class="dim">${vt(n)} elapsed</div>
      </div>
      <button class="btn wide" @click=${this._stop}><ha-icon icon="mdi:stop"></ha-icon>Stop watering</button>
    `}_renderControls(){const t="duration"===this._mode,e=t?ft:gt,i=t?Math.max(1,Math.round(this._target/60)):this._target;return W`
      <div class="chips" role="group" aria-label="Water by">
        <button class="chip ${t?"on":""}" aria-pressed=${t} @click=${()=>this._setMode("duration")}>
          <ha-icon icon="mdi:timer-outline"></ha-icon>Time
        </button>
        <button class="chip ${t?"":"on"}" aria-pressed=${!t} @click=${()=>this._setMode("volume")}>
          <ha-icon icon="mdi:water"></ha-icon>Amount
        </button>
      </div>
      <div class="chips" role="group" aria-label="Quick amounts">
        ${e.map(e=>W`<button class="chip ${this._target===e?"on":""}" @click=${()=>this._target=e}>
            ${t?e/60+" min":`${e} L`}
          </button>`)}
      </div>
      <div class="field">
        <input
          type="number"
          min="1"
          max=${t?1440:9999}
          aria-label=${t?"Minutes":"Liters"}
          .value=${String(i)}
          @change=${e=>{const i=parseFloat(e.target.value);Number.isFinite(i)&&i>0&&(this._target=t?Math.round(60*i):i)}}
        />
        <span class="unit">${t?"min":"L"}</span>
      </div>
      <button class="btn primary wide" @click=${this._startSingleWatering}>
        <ha-icon icon="mdi:play"></ha-icon>Start watering · ${t?`${i} min`:`${i} L`}
      </button>
      <button
        class="btn wide ${this._isOn()?"warn":""}"
        @click=${this._toggleManual}
        title=${this._isOn()?"Close the valve":"Open the valve by hand: it will not stop by itself"}
      >
        <ha-icon icon=${this._isOn()?"mdi:valve-closed":"mdi:valve-open"}></ha-icon>
        ${this._isOn()?"Close valve":"Open valve (no auto-stop)"}
      </button>
    `}_setMode(t){this._mode!==t&&("duration"===t&&this._target<5&&(this._target=300),"volume"===t&&this._target>1e3&&(this._target=50),this._mode=t)}}function vt(t){if(!Number.isFinite(t)||t<0)return"0:00";const e=Math.round(t),i=Math.floor(e/3600),s=Math.floor(e%3600/60),r=e%60;return i>0?`${i}:${String(s).padStart(2,"0")}:${String(r).padStart(2,"0")}`:`${s}:${String(r).padStart(2,"0")}`}if(mt.styles=[ut,_t,o`
      .progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .progress-text {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-variant-numeric: tabular-nums;
      }
      .progress-text .big {
        font-size: 2em;
        font-weight: 500;
      }
      .bar {
        height: 8px;
        background: var(--xt-track);
        border-radius: 4px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        background: var(--xt-water);
        transition: width 0.5s linear;
      }
    `],t([dt({attribute:!1})],mt.prototype,"hass",void 0),t([pt()],mt.prototype,"_config",void 0),t([pt()],mt.prototype,"_mode",void 0),t([pt()],mt.prototype,"_target",void 0),t([pt()],mt.prototype,"_initiatedHere",void 0),t([pt()],mt.prototype,"_tick",void 0),!customElements.get("irrigation-control-card")){customElements.define("irrigation-control-card",mt);const t=window;t.customCards=t.customCards||[],t.customCards.some(t=>"irrigation-control-card"===t.type)||t.customCards.push({type:"irrigation-control-card",name:"Irrigation Control",description:"Toggle a valve, start a single watering cycle by duration or volume, and watch progress live."})}export{mt as IrrigationControlCard};
