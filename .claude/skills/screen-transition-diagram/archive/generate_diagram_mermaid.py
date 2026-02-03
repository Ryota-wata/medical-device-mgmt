#!/usr/bin/env python3
"""
Mermaid形式で画面遷移図を生成
mermaid-cliまたはオンラインAPIで画像化してExcelに貼り付け
"""

import json
import os
import subprocess
import urllib.request
import urllib.parse
import base64
from pathlib import Path
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def sanitize_id(text):
    """Mermaid用にIDをサニタイズ"""
    return text.replace(' ', '_').replace('（', '_').replace('）', '_').replace('・', '_')


def generate_mermaid_code(transitions_data):
    """Mermaidコードを生成（ユーザーストーリー順）"""
    lines = ["flowchart LR"]  # 左から右へ（ユーザーストーリー順）

    # グループの順序を定義（ユーザーストーリー順）
    group_order = [
        'メイン遷移',
        '個体管理リスト',
        'ラベル発行',
        '資産管理',
        '編集リスト',
        '見積管理',
        'マスタ管理'
    ]

    # グループ別にスクリーンを整理
    groups = {g: [] for g in group_order}
    for screen in transitions_data['screens']:
        group = screen.get('group', 'その他')
        if group in groups:
            groups[group].append(screen)

    # 1. メイン遷移（ログイン→メニュー→各機能）を最初に定義
    lines.append('')
    lines.append('    %% === メイン遷移（ログイン→メニュー） ===')
    main_screens = groups.get('メイン遷移', [])
    # position順にソート
    main_screens.sort(key=lambda x: (x['position']['row'], x['position']['col']))
    for screen in main_screens:
        sid = sanitize_id(screen['id'])
        name = screen['name']
        if screen['id'] == 'ログイン画面':
            lines.append(f'    {sid}(("{name}"))')  # 開始点は丸形
        elif screen['id'] == 'メニュー画面':
            lines.append(f'    {sid}{{"{name}"}}')  # メニューはひし形
        else:
            lines.append(f'    {sid}["{name}"]')

    # 2. 各グループをサブグラフとして定義
    for group in group_order[1:]:  # メイン遷移以外
        screens = groups.get(group, [])
        if not screens:
            continue

        lines.append('')
        lines.append(f'    %% === {group} ===')
        lines.append(f'    subgraph SG_{sanitize_id(group)}["{group}"]')
        lines.append('        direction LR')

        # position順にソート
        screens.sort(key=lambda x: (x['position']['row'], x['position']['col']))
        for screen in screens:
            sid = sanitize_id(screen['id'])
            name = screen['name']
            lines.append(f'        {sid}["{name}"]')
        lines.append('    end')

    # 3. 遷移を定義（ユーザーストーリー順）
    lines.append('')
    lines.append('    %% === 遷移 ===')

    # メイン遷移を先に
    lines.append('    %% メイン遷移')
    for trans in transitions_data.get('transitions', []):
        from_id = sanitize_id(trans['from'])
        to_id = sanitize_id(trans['to'])
        label = trans.get('label', '')

        # メニューからの遷移を最初に
        if 'メニュー' in trans['from'] or 'ログイン' in trans['from']:
            if label:
                lines.append(f'    {from_id} -->|"{label}"| {to_id}')
            else:
                lines.append(f'    {from_id} --> {to_id}')

    # グループ内遷移
    lines.append('    %% グループ内遷移')
    for trans in transitions_data.get('transitions', []):
        from_id = sanitize_id(trans['from'])
        to_id = sanitize_id(trans['to'])
        label = trans.get('label', '')

        if 'メニュー' not in trans['from'] and 'ログイン' not in trans['from']:
            if label:
                lines.append(f'    {from_id} -->|"{label}"| {to_id}')
            else:
                lines.append(f'    {from_id} --> {to_id}')

    # スタイル定義
    lines.append('')
    lines.append('    %% === スタイル ===')
    lines.append('    classDef default fill:#E8F4FC,stroke:#4682B4,stroke-width:2px,font-size:14px')
    lines.append('    classDef startNode fill:#90EE90,stroke:#228B22,stroke-width:3px')
    lines.append('    classDef menuNode fill:#FFE4B5,stroke:#FF8C00,stroke-width:3px')
    lines.append('    class ログイン画面 startNode')
    lines.append('    class メニュー画面 menuNode')

    return '\n'.join(lines)


