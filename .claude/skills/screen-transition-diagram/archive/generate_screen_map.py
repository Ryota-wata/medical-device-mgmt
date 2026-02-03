#!/usr/bin/env python3
"""
画面マップ（サイトマップ形式）生成スクリプト
階層構造でグループ別にボックスを配置
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_WIDTH = 120
BOX_HEIGHT = 35
BOX_MARGIN = 10
GROUP_PADDING = 15
MENU_BOX_WIDTH = 100
MENU_BOX_HEIGHT = 50

# 色定義
COLORS = {
    'bg': (255, 255, 255),
    'menu_fill': (230, 242, 255),
    'menu_outline': (70, 130, 180),
    'group_個体管理リスト': (245, 245, 245),
    'group_ラベル発行': (255, 255, 220),
    'group_資産管理': (255, 255, 220),
    'group_編集リスト': (255, 255, 220),
    'group_見積管理': (255, 255, 220),
    'group_マスタ管理': (240, 248, 255),
    'screen_fill': (255, 255, 255),
    'screen_outline': (100, 100, 100),
    'text': (30, 30, 30),
    'group_text': (50, 50, 50),
    'highlight': (255, 255, 150),
}


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill, outline, width=1):
    """角丸四角形を描画"""
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_box(draw, x, y, w, h, text, font, fill=(255,255,255), outline=(100,100,100), text_color=(30,30,30)):
    """ボックスを描画"""
    draw_rounded_rect(draw, [x, y, x + w, y + h], radius=4, fill=fill, outline=outline, width=1)

    # テキストを中央に配置（複数行対応）
    lines = []
    if len(text) > 8:
        # 長いテキストは2行に分割
        mid = len(text) // 2
        # 区切りやすい位置を探す
        for i in range(mid, min(mid + 5, len(text))):
            if text[i] in '・（画面一覧':
                mid = i
                break
        lines = [text[:mid], text[mid:]]
    else:
        lines = [text]

    total_height = len(lines) * (font.size + 2)
    start_y = y + (h - total_height) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        text_x = x + (w - text_w) // 2
        text_y = start_y + i * (font.size + 2)
        draw.text((text_x, text_y), line, fill=text_color, font=font)


def generate_screen_map(transitions_data):
    """画面マップを生成"""

    # グループ定義（表示順序と含まれる画面）
    group_config = {
        'メニュー': {
            'screens': ['個体管理リスト', 'ラベル発行', '資産閲覧・申請', '編集リスト', '見積管理', 'マスタ管理'],
            'color': COLORS['menu_fill'],
        },
        '個体管理リスト': {
            'screens': ['オフライン準備画面', '登録内容修正画面', '資産台帳取込画面', '資産マスタ選択画面', '資産マスタ登録', 'データ突合画面'],
            'color': COLORS['group_個体管理リスト'],
        },
        'ラベル発行': {
            'screens': ['ラベル発行画面', 'ラベルプレビュー画面'],
            'color': COLORS['group_ラベル発行'],
        },
        '資産管理': {
            'screens': ['資産一覧画面', '資産カルテ画面', '棚卸画面'],
            'color': COLORS['group_資産管理'],
        },
        '編集リスト': {
            'screens': ['編集リスト画面', '見積依頼No作成モーダル'],
            'color': COLORS['group_編集リスト'],
        },
        '見積管理': {
            'screens': ['見積書依頼グループタブ画面', '見積書登録モーダル', 'OCR明細確認画面',
                       '見積登録（購入）AI判定確認', '見積登録（購入）個体品目AI判定',
                       '見積登録（購入）個体登録及び金額按分', '見積登録（購入）登録確認', '見積明細情報タブ画面'],
            'color': COLORS['group_見積管理'],
        },
        'マスタ管理': {
            'screens': ['施設マスタ一覧画面', '資産マスタ一覧画面', 'SHIP部署マスタ一覧画面', '個別部署マスタ一覧画面', 'ユーザー一覧画面'],
            'color': COLORS['group_マスタ管理'],
        },
    }

    # フォント
    title_font = get_font(14, 'W6')
    menu_font = get_font(11, 'W6')
    screen_font = get_font(9, 'W4')
    group_font = get_font(10, 'W6')

    # キャンバスサイズを計算
    canvas_width = 1600
    canvas_height = 900

    canvas = Image.new('RGB', (canvas_width, canvas_height), COLORS['bg'])
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((20, 15), "画面遷移図（サイトマップ）", fill=(30, 30, 30), font=title_font)

    # ===== ログイン → メニュー =====
    login_x, login_y = 50, 60
    draw_box(draw, login_x, login_y, 100, 40, "ログイン画面", menu_font,
             fill=(144, 238, 144), outline=(34, 139, 34))

    # 矢印
    draw.line([(login_x + 100, login_y + 20), (login_x + 130, login_y + 20)], fill=(100, 100, 100), width=2)
    draw.polygon([(login_x + 130, login_y + 20), (login_x + 125, login_y + 15), (login_x + 125, login_y + 25)], fill=(100, 100, 100))

    menu_x, menu_y = login_x + 140, login_y
    draw_box(draw, menu_x, menu_y, 100, 40, "メニュー画面", menu_font,
             fill=(255, 228, 181), outline=(255, 140, 0))

    # ===== TOP メニュー項目 =====
    top_menu_y = 130
    top_menu_x_start = 50
    menu_items = group_config['メニュー']['screens']
    menu_box_w = 130
    menu_spacing = 15

    # メニューからの縦線
    draw.line([(menu_x + 50, menu_y + 40), (menu_x + 50, top_menu_y - 10)], fill=(100, 100, 100), width=2)

    # 横線
    total_menu_width = len(menu_items) * menu_box_w + (len(menu_items) - 1) * menu_spacing
    menu_center = menu_x + 50
    menu_start_x = menu_center - total_menu_width // 2

    draw.line([(menu_start_x + menu_box_w // 2, top_menu_y - 10),
               (menu_start_x + total_menu_width - menu_box_w // 2, top_menu_y - 10)],
              fill=(100, 100, 100), width=2)

    menu_positions = {}
    for i, item in enumerate(menu_items):
        x = menu_start_x + i * (menu_box_w + menu_spacing)
        # 縦線
        draw.line([(x + menu_box_w // 2, top_menu_y - 10), (x + menu_box_w // 2, top_menu_y)],
                  fill=(100, 100, 100), width=2)
        draw_box(draw, x, top_menu_y, menu_box_w, 40, item, menu_font,
                 fill=COLORS['menu_fill'], outline=COLORS['menu_outline'])
        menu_positions[item] = (x, top_menu_y)

    # ===== 各グループの詳細 =====
    group_y = 200
    group_x = 30
    group_spacing = 20

    # グループを横に並べる
    current_x = group_x

    for group_name in ['個体管理リスト', 'ラベル発行', '資産管理', '編集リスト', '見積管理', 'マスタ管理']:
        config = group_config[group_name]
        screens = config['screens']
        color = config['color']

        # グループ内の画面を縦に並べる
        max_cols = 2 if len(screens) > 4 else 1
        rows = (len(screens) + max_cols - 1) // max_cols

        group_width = max_cols * (BOX_WIDTH + BOX_MARGIN) + GROUP_PADDING * 2 - BOX_MARGIN
        group_height = rows * (BOX_HEIGHT + BOX_MARGIN) + GROUP_PADDING * 2 + 25 - BOX_MARGIN

        # グループ背景
        draw_rounded_rect(draw, [current_x, group_y, current_x + group_width, group_y + group_height],
                         radius=8, fill=color, outline=(180, 180, 180), width=1)

        # グループ名
        draw.text((current_x + 10, group_y + 5), group_name, fill=COLORS['group_text'], font=group_font)

        # メニューからの接続線
        menu_item = group_name if group_name in menu_positions else None
        if group_name == '資産管理':
            menu_item = '資産閲覧・申請'

        if menu_item and menu_item in menu_positions:
            mx, my = menu_positions[menu_item]
            # 縦線（メニューから下へ）
            draw.line([(mx + menu_box_w // 2, my + 40), (mx + menu_box_w // 2, group_y - 5)],
                      fill=(150, 150, 150), width=1)

        # 画面ボックス
        for idx, screen in enumerate(screens):
            col = idx % max_cols
            row = idx // max_cols

            sx = current_x + GROUP_PADDING + col * (BOX_WIDTH + BOX_MARGIN)
            sy = group_y + 25 + GROUP_PADDING + row * (BOX_HEIGHT + BOX_MARGIN)

            # 画面名を短縮
            short_name = screen.replace('画面', '').replace('一覧', '一覧')
            if len(short_name) > 12:
                short_name = short_name[:11] + '…'

            draw_box(draw, sx, sy, BOX_WIDTH, BOX_HEIGHT, short_name, screen_font,
                     fill=COLORS['screen_fill'], outline=COLORS['screen_outline'])

        current_x += group_width + group_spacing

    # ===== 凡例 =====
    legend_x = canvas_width - 200
    legend_y = 60
    draw.text((legend_x, legend_y), "【凡例】", fill=(50, 50, 50), font=group_font)

    draw_box(draw, legend_x, legend_y + 25, 60, 25, "開始", screen_font,
             fill=(144, 238, 144), outline=(34, 139, 34))
    draw.text((legend_x + 70, legend_y + 30), "開始画面", fill=(50, 50, 50), font=screen_font)

    draw_box(draw, legend_x, legend_y + 55, 60, 25, "メニュー", screen_font,
             fill=(255, 228, 181), outline=(255, 140, 0))
    draw.text((legend_x + 70, legend_y + 60), "メニュー", fill=(50, 50, 50), font=screen_font)

    draw_box(draw, legend_x, legend_y + 85, 60, 25, "機能", screen_font,
             fill=COLORS['menu_fill'], outline=COLORS['menu_outline'])
    draw.text((legend_x + 70, legend_y + 90), "機能カテゴリ", fill=(50, 50, 50), font=screen_font)

    return canvas


def create_excel(diagram_image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp_path = "/tmp/screen_map_temp.png"
    diagram_image.save(temp_path, dpi=(150, 150))

    img = XLImage(temp_path)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"画面マップを保存しました: {output_path}")

    os.remove(temp_path)


def main():
    transitions_path = '/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json'
    output_path = '/Users/watanaberyouta/Desktop/画面設計書/画面マップ.xlsx'

    transitions_data = load_transitions(transitions_path)

    print(f"画面数: {len(transitions_data['screens'])}")

    diagram = generate_screen_map(transitions_data)

    # PNGも保存
    png_path = '/Users/watanaberyouta/Desktop/画面設計書/画面マップ.png'
    diagram.save(png_path, dpi=(150, 150))
    print(f"PNG保存: {png_path}")

    create_excel(diagram, output_path)


if __name__ == '__main__':
    main()
