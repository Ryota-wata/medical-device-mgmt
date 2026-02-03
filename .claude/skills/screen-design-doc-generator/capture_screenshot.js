#!/usr/bin/env node
/**
 * 画面スクリーンショット取得スクリプト（モーダル対応版）
 *
 * 使用方法:
 *   # 通常のスクリーンショット
 *   node capture_screenshot.js --url "http://localhost:3000/main" --output "./screenshots/メイン画面_PC.png"
 *
 *   # モーダルを開いてスクリーンショット
 *   node capture_screenshot.js --url "http://localhost:3000/main" --output "./screenshots/編集リストモーダル_PC.png" \
 *     --click "button:has-text('編集リスト')" --wait-for ".fixed.inset-0"
 *
 * オプション:
 *   --url: 完全なURL（必須）
 *   --output: 出力ファイルパス（必須）
 *   --width: ビューポート幅（デフォルト: 1400）
 *   --height: ビューポート高さ（デフォルト: 900）
 *   --wait: ページ読み込み後の待機時間ms（デフォルト: 1000）
 *   --click: クリックするセレクタ（モーダル表示用）
 *   --wait-for: クリック後に待機するセレクタ（モーダル要素）
 *   --click-wait: クリック後の追加待機時間ms（デフォルト: 500）
 *   --full-page: ページ全体をキャプチャ（デフォルト: false）
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshot(options) {
    const {
        url,
        outputPath,
        width = 1400,
        height = 900,
        fullPage = false,
        waitTime = 1000,
        clickSelector = null,
        waitForSelector = null,
        clickWait = 500
    } = options;

    console.log(`スクリーンショット取得開始: ${url}`);
    if (clickSelector) {
        console.log(`  クリック対象: ${clickSelector}`);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        await page.setViewport({ width, height });

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // 追加の待機時間（レンダリング完了待ち）
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // モーダル表示のためのクリック
        if (clickSelector) {
            try {
                // セレクタの種類を判定
                let element;
                if (clickSelector.includes(':has-text(')) {
                    // :has-text() セレクタの処理
                    const match = clickSelector.match(/(.+):has-text\(['"](.+)['"]\)/);
                    if (match) {
                        const baseSelector = match[1];
                        const text = match[2];
                        element = await page.evaluateHandle((sel, txt) => {
                            const elements = document.querySelectorAll(sel);
                            for (const el of elements) {
                                if (el.textContent.includes(txt)) {
                                    return el;
                                }
                            }
                            return null;
                        }, baseSelector, text);
                    }
                } else {
                    element = await page.$(clickSelector);
                }

                if (element) {
                    await element.click();
                    console.log(`  クリック実行: ${clickSelector}`);

                    // モーダル表示待ち
                    if (waitForSelector) {
                        await page.waitForSelector(waitForSelector, { timeout: 5000 });
                        console.log(`  モーダル表示確認: ${waitForSelector}`);
                    }

                    // 追加待機
                    await new Promise(resolve => setTimeout(resolve, clickWait));
                } else {
                    console.warn(`  警告: セレクタが見つかりません: ${clickSelector}`);
                }
            } catch (e) {
                console.warn(`  警告: クリック処理でエラー: ${e.message}`);
            }
        }

        // 出力ディレクトリ作成
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // スクリーンショット取得
        if (fullPage) {
            // フルページの場合、固定要素の問題を回避するため
            // 1. ページ全体の高さを取得
            // 2. 固定要素を一時的にabsoluteに変更
            // 3. ビューポートをページ全体の高さに拡張
            const bodyHeight = await page.evaluate(() => {
                // 固定要素をabsoluteに変更
                const fixedElements = document.querySelectorAll('*');
                fixedElements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed') {
                        el.style.position = 'absolute';
                    }
                });
                // ページ全体の高さを返す
                return Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );
            });

            // ビューポートをページ全体の高さに設定
            await page.setViewport({ width, height: bodyHeight });
            await new Promise(resolve => setTimeout(resolve, 500));

            // 通常のスクリーンショット（fullPage: false）
            await page.screenshot({
                path: outputPath,
                fullPage: false
            });
        } else {
            await page.screenshot({
                path: outputPath,
                fullPage: false
            });
        }

        console.log(`スクリーンショット保存完了: ${outputPath}`);
        return outputPath;

    } finally {
        await browser.close();
    }
}

async function main() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.replace('--', '');
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                options[key] = value;
                i++;
            } else {
                options[key] = true;
            }
        }
    }

    // URL構築
    let url = options.url;
    if (!url && options.path) {
        const baseUrl = options['base-url'] || 'http://localhost:3000';
        url = `${baseUrl}${options.path.startsWith('/') ? '' : '/'}${options.path}`;
    }

    if (!url) {
        console.error('エラー: --url または --path を指定してください');
        process.exit(1);
    }

    // 出力パス構築
    let outputPath = options.output;
    if (!outputPath && options.name && options['output-dir']) {
        outputPath = path.join(options['output-dir'], `${options.name}.png`);
    }

    if (!outputPath) {
        console.error('エラー: --output または --name と --output-dir を指定してください');
        process.exit(1);
    }

    try {
        await captureScreenshot({
            url,
            outputPath,
            width: parseInt(options.width) || 1400,
            height: parseInt(options.height) || 900,
            fullPage: options['full-page'] === 'true',
            waitTime: parseInt(options.wait) || 1000,
            clickSelector: options.click || null,
            waitForSelector: options['wait-for'] || null,
            clickWait: parseInt(options['click-wait']) || 500
        });
    } catch (error) {
        console.error(`エラー: ${error.message}`);
        process.exit(1);
    }
}

// 複数画面を一括でキャプチャする関数（エクスポート用）
async function captureMultipleScreenshots(screens, options = {}) {
    const {
        baseUrl = 'http://localhost:3000',
        outputDir = './screenshots',
        width = 1400,
        height = 900,
        waitTime = 1000
    } = options;

    const results = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width, height });

        for (const screen of screens) {
            const url = screen.url || `${baseUrl}${screen.path}`;
            const outputPath = path.join(outputDir, `${screen.name}.png`);

            console.log(`キャプチャ中: ${screen.name} (${url})`);

            try {
                await page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                if (waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                // モーダル表示のためのクリック
                if (screen.click) {
                    try {
                        const element = await page.evaluateHandle((selector, text) => {
                            if (text) {
                                const elements = document.querySelectorAll(selector);
                                for (const el of elements) {
                                    if (el.textContent.includes(text)) {
                                        return el;
                                    }
                                }
                                return null;
                            }
                            return document.querySelector(selector);
                        }, screen.click.selector, screen.click.text);

                        if (element) {
                            await element.click();
                            if (screen.click.waitFor) {
                                await page.waitForSelector(screen.click.waitFor, { timeout: 5000 });
                            }
                            await new Promise(resolve => setTimeout(resolve, screen.click.wait || 500));
                        }
                    } catch (e) {
                        console.warn(`  警告: クリック処理でエラー: ${e.message}`);
                    }
                }

                // 出力ディレクトリ作成
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                await page.screenshot({ path: outputPath });

                results.push({ name: screen.name, path: outputPath, success: true });
                console.log(`  完了: ${outputPath}`);

            } catch (error) {
                results.push({ name: screen.name, error: error.message, success: false });
                console.error(`  エラー: ${error.message}`);
            }
        }

    } finally {
        await browser.close();
    }

    return results;
}

/**
 * モーダル付き画面のスクリーンショットを一括取得
 *
 * @param {Object} config - 設定オブジェクト
 * @param {string} config.url - ベースURL
 * @param {string} config.screenName - 画面名
 * @param {string} config.outputDir - 出力ディレクトリ
 * @param {Array} config.devices - デバイス設定 [{name, width, height}]
 * @param {Array} config.modals - モーダル設定 [{name, clickSelector, waitForSelector}]
 */
