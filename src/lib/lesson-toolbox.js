/* eslint-disable */
// Utilities for filtering toolbox XML based on a simple allowlist config
// Config shape: { allowOpcodes?: string[], allowCategories?: string[] }

const LS_KEY = 'tw.lessonToolboxConfig';

export const isValidLessonConfig = function (cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    const hasOps = Array.isArray(cfg.allowOpcodes) && cfg.allowOpcodes.length > 0;
    const hasCats = Array.isArray(cfg.allowCategories) && cfg.allowCategories.length > 0;
    return hasOps || hasCats;
};

export const loadLessonConfigFromLocalStorage = function () {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!isValidLessonConfig(parsed)) {
            try { window.localStorage.removeItem(LS_KEY); } catch (_) {}
            return null;
        }
        return parsed;
    } catch (e) {
        try { window.localStorage.removeItem(LS_KEY); } catch (_) {}
        return null;
    }
};

export const saveLessonConfigToLocalStorage = function (config) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        if (!isValidLessonConfig(config)) {
            window.localStorage.removeItem(LS_KEY);
            return;
        }
        window.localStorage.setItem(LS_KEY, JSON.stringify(config));
    } catch (e) {
        // ignore
    }
};

export const clearLessonConfigFromLocalStorage = function () {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.removeItem(LS_KEY);
    } catch (e) {
        // ignore
    }
};

const canUseFs = typeof window !== 'undefined' && typeof window.require === 'function';

export const autoLoadDefaultLessonConfig = function (setConfig) {
    // Debug: trace auto-load pathway
    try { console.info('[LessonToolbox] autoLoad: start'); } catch (_) {}
    try {
        // 1) localStorage
        const ls = loadLessonConfigFromLocalStorage();
        if (ls) {
            try { console.info('[LessonToolbox] autoLoad: using localStorage', {
                cats: Array.isArray(ls.allowCategories) ? ls.allowCategories.length : 0,
                ops: Array.isArray(ls.allowOpcodes) ? ls.allowOpcodes.length : 0
            }); } catch (_) {}
            setConfig(ls);
            return 'localStorage';
        }
        // 2) Electron preload bridge (preferred)
        if (typeof window !== 'undefined' && window.twBridge && typeof window.twBridge.readDefaultConfig === 'function') {
            const maybe = window.twBridge.readDefaultConfig();
            try { console.info('[LessonToolbox] autoLoad: twBridge detected', typeof maybe); } catch (_) {}
            if (maybe && typeof maybe.then === 'function') {
                // async bridge
                maybe.then(cfg => {
                    try {
                        if (!cfg || !isValidLessonConfig(cfg)) {
                            try { console.warn('[LessonToolbox] autoLoad: twBridge(async) invalid/empty'); } catch (_) {}
                            return;
                        }
                        try { console.info('[LessonToolbox] autoLoad: twBridge(async) resolved'); } catch (_) {}
                        setConfig(cfg);
                        saveLessonConfigToLocalStorage(cfg);
                    } catch (_) { /* ignore */ }
                });
                return 'twBridge(async)';
            }
            if (maybe) {
                try { console.info('[LessonToolbox] autoLoad: twBridge(sync)'); } catch (_) {}
                if (!isValidLessonConfig(maybe)) {
                    try { console.warn('[LessonToolbox] autoLoad: twBridge(sync) invalid/empty'); } catch (_) {}
                } else {
                    setConfig(maybe);
                    saveLessonConfigToLocalStorage(maybe);
                    return 'twBridge';
                }
            }
        }
        // 3) Electron fs fallback via window.require (legacy)
        if (canUseFs) {
            try { console.info('[LessonToolbox] autoLoad: trying window.require fs fallback'); } catch (_) {}
            const req = window.require;
            const fs = req('fs');
            const os = req('os');
            const path = req('path');
            const home = os.homedir();
            const candidates = [
                path.join(home, 'twconfig.json'),
                path.join(home, 'Documents', 'twconfig.json')
            ];
            for (const p of candidates) {
                if (fs.existsSync(p)) {
                    const text = fs.readFileSync(p, 'utf8');
                    const cfg2 = JSON.parse(text);
                    if (!isValidLessonConfig(cfg2)) continue;
                    setConfig(cfg2);
                    saveLessonConfigToLocalStorage(cfg2);
                    return p;
                }
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const filterToolboxXML = function (xmlString, config = {}) {
    if (!xmlString) return xmlString;
    const {allowOpcodes = [], allowCategories = []} = config || {};
    const catSet = new Set((allowCategories || []).map(s => String(s).toLowerCase()));
    const opSet = new Set((allowOpcodes || []).map(s => String(s)));

    // Fast path: if no filters provided, return original XML
    if (catSet.size === 0 && opSet.size === 0) return xmlString;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    // console.debug('Lesson toolbox: allowCategories count', catSet.size);

    // Remove disallowed categories
    for (const cat of Array.from(doc.querySelectorAll('category'))) {
        const id = (cat.getAttribute('id') || '').toLowerCase();
        const name = (cat.getAttribute('name') || '').toLowerCase();
        const categoryKey = id || name;
        // console.debug('Lesson toolbox: category', {categoryKey, raw: cat.getAttribute('name') || cat.getAttribute('id') || ''});
        const isCustom = cat.hasAttribute('custom'); // dynamic categories like VARIABLES / PROCEDURE

        // Never hide custom categories; also do not filter their contents here
        // if (isCustom) {
        //     continue;
        // }

        if (catSet.size && !catSet.has(categoryKey)) {
            cat.remove();
            continue;
        }
        // Within allowed categories, remove disallowed blocks
        for (const blk of Array.from(cat.querySelectorAll('block'))) {
            const type = blk.getAttribute('type') || '';
            if (opSet.size && !opSet.has(type)) blk.remove();
        }
        // Drop empty categories (no blocks/shadows/labels/buttons)
        if (!cat.querySelector('block, shadow, label, button')) {
            if (!(isCustom && catSet.has(categoryKey))) cat.remove();
        }
    }

    // Also remove any top-level blocks not in categories (defensive)
    for (const blk of Array.from(doc.querySelectorAll(':scope > block'))) {
        const type = blk.getAttribute('type') || '';
        if (opSet.size && !opSet.has(type)) blk.remove();
    }

    return new XMLSerializer().serializeToString(doc);
};
