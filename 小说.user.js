// ==UserScript==
// @name         sudugu.org 精准元素清理器
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  修正逻辑：只删元素本身，不误删网页主框架
// @author       Assistant
// @match        *://www.sudugu.org/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_VAL = "2147483646";
    let lockedClass = null;

    function process() {
        // 1. 获取页面所有元素
        const all = document.querySelectorAll('*');
        const matches = [];

        // 查找包含目标数字的元素
        for (let i = 0; i < all.length; i++) {
            let el = all[i];
            // 排除掉脚本自身和一些基础标签
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HTML' || el.tagName === 'BODY') continue;
            
            if (el.outerHTML && el.outerHTML.includes(TARGET_VAL)) {
                matches.push(el);
            }
        }

        // 2. 核心逻辑分支
        if (matches.length === 1) {
            // 情况一：只有一个匹配项
            const target = matches[0];
            const next = target.nextElementSibling;

            // 尝试记住下一个元素的 class
            if (next && !lockedClass) {
                const cls = next.getAttribute('class');
                if (cls && cls.trim() !== "") {
                    lockedClass = cls.trim();
                    console.log("%c[清理脚本] 锁定类名:", "color: yellow; background: red;", lockedClass);
                }
            }
            // 只删除该元素本身
            target.remove();
        } 
        else if (matches.length > 1) {
            // 情况二：有多个匹配项，全部删除它们自己
            matches.forEach(el => {
                console.log("[清理脚本] 移除包含数字的元素");
                el.remove();
            });
        }

        // 3. 持续清理相同 class 的元素
        if (lockedClass) {
            // 为了防止误删整个网页，这里做个安全检查：如果 class 太常见（如 "container" 或 "main"），请小心
            // 这里依然使用精确匹配
            const similarElements = document.querySelectorAll(`[class="${lockedClass}"]`);
            similarElements.forEach(el => {
                if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
                    el.remove();
                }
            });
        }
    }

    // --- 执行与监控 ---

    // 监听 DOM 变化
    const observer = new MutationObserver(process);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
    });

    // 立即执行及定时执行
    process();
    setInterval(process, 500);

    window.addEventListener('load', process);

})();