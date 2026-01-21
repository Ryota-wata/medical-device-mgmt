#!/usr/bin/env node
/**
 * 画面スクリーンショット取得スクリプト
 *
 * 使用方法:
 *   node capture_screenshot.js --url "http://localhost:3000/quotation-data-box" --output "./screenshots/見積管理.png"
 *   node capture_screenshot.js --path "/quotation-data-box" --name "見積管理" --output-dir "./screenshots"
 *
 * オプション:
 *   --url: 完全なURL
 *   --path: パス（http://localhost:3000 が自動付与）
 *   --name: 画面名（出力ファイル名に使用）
 *   --output: 出力ファイルパス
 *   --output-dir: 出力ディレクトリ（--nameと併用）
 *   --width: ビューポート幅（デフォルト: 1400）
 *   --height: ビューポート高さ（デフォルト: 900）
 *   --full-page: ページ全体をキャプチャ（デフォルト: false）
 *   --wait: ページ読み込み後の待機時間ms（デフォルト: 1000）
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
        waitTime = 1000
    } = options;

    console.log(`スクリーンショット取得開始: ${url}`);

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

        // 出力ディレクトリ作成
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // スクリーンショット取得
        await page.screenshot({
            path: outputPath,
            fullPage: fullPage
        });

        console.log(`スクリーンショット保存完了: ${outputPath}`);
        return outputPath;

    } finally {
        await browser.close();
    }
}

async function main() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        options[key] = value;
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
            waitTime: parseInt(options.wait) || 1000
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
            const url = `${baseUrl}${screen.path}`;
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

module.exports = { captureScreenshot, captureMultipleScreenshots };

if (require.main === module) {
    main();
}
