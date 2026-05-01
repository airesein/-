// ==UserScript==
// @name         sudugu.org 智能类名清理器
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  捕捉 2147483646 后续元素的动态类名并执行全量清理
// @author       Assistant
// @match        *://www.sudugu.org/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const TRIGGER_NUM = "2147483646";
    let lockedClass = null; // 用于存储每一页动态生成的那个 class (比如 wclri)

    /**
     * 核心逻辑：扫描、捕捉、清理
     */
    function execute() {
        // 1. 获取当前页面所有元素
        const all = document.getElementsByTagName('*');
        let triggerElements = [];

        // 遍历寻找触发器 (包含数字的元素)
        for (let i = 0; i < all.length; i++) {
            let el = all[i];
            // 排除基础结构，只看 div, span, p 等普通元素
            if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'HEAD'].includes(el.tagName)) continue;

            if (el.outerHTML && el.outerHTML.indexOf(TRIGGER_NUM) !== -1) {
                triggerElements.push(el);
            }
        }

        // 2. 根据触发器数量执行分支逻辑
        if (triggerElements.length === 1) {
            const target = triggerElements[0];
            const next = target.nextElementSibling;

            // 如果没锁定过 class，且下一个元素存在
            if (!lockedClass && next) {
                // 只有当它是 div 且有 class 时才锁定
                const cls = next.getAttribute('class');
                if (cls && cls.trim() !== "") {
                    // 我们只取第一个类名，防止复合类名干扰
                    lockedClass = cls.trim().split(/\s+/)[0];
                    console.log("%c[锁定目标] 发现动态类名:", "color: white; background: green; padding: 3px;", lockedClass);
                }
            }
            // 提取完特征后，立刻删除触发器本身
            target.remove();
        }
        else if (triggerElements.length > 1) {
            // 如果有多个触发器，说明还没进入类名锁定逻辑，直接把包含数字的都删了
            for (let el of triggerElements) {
                el.remove();
            }
        }

        // 3. 全量清理锁定后的干扰元素 (例如所有的 .wclri)
        if (lockedClass) {
            // 使用更精确的选择器，只针对 div 和 span 这种元素
            // 这样可以极大地避免误删网页的 CSS 样式文件
            const query = `div.${lockedClass}, span.${lockedClass}, p.${lockedClass}`;
            const items = document.querySelectorAll(query);

            if (items.length > 0) {
                items.forEach(item => item.remove());
            }
        }
    }

    // --- 执行策略：多重监控 ---

    // 1. 毫秒级定时器：确保在干扰项出现的瞬间就将其干掉
    const fastTimer = setInterval(execute, 50);

    // 2. DOM 观察者：监控新生成的节点
    const observer = new MutationObserver(() => {
        execute();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // 3. 页面加载完毕后停止高频，转为低频 (节省性能)
    window.addEventListener('load', () => {
        execute();
        clearInterval(fastTimer);
        setInterval(execute, 500);
        console.log("[清理脚本] 页面已加载，切换至低频模式");
    });

    // 4. 立即执行一次
    execute();

})();