def render_mermaid_online(mermaid_code, output_path):
    """Mermaid.inkオンラインAPIで画像を生成（高解像度）"""
    import zlib

    # pako deflate圧縮 + base64エンコード
    compressed = zlib.compress(mermaid_code.encode('utf-8'), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')

    # Mermaid.ink API URL（SVG形式で高解像度）
    # scale=3で3倍解像度
    url = f"https://mermaid.ink/img/pako:{encoded}?type=png&width=3000"

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        print(f"Mermaid画像を生成しました: {output_path}")
        return True
    except Exception as e:
        print(f"オンラインレンダリング失敗: {e}")
        # フォールバック: 通常のbase64
        try:
            encoded_simple = base64.urlsafe_b64encode(mermaid_code.encode('utf-8')).decode('utf-8')
            url_simple = f"https://mermaid.ink/img/{encoded_simple}"
            urllib.request.urlretrieve(url_simple, output_path)
            print(f"Mermaid画像を生成しました（低解像度）: {output_path}")
            return True
        except Exception as e2:
            print(f"フォールバックも失敗: {e2}")
            return False


def render_mermaid_cli(mermaid_code, output_path):
    """mermaid-cliでローカルレンダリング（高解像度）"""
    # 一時ファイルに書き出し
    temp_mmd = "/tmp/diagram.mmd"
    with open(temp_mmd, 'w', encoding='utf-8') as f:
        f.write(mermaid_code)

    # mmdc のパス候補
    mmdc_paths = [
        'mmdc',
        '/Users/watanaberyouta/.nodenv/versions/20.11.0/bin/mmdc',
        '/usr/local/bin/mmdc',
    ]

    for mmdc in mmdc_paths:
        try:
            # mmdc (mermaid-cli) を実行（高解像度: -w 4000 -s 2）
            result = subprocess.run(
                [mmdc, '-i', temp_mmd, '-o', output_path, '-b', 'white', '-w', '4000', '-s', '2'],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0:
                print(f"Mermaid画像を生成しました（高解像度）: {output_path}")
                return True
            else:
                print(f"mermaid-cli エラー: {result.stderr}")
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            print("mermaid-cli タイムアウト")
            return False

    print("mermaid-cli (mmdc) がインストールされていません")
    print("インストール: npm install -g @mermaid-js/mermaid-cli")
    return False


def create_excel(image_path, output_path):
    """画像をExcelに貼り付け（高解像度画像は縮小表示）"""
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    img = XLImage(image_path)

    # 大きい画像は50%に縮小（印刷時は高解像度を維持）
    if img.width > 2000 or img.height > 2000:
        img.width = img.width * 0.5
        img.height = img.height * 0.5

    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"Excelファイルを保存しました: {output_path}")


def main():
    transitions_path = '/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json'
    output_excel = '/Users/watanaberyouta/Desktop/画面設計書/画面遷移図_Mermaid.xlsx'
    output_mmd = '/Users/watanaberyouta/Desktop/画面設計書/transitions/diagram.mmd'
    output_png = '/tmp/mermaid_diagram.png'

    transitions_data = load_transitions(transitions_path)

    print(f"画面数: {len(transitions_data['screens'])}")
    print(f"遷移数: {len(transitions_data.get('transitions', []))}")

    # Mermaidコード生成
    mermaid_code = generate_mermaid_code(transitions_data)

    # .mmdファイルとして保存（後で編集可能）
    with open(output_mmd, 'w', encoding='utf-8') as f:
        f.write(mermaid_code)
    print(f"Mermaidコードを保存しました: {output_mmd}")
    print("\n--- Mermaidコード ---")
    print(mermaid_code)
    print("--- ここまで ---\n")

    # 画像レンダリング（CLI優先、失敗時はオンライン）
    rendered = render_mermaid_cli(mermaid_code, output_png)
    if not rendered:
        print("オンラインAPIでレンダリングを試行...")
        rendered = render_mermaid_online(mermaid_code, output_png)

    if rendered and os.path.exists(output_png):
        create_excel(output_png, output_excel)
        os.remove(output_png)
    else:
        print("画像生成に失敗しました。Mermaidコードは保存済みです。")
        print("以下の方法で画像化できます：")
        print("1. https://mermaid.live/ にコードを貼り付け")
        print("2. npm install -g @mermaid-js/mermaid-cli でCLIをインストール")


if __name__ == '__main__':
    main()
