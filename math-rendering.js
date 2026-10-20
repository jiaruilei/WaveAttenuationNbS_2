(() => {
  'use strict';

  const baseURL = document.currentScript.src;
  document.documentElement.dataset.mathStatus = 'helper-loaded';
  const cache = new Map();
  const applied = new WeakMap();
  const pending = new WeakMap();
  let conversionQueue = Promise.resolve();
  let ready = false;
  let reportedFailure = false;

  function preserveFallback(error) {
    if (!reportedFailure) {
      console.warn('Math rendering is unavailable; keeping readable text labels.', error);
      reportedFailure = true;
    }
    return null;
  }

  function convert(tex, display) {
    const key = `${display ? 'block' : 'inline'}:${tex}`;
    if (cache.has(key)) return cache.get(key);
    const result = conversionQueue
      .then(() => window.MathJax.tex2svgPromise(tex, { display }))
      .then(node => node.querySelector('[data-mml-node="merror"]') ? null : node)
      .catch(preserveFallback);
    conversionQueue = result.then(() => undefined);
    cache.set(key, result);
    // Values can change frequently while sliders move; keep memory bounded.
    if (cache.size > 256) cache.delete(cache.keys().next().value);
    return result;
  }

  window.renderMath = (container = document) => {
    if (!ready || !container) return Promise.resolve();
    const elements = Array.from(container.querySelectorAll('[data-tex]'));
    if (container.matches?.('[data-tex]')) elements.unshift(container);
    return Promise.all(elements.map(element => {
      const tex = element.dataset.tex;
      const display = element.dataset.mathDisplay === 'block';
      const key = `${display ? 'block' : 'inline'}:${tex}`;
      if (applied.get(element) === key && element.querySelector('mjx-container')) return;
      if (pending.get(element)?.key === key) return pending.get(element).promise;

      const fallback = element.textContent;
      const request = { key };
      request.promise = convert(tex, display).then(node => {
        // A slider refresh may already have replaced this element or formula.
        if (!node || !element.isConnected || pending.get(element) !== request ||
            element.dataset.tex !== tex ||
            (element.dataset.mathDisplay === 'block') !== display) return;
        const rendered = node.cloneNode(true);
        rendered.setAttribute('aria-hidden', 'true');
        element.setAttribute('role', 'math');
        element.setAttribute('aria-label', fallback);
        element.replaceChildren(rendered);
        applied.set(element, key);
      }).finally(() => {
        if (pending.get(element) === request) pending.delete(element);
      });
      pending.set(element, request);
      return request.promise;
    }));
  };

  window.MathJax = {
    loader: {
      paths: { mathjax: new URL('vendor/mathjax', baseURL).href },
      failed(error) {
        document.documentElement.dataset.mathStatus = 'load-failed';
        preserveFallback(error);
      }
    },
    tex: {
      // All of these extensions are included in tex-svg.js. Explicitly omit
      // autoload and require: the exhibition only uses these fixed formulas.
      packages: ['base', 'ams', 'newcommand', 'configmacros', 'textmacros', 'noundefined']
    },
    output: {
      font: 'mathjax-newcm',
      fontPath: new URL('vendor/mathjax-newcm', baseURL).href
    },
    // Independent SVG paths can be cloned from our cache without duplicate
    // definition IDs or references to discarded formulas.
    svg: { fontCache: 'none' },
    options: {
      enableMenu: false,
      menuOptions: {
        settings: {
          enrich: false,
          speech: false,
          braille: false,
          collapsible: false,
          assistiveMml: false
        }
      },
      // Combined MathJax v4 bundles include a speech worker. The labels here
      // have their own readable aria-labels, so omit these conversion actions
      // even if a visitor has saved MathJax menu preferences on this origin.
      renderActions: {
        enrich: [],
        attachSpeech: [],
        explorable: []
      },
      enableEnrichment: false,
      enableSpeech: false,
      enableBraille: false,
      enableExplorer: false,
      enableComplexity: false
    },
    startup: {
      typeset: false,
      ready() {
        document.documentElement.dataset.mathStatus = 'initializing';
        window.MathJax.startup.defaultReady();
        // Keep conversion outside the startup promise: MathJax must finish
        // initializing before a render request enters its own promise queue.
        window.MathJax.startup.promise.then(() => {
          ready = true;
          document.documentElement.dataset.mathStatus = 'ready';
          return window.renderMath(document);
        }).catch(preserveFallback);
      }
    }
  };
})();
