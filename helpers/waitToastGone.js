"use strict";
 
module.exports = async function waitToastGone(page) {
    try {
        await page.waitForFunction(
            (sel) => document.querySelectorAll(sel).length === 0,
            process.env.SEL_TOAST_MSG,
            { timeout: 1500 } // 5000 dan 1500 ga
        );
    } catch { }
    // 500ms dan 100ms ga
    await page.waitForTimeout(100);
};
 