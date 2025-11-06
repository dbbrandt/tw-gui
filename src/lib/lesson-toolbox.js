/* eslint-disable */
// Utilities for filtering toolbox XML based on a simple allowlist config
// Config shape: { allowOpcodes?: string[], allowCategories?: string[] }

export const filterToolboxXML = function (xmlString, config = {}) {
    if (!xmlString) return xmlString;
    const {allowOpcodes = [], allowCategories = []} = config || {};
    const catSet = new Set((allowCategories || []).map(s => String(s).toLowerCase()));
    const opSet = new Set((allowOpcodes || []).map(s => String(s)));

    // Fast path: if no filters provided, return original XML
    if (catSet.size === 0 && opSet.size === 0) return xmlString;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Remove disallowed categories
    for (const cat of Array.from(doc.querySelectorAll('category'))) {
        const id = (cat.getAttribute('id') || '').toLowerCase();
        const name = (cat.getAttribute('name') || '').toLowerCase();
        const categoryKey = id || name;
        const isCustom = cat.hasAttribute('custom'); // dynamic categories like VARIABLES / PROCEDURE

        // Never hide custom categories; also do not filter their contents here
        if (isCustom) {
            continue;
        }

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
        if (!cat.querySelector('block, shadow, label, button')) cat.remove();
    }

    // Also remove any top-level blocks not in categories (defensive)
    for (const blk of Array.from(doc.querySelectorAll(':scope > block'))) {
        const type = blk.getAttribute('type') || '';
        if (opSet.size && !opSet.has(type)) blk.remove();
    }

    return new XMLSerializer().serializeToString(doc);
};
