/* Мини-рантайм для страницы: шаблон <template id="tpl"> с {{дырами}}, <sc-if>, <sc-for>,
   обработчики data-dc-onclick / data-dc-onchange / data-dc-onsubmit="имя",
   булевы атрибуты data-dc-bool-disabled="путь" и класс Component (state / setState / renderVals).
   Перерисовка — через morphdom, поэтому поля ввода и CSS-анимации не сбрасываются. */
(function () {
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch, cb) {
    var p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, p);
    if (this.__render) this.__render();
    if (cb) cb();
  };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  function lookup(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null || typeof v === 'function' ? '' : String(v); });
  }
  function single(str) { var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str); return m ? m[1] : null; }

  function build(src, out, scope) {
    for (var n = src.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.nodeValue, scope))); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.localName;
      if (tag === 'sc-if') {
        var cond = lookup(single(n.getAttribute('value')) || '', scope);
        if (cond) build(n, out, scope);
        continue;
      }
      if (tag === 'sc-for') {
        var list = lookup(single(n.getAttribute('list')) || '', scope) || [], as = n.getAttribute('as') || 'item';
        for (var i = 0; i < list.length; i++) { var sc = Object.create(scope); sc[as] = list[i]; build(n, out, sc); }
        continue;
      }
      var el = n.cloneNode(false);
      for (var a = n.attributes.length - 1; a >= 0; a--) {
        var at = n.attributes[a], name = at.name, val = at.value;
        if (name.indexOf('hint-') === 0) { el.removeAttribute(name); continue; }
        if (name.indexOf('data-dc-bool-') === 0) {
          var prop = name.slice(13); el.removeAttribute(name);
          if (lookup(val, scope)) el.setAttribute(prop, ''); else el.removeAttribute(prop);
          continue;
        }
        var one = single(val);
        if (name.length > 2 && name.indexOf('on') === 0 && one) {
          el.removeAttribute(name); el.setAttribute('data-dc-' + name, one); continue;
        }
        if (val.indexOf('{{') === -1) continue;
        if (one) {
          var v = lookup(one, scope);
          if (v === true) { el.setAttribute(name, ''); continue; }
          if (v === false || v == null) { el.removeAttribute(name); continue; }
        }
        el.setAttribute(name, interp(val, scope));
      }
      var inner = n.localName === 'template' ? n.content : n;
      build(inner, el, scope);
      out.appendChild(el);
    }
  }

  window.mountDC = function (Component, props, root, tpl) {
    var comp = new Component(props || {}), vals = {};
    function render() {
      vals = comp.renderVals();
      var next = root.cloneNode(false);
      build(tpl.content, next, vals);
      if (root.__mounted) morphdom(root, next, { childrenOnly: true });
      else { while (next.firstChild) root.appendChild(next.firstChild); root.__mounted = true; }
    }
    comp.__render = render;
    function fire(attr, e) {
      var el = e.target && e.target.closest ? e.target.closest('[' + attr + ']') : null;
      if (!el || !root.contains(el)) return;
      var fn = lookup(el.getAttribute(attr), vals);
      if (typeof fn === 'function') fn(e);
    }
    root.addEventListener('click', function (e) { fire('data-dc-onclick', e); });
    root.addEventListener('submit', function (e) { fire('data-dc-onsubmit', e); });
    root.addEventListener('input', function (e) { var t = e.target.type; if (t !== 'checkbox' && t !== 'radio') fire('data-dc-onchange', e); });
    root.addEventListener('change', function (e) { var t = e.target.type; if (t === 'checkbox' || t === 'radio' || e.target.localName === 'select') fire('data-dc-onchange', e); });
    render();
    if (comp.componentDidMount) comp.componentDidMount();
    return comp;
  };
})();
