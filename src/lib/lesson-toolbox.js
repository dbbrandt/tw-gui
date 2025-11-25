/* eslint-disable */
// Utilities for filtering toolbox XML based on a simple allowlist config
// Config shape: { allowOpcodes?: string[], allowCategories?: string[] }

const LS_KEY = 'tw.lessonToolboxConfig';

export const loadLessonConfigFromLocalStorage = function () {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

export const saveLessonConfigToLocalStorage = function (config) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
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

const canUseFs = typeof window !== 'undefined' && (
    typeof window.require === 'function' || (typeof process !== 'undefined' && process.versions && process.versions.electron)
);

export const autoLoadDefaultLessonConfig = function (setConfig) {
    try {
        // 1) localStorage
        const ls = loadLessonConfigFromLocalStorage();
        if (ls) {
            setConfig(ls);
            return 'localStorage';
        }
        // 2) Electron fs fallback
        if (!canUseFs) return null;
        const req = window.require || require;
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
                const cfg = JSON.parse(text);
                setConfig(cfg);
                saveLessonConfigToLocalStorage(cfg);
                return p;
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
    console.log('catSet.size:', catSet.size);

    // Remove disallowed categories
    for (const cat of Array.from(doc.querySelectorAll('category'))) {
        const id = (cat.getAttribute('id') || '').toLowerCase();
        const name = (cat.getAttribute('name') || '').toLowerCase();
        const categoryKey = id || name;
        console.log('Processing categoryKey:', categoryKey, 'raw:', cat.getAttribute('name') || cat.getAttribute('id') || '');
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