async function captureScreenWithModals(config) {
    const {
        url,
        screenName,
        outputDir,
        devices = [
            { name: 'PC', width: 1920, height: 1080 },
            { name: 'タブレット', width: 768, height: 1024 },
            { name: 'スマホ', width: 375, height: 812 }
        ],
        modals = [],
        waitTime = 2000
    } = config;

    const results = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const device of devices) {
            const page = await browser.newPage();
            await page.setViewport({ width: device.width, height: device.height });

            // ベース画面のキャプチャ
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, waitTime));

            const basePath = path.join(outputDir, `${screenName}_${device.name}.png`);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            await page.screenshot({ path: basePath });
            results.push({ name: `${screenName}_${device.name}`, path: basePath, type: 'base' });
            console.log(`ベース画面キャプチャ完了: ${basePath}`);

            // 各モーダルのキャプチャ
            for (const modal of modals) {
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, waitTime));

                try {
                    // ボタンをクリック
                    const element = await page.evaluateHandle((selector, text) => {
                        if (text) {
                            const elements = document.querySelectorAll(selector);
                            for (const el of elements) {
                                if (el.textContent.includes(text)) {
                                    return el;
                                }
                            }
                        }
                        return document.querySelector(selector);
                    }, modal.clickSelector, modal.clickText);

                    if (element) {
                        await element.click();

                        if (modal.waitForSelector) {
                            await page.waitForSelector(modal.waitForSelector, { timeout: 5000 });
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));

                        const modalPath = path.join(outputDir, `${screenName}_${modal.name}_${device.name}.png`);
                        await page.screenshot({ path: modalPath });
                        results.push({ name: `${screenName}_${modal.name}_${device.name}`, path: modalPath, type: 'modal', modal: modal.name });
                        console.log(`モーダルキャプチャ完了: ${modalPath}`);
                    }
                } catch (e) {
                    console.warn(`モーダルキャプチャ失敗 (${modal.name}): ${e.message}`);
                }
            }

            await page.close();
        }
    } finally {
        await browser.close();
    }

    return results;
}

module.exports = { captureScreenshot, captureMultipleScreenshots, captureScreenWithModals };

if (require.main === module) {
    main();
}
