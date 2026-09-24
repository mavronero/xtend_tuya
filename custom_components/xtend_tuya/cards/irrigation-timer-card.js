function t(t,e,i,s){var r,n=arguments.length,o=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,i,o):r(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,_=f?f.emptyScript:"",g=m.reactiveElementPolyfillSupport,$=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?_:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);r?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=s;const n=r.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const n=this.constructor;if(!1===s&&(r=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??y)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[$("elementProperties")]=new Map,x[$("finalized")]=new Map,g?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,S=w.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+M,T=`<${C}>`,P=document,O=()=>P.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,R="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,z=/>/g,j=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,I=/"/g,B=/^(?:script|style|textarea|title)$/i,V=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),F=new WeakMap,J=P.createTreeWalker(P,129);function K(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":3===e?"<math>":"",o=H;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,d=0;for(;d<i.length&&(o.lastIndex=d,l=o.exec(i),null!==l);)d=o.lastIndex,o===H?"!--"===l[1]?o=D:void 0!==l[1]?o=z:void 0!==l[2]?(B.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=j):void 0!==l[3]&&(o=j):o===j?">"===l[0]?(o=r??H,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?j:'"'===l[3]?I:L):o===I||o===L?o=j:o===D||o===z?o=H:(o=j,r=void 0);const h=o===j&&t[e+1].startsWith("/>")?" ":"";n+=o===H?i+T:c>=0?(s.push(a),i.slice(0,c)+k+i.slice(c)+M+h):i+M+(-2===c?e:h)}return[K(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Q{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[l,c]=Z(t,e);if(this.el=Q.createElement(l,i),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=J.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=c[n++],i=s.getAttribute(t).split(M),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:i,ctor:"."===o[1]?et:"?"===o[1]?it:"@"===o[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(M)&&(a.push({type:6,index:r}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(M),e=t.length-1;if(e>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),J.nextNode(),a.push({type:2,index:++r});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===C)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(M,t+1));)a.push({type:7,index:r}),t+=M.length-1}r++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function G(t,e,i=t,s){if(e===W)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const n=N(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=G(t,r._$AS(t,e.values),r,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);J.currentNode=s;let r=J.nextNode(),n=0,o=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new Y(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new rt(r,this,t)),this._$AV.push(e),a=i[++o]}n!==a?.index&&(r=J.nextNode(),n++)}return J.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),N(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&N(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new Y(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=G(this,t,e,0),n=!N(t)||t!==this._$AH&&t!==W,n&&(this._$AH=t);else{const s=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=G(this,s[i+o],e,o),a===W&&(a=this._$AH[o]),n||=!N(a)||a!==this._$AH[o],a===q?t=q:t!==q&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}n&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??q)===W)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(Q,Y),(w.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class at extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new Y(e.insertBefore(O(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:y},dt=(t=ct,e,i)=>{const{kind:s,metadata:r}=i;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ht(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function pt(t){return ht({...t,state:!0,attribute:!1})}var ut;!function(t){t[t.Duration=0]="Duration",t[t.Volume=1]="Volume"}(ut||(ut={}));const mt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],ft=o`
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
`;function gt(t){if(!(127&~t))return"Every day";if(31==(127&t))return"Mon–Fri";if(96==(127&t))return"Sat, Sun";const e=mt.filter((e,i)=>t&1<<i);return e.length?e.join(", "):"No days"}function $t(t){let e=0;for(let i=0;i<7;i++)t&1<<i&&e++;return e}const vt=[5,10,15,30],yt=[50,100,200];class bt extends at{constructor(){super(...arguments),this._timers=new Map,this._editing=null,this._isNew=!1,this._resyncing=!1,this._resyncStatus=null}setConfig(t){if(!t.entity)throw new Error("Please define an entity (timer registry sensor)");if(!t.device_id)throw new Error("Please define a device_id");this._config=t}getCardSize(){return 4}updated(t){t.has("hass")&&this.hass&&this._updateTimersFromState()}_updateTimersFromState(){const t=this.hass.states[this._config.entity];if(!t)return;const e=t.attributes?.slots;if(!e)return;const i=new Map;for(let t=0;t<7;t++){const s=e[String(t)];s&&i.set(t,{slot:t,mode:"volume"===s.mode?ut.Volume:ut.Duration,value:s.value,hour:s.hour,minute:s.minute,daysMask:s.days_mask,enabled:s.enabled})}this._timers=i}_newTimer(){for(let t=0;t<7;t++)if(!this._timers.has(t))return{slot:t,mode:ut.Duration,value:900,hour:6,minute:0,daysMask:127,enabled:!0};return{slot:0,mode:ut.Duration,value:900,hour:6,minute:0,daysMask:127,enabled:!0}}async _sendSetTimer(t){await this.hass.callService("xtend_tuya","fdm5kw_set_timer",{device_id:this._config.device_id,slot:t.slot,hour:t.hour,minute:t.minute,mode:t.mode===ut.Volume?"volume":"duration",value:t.value,days:t.daysMask,enabled:t.enabled})}async _sendDeleteTimer(t){await this.hass.callService("xtend_tuya","fdm5kw_delete_timer",{device_id:this._config.device_id,slot:t})}async _saveTimer(){this._editing&&(await this._sendSetTimer(this._editing),this._timers=new Map(this._timers),this._timers.set(this._editing.slot,{...this._editing}),this._editing=null,this._isNew=!1)}async _deleteTimer(t){await this._sendDeleteTimer(t),this._timers=new Map(this._timers),this._timers.delete(t)}async _resync(){if(!this._resyncing){this._resyncing=!0,this._resyncStatus=null;try{const t=await this.hass.callService("xtend_tuya","fdm5kw_resync_timers",{device_id:this._config.device_id},void 0,void 0,!0),e=t?.response??{};if(!1===e.success)this._resyncStatus=`Resync failed: ${e.error??"unknown"}`;else{const t=e.orphans_cleared??0,i=[];0===t?i.push("All in sync"):i.push(`Cleared ${t} zombie${1===t?"":"s"}`),e.orphans_deferred&&i.push(`${e.orphans_deferred} deferred (quota)`),this._resyncStatus=i.join(" · ")}}catch(t){this._resyncStatus=`Resync failed: ${t}`}finally{this._resyncing=!1,window.setTimeout(()=>{this._resyncStatus=null},5e3)}}}_startEdit(t){this._editing={...t},this._isNew=!1}_startNew(){this._editing=this._newTimer(),this._isNew=!0}_cancelEdit(){this._editing=null,this._isNew=!1}render(){if(!this._config||!this.hass)return q;const t=this.hass.states[this._config.entity]?.attributes,e=t?.valve_name,i=this._config.name??e??t?.friendly_name??"Irrigation Timer",s=t?.valve_home,r=t?.valve_room,n=[s,r].filter(t=>t&&String(t).trim()).join(" · ");return V`
      <ha-card>
        <div class="titlebar">
          <ha-icon icon="mdi:calendar-clock"></ha-icon>
          <div class="title">
            <b>Schedule</b>
            <span title=${n}>${i}${n?` · ${n}`:""}</span>
          </div>
          <button
            class="icon-btn ${this._resyncing?"spinning":""}"
            title="Check the timers against the Tuya cloud (clears ghost timers)"
            aria-label="Resync timers"
            ?disabled=${this._resyncing}
            @click=${this._resync}
          >
            <ha-icon icon="mdi:cloud-sync-outline"></ha-icon>
          </button>
        </div>
        ${this._resyncStatus?V`<div class="resync-status">${this._resyncStatus}</div>`:q}
        <div class="body">${this._editing?this._renderEditor():this._renderList()}</div>
      </ha-card>
    `}_renderList(){const t=Array.from(this._timers.values()).sort((t,e)=>60*t.hour+t.minute-(60*e.hour+e.minute)),e=t.filter(t=>t.enabled),i=e.filter(t=>t.mode===ut.Duration).reduce((t,e)=>t+e.value/60*$t(e.daysMask),0),s=e.filter(t=>t.mode!==ut.Duration).reduce((t,e)=>t+e.value*$t(e.daysMask),0),r=[i?`${Math.round(i)} min`:"",s?`${Math.round(s)} L`:""].filter(Boolean).join(" + ");return V`
      ${0===t.length?V`<div class="empty">No timers yet. This valve only waters when started by hand.</div>`:V`<div class="rows">${t.map(t=>this._renderTimerRow(t))}</div>`}
      ${t.length?V`<div class="summary dim" title="What the enabled timers water in a week">
            ${e.length} of ${t.length} on${r?V` · <b>${r}</b> per week`:""}
          </div>`:q}
      <button class="btn wide" @click=${this._startNew}><ha-icon icon="mdi:plus"></ha-icon>Add timer</button>
    `}_renderTimerRow(t){const e=`${t.hour.toString().padStart(2,"0")}:${t.minute.toString().padStart(2,"0")}`;return V`
      <div class="row ${t.enabled?"":"disabled"}">
        <button class="info" @click=${()=>this._startEdit(t)} title="Edit this timer">
          <span class="when">
            <span class="time">${e}</span>
            <span class="amount" title=${t.mode===ut.Duration?"Duration":"Volume"}>${function(t){return t.mode!==ut.Duration?`${t.value} L`:t.value<60?`${t.value} s`:t.value%60==0?t.value/60+" min":`${Math.floor(t.value/60)} min ${t.value%60} s`}(t)}</span>
          </span>
          <span class="days">
            <span class="dots" aria-hidden="true">
              ${mt.map((e,i)=>V`<i class=${t.daysMask&1<<i?"on":""} title=${e}>${e.charAt(0)}</i>`)}
            </span>
            <span class="dim">${gt(t.daysMask)}</span>
          </span>
        </button>
        <ha-switch
          .checked=${t.enabled}
          title=${t.enabled?"On: turn off to pause this timer":"Off: turn on to use this timer"}
          @change=${e=>this._toggleEnabled(t,e)}
        ></ha-switch>
      </div>
    `}async _toggleEnabled(t,e){const i=e.target.checked,s={...t,enabled:i};await this._sendSetTimer(s),this._timers=new Map(this._timers),this._timers.set(t.slot,s)}_renderEditor(){const t=this._editing,e=t.mode===ut.Duration,i=e?Math.max(1,Math.round(t.value/60)):t.value,s=e=>this._editing={...t,...e};return V`
      <div class="editor">
        <div class="label">Start</div>
        <div class="field">
          <input
            type="time"
            aria-label="Start time"
            .value=${`${t.hour.toString().padStart(2,"0")}:${t.minute.toString().padStart(2,"0")}`}
            @change=${t=>{const[e,i]=t.target.value.split(":");s({hour:parseInt(e,10),minute:parseInt(i,10)})}}
          />
        </div>

        <div class="label">Water by</div>
        <div class="chips" role="group" aria-label="Water by">
          <button class="chip ${e?"on":""}" aria-pressed=${e}
            @click=${()=>s({mode:ut.Duration,value:e?t.value:900})}>
            <ha-icon icon="mdi:timer-outline"></ha-icon>Time
          </button>
          <button class="chip ${e?"":"on"}" aria-pressed=${!e}
            @click=${()=>s({mode:ut.Volume,value:e?50:t.value})}>
            <ha-icon icon="mdi:water"></ha-icon>Amount
          </button>
        </div>
        <div class="chips" role="group" aria-label="Quick amounts">
          ${(e?vt:yt).map(t=>V`<button class="chip ${i===t?"on":""}" @click=${()=>s({value:e?60*t:t})}>
              ${t} ${e?"min":"L"}
            </button>`)}
        </div>
        <div class="field">
          <input
            type="number"
            min="1"
            max=${e?1440:9999}
            aria-label=${e?"Minutes":"Liters"}
            .value=${String(i)}
            @change=${t=>{const i=parseInt(t.target.value,10);Number.isFinite(i)&&i>0&&s({value:e?60*i:i})}}
          />
          <span class="unit">${e?"min":"L"}</span>
        </div>

        <div class="label">Days · ${gt(t.daysMask)}</div>
        <div class="day-picker" role="group" aria-label="Days">
          ${mt.map((e,i)=>V`<button
              class="day ${t.daysMask&1<<i?"on":""}"
              aria-pressed=${!!(t.daysMask&1<<i)}
              title=${e}
              @click=${()=>s({daysMask:t.daysMask^1<<i})}
            >
              ${e.slice(0,2)}
            </button>`)}
        </div>
        <div class="chips">
          <button class="chip" @click=${()=>s({daysMask:127})}>Every day</button>
          <button class="chip" @click=${()=>s({daysMask:31})}>Mon–Fri</button>
          <button class="chip" @click=${()=>s({daysMask:96})}>Weekend</button>
        </div>

        <div class="actions">
          ${this._isNew?q:V`<button
                class="btn danger"
                @click=${()=>{this._deleteTimer(t.slot),this._editing=null,this._isNew=!1}}
              >
                <ha-icon icon="mdi:delete-outline"></ha-icon>Delete
              </button>`}
          <span class="spacer"></span>
          <button class="btn" @click=${this._cancelEdit}>Cancel</button>
          <button class="btn primary" @click=${this._saveTimer} ?disabled=${!t.daysMask}>Save</button>
        </div>
      </div>
    `}}if(bt.styles=[ft,_t,o`
      .resync-status {
        margin: 0 16px;
        font-size: 0.8em;
        color: var(--xt-dim);
        text-align: right;
      }
      .icon-btn.spinning ha-icon {
        animation: resync-spin 1s linear infinite;
      }
      @keyframes resync-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty {
        color: var(--xt-dim);
        padding: 8px 0;
      }
      .rows {
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--xt-track);
      }
      .row:last-child {
        border-bottom: none;
      }
      .row.disabled .info {
        opacity: 0.45;
      }
      .info {
        all: unset;
        flex: 1;
        min-width: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-radius: 8px;
      }
      .info:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .when {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      .time {
        font-size: 1.4em;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .amount {
        color: var(--xt-water);
        font-weight: 500;
      }
      .days {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.85em;
      }
      .dots {
        display: inline-flex;
        gap: 3px;
      }
      .dots i {
        font-style: normal;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        font-size: 0.7em;
        display: inline-grid;
        place-items: center;
        color: var(--xt-dim);
        background: color-mix(in srgb, var(--xt-track) 60%, transparent);
      }
      .dots i.on {
        background: var(--xt-water);
        color: #fff;
      }
      .summary b {
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .editor .label {
        margin-top: 4px;
      }
      .field input[type="time"] {
        width: 8em;
      }
      .day-picker {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .day {
        font: inherit;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--xt-track);
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .day.on {
        background: var(--xt-water);
        border-color: var(--xt-water);
        color: #fff;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .spacer {
        flex: 1;
      }
    `],t([ht({attribute:!1})],bt.prototype,"hass",void 0),t([pt()],bt.prototype,"_config",void 0),t([pt()],bt.prototype,"_timers",void 0),t([pt()],bt.prototype,"_editing",void 0),t([pt()],bt.prototype,"_isNew",void 0),t([pt()],bt.prototype,"_resyncing",void 0),t([pt()],bt.prototype,"_resyncStatus",void 0),!customElements.get("irrigation-timer-card")){customElements.define("irrigation-timer-card",bt);const t=window;t.customCards=t.customCards||[],t.customCards.some(t=>"irrigation-timer-card"===t.type)||t.customCards.push({type:"irrigation-timer-card",name:"Irrigation Timer",description:"Manage Tuya irrigation valve timer schedules"})}export{bt as IrrigationTimerCard};
