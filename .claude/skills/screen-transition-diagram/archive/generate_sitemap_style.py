#!/usr/bin/env python3
"""
サイトマップ形式の画面遷移図
参考画像に基づいた階層構造レイアウト
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_W = 110
BOX_H = 28
BOX_MARGIN = 8
COL_WIDTH = 160
ROW_HEIGHT = 36

# 色定義
COLORS = {
    'bg': (255, 255, 255),
    'login_fill': (220, 240, 255),
    'login_outline': (100, 150, 200),
    'menu_fill': (255, 255, 255),
    'menu_outline': (80, 80, 80),
    'gray_bg': (235, 235, 235),
    'yellow_bg': (255, 255, 210),
    'blue_bg': (230, 245, 255),
    'screen_fill': (255, 255, 255),
    'screen_outline': (120, 120, 120),
    'text': (40, 40, 40),
    'arrow': (100, 100, 100),
    'highlight_fill': (255, 255, 180),
    'highlight_outline': (200, 150, 0),
}


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def draw_box(draw, x, y, w, h, text, font, fill, outline, text_color=COLORS['text']):
    """ボックス描画"""
    draw.rounded_rectangle([x, y, x+w, y+h], radius=4, fill=fill, outline=outline, width=1)

    # テキスト短縮
    short = text
    if len(short) > 12:
        short = short[:11] + '…'

    bbox = draw.textbbox((0, 0), short, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (w - tw) // 2, y + (h - th) // 2), short, fill=text_color, font=font)


def draw_vertical_line(draw, x, y1, y2, color=COLORS['arrow']):
    """縦線"""
    draw.line([(x, y1), (x, y2)], fill=color, width=1)


def draw_horizontal_line(draw, x1, x2, y, color=COLORS['arrow']):
    """横線"""
    draw.line([(x1, y), (x2, y)], fill=color, width=1)


def generate_sitemap():
    """サイトマップ形式の画面遷移図"""

    # フォント
    title_font = get_font(16, 'W6')
    menu_font = get_font(10, 'W6')
    screen_font = get_font(8, 'W4')
    small_font = get_font(7, 'W3')

    # キャンバス
    canvas_w = 1700
    canvas_h = 950
    canvas = Image.new('RGB', (canvas_w, canvas_h), COLORS['bg'])
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((20, 10), "全体画面遷移図", fill=(30, 30, 30), font=title_font)

    # ===== ログインエリア =====
    login_y = 50
    draw_box(draw, 80, login_y, 100, 35, "ログイン", menu_font,
             COLORS['login_fill'], COLORS['login_outline'])

    # ログインからメニューへの線
    draw_vertical_line(draw, 130, login_y + 35, login_y + 55)

    # ===== TOP Menu =====
    menu_y = login_y + 60
    menu_items = [
        ('個体管理', 'gray'),
        ('ラベル発行', 'yellow'),
        ('資産管理', 'yellow'),
        ('申請管理', 'yellow'),
        ('見積管理', 'yellow'),
        ('マスタ管理', 'blue'),
    ]

    menu_start_x = 50
    menu_positions = {}

    # 横線（メニュー間を繋ぐ）
    total_width = len(menu_items) * COL_WIDTH
    draw.text((menu_start_x - 40, menu_y + 8), "TOP\nMenu", fill=(80, 80, 80), font=small_font)
    draw_horizontal_line(draw, menu_start_x + BOX_W//2, menu_start_x + total_width - COL_WIDTH + BOX_W//2, menu_y - 5)

    for i, (name, color_type) in enumerate(menu_items):
        x = menu_start_x + i * COL_WIDTH
        draw_vertical_line(draw, x + BOX_W//2, menu_y - 5, menu_y)
        draw_box(draw, x, menu_y, BOX_W, 30, name, menu_font,
                 COLORS['menu_fill'], COLORS['menu_outline'])
        menu_positions[name] = (x, menu_y)

    # ===== 各グループの詳細画面 =====
    group_y = menu_y + 50

    # グループ定義（画面リスト）
    groups = {
        '個体管理': {
            'color': 'gray_bg',
            'screens': [
                ['オフライン準備', '調査場所選択', '現有品調査', '調査履歴'],
                ['登録内容修正'],
                ['資産台帳取込', '資産マスタ選択'],
                ['データ突合', '台帳データ選択'],
            ]
        },
        'ラベル発行': {
            'color': 'yellow_bg',
            'screens': [
                ['QRコード発行', 'QR印刷プレビュー'],
            ]
        },
        '資産管理': {
            'color': 'yellow_bg',
            'screens': [
                ['資産一覧', '資産詳細', '資産カルテ'],
                ['棚卸'],
            ]
        },
        '申請管理': {
            'color': 'yellow_bg',
            'screens': [
                ['リモデル申請'],
                ['編集リスト', '申請一覧'],
            ]
        },
        '見積管理': {
            'color': 'yellow_bg',
            'screens': [
                ['見積データBOX'],
                ['見積書登録モーダル'],
                ['OCR明細確認'],
                ['AI判定確認'],
                ['個体品目AI判定'],
                ['個体登録・金額按分'],
                ['登録確認'],
            ]
        },
        'マスタ管理': {
            'color': 'blue_bg',
            'screens': [
                ['SHIP施設マスタ'],
                ['SHIP資産マスタ'],
                ['SHIP部署マスタ'],
                ['個別施設マスタ'],
                ['ユーザー管理'],
            ]
        },
    }

    col_x = menu_start_x

    for group_name, config in groups.items():
        screens_list = config['screens']
        bg_color = COLORS[config['color']]

        # グループの高さを計算
        total_rows = sum(len(row) for row in screens_list) + len(screens_list) - 1
        group_h = total_rows * ROW_HEIGHT + 30

        # 最大幅を計算
        max_screens_in_row = max(len(row) for row in screens_list)
        group_w = max(COL_WIDTH - 10, max_screens_in_row * (BOX_W + 5))

        # グループ背景
        draw.rounded_rectangle(
            [col_x - 5, group_y - 5, col_x + group_w + 5, group_y + group_h],
            radius=6, fill=bg_color, outline=(200, 200, 200)
        )

        # メニューからの接続線
        mx, my = menu_positions.get(group_name, (col_x, menu_y))
        draw_vertical_line(draw, mx + BOX_W//2, my + 30, group_y - 5)

        # 画面を配置
        current_y = group_y + 5

        for row_screens in screens_list:
            for j, screen_name in enumerate(row_screens):
                sx = col_x + j * (BOX_W + 5)
                draw_box(draw, sx, current_y, BOX_W, BOX_H, screen_name, screen_font,
                         COLORS['screen_fill'], COLORS['screen_outline'])

                # 縦方向の遷移線（同じ列内）
                if j == 0 and current_y > group_y + 5:
                    draw_vertical_line(draw, sx + BOX_W//2, current_y - ROW_HEIGHT + BOX_H, current_y)

                # 横方向の遷移線（同じ行内）
                if j > 0:
                    prev_x = col_x + (j-1) * (BOX_W + 5) + BOX_W
                    draw.line([(prev_x, current_y + BOX_H//2), (sx, current_y + BOX_H//2)],
                              fill=COLORS['arrow'], width=1)
                    # 矢印
                    draw.polygon([(sx, current_y + BOX_H//2),
                                  (sx - 5, current_y + BOX_H//2 - 3),
                                  (sx - 5, current_y + BOX_H//2 + 3)],
                                 fill=COLORS['arrow'])

            current_y += ROW_HEIGHT

        col_x += COL_WIDTH

    # ===== 凡例 =====
    legend_x = canvas_w - 200
    legend_y = 50
    draw.text((legend_x, legend_y), "【凡例】", fill=(60, 60, 60), font=menu_font)

    draw.rectangle([legend_x, legend_y + 25, legend_x + 60, legend_y + 45],
                   fill=COLORS['gray_bg'], outline=(180, 180, 180))
    draw.text((legend_x + 70, legend_y + 28), "データ準備系", fill=(60, 60, 60), font=screen_font)

    draw.rectangle([legend_x, legend_y + 55, legend_x + 60, legend_y + 75],
                   fill=COLORS['yellow_bg'], outline=(180, 180, 180))
    draw.text((legend_x + 70, legend_y + 58), "業務機能系", fill=(60, 60, 60), font=screen_font)

    draw.rectangle([legend_x, legend_y + 85, legend_x + 60, legend_y + 105],
                   fill=COLORS['blue_bg'], outline=(180, 180, 180))
    draw.text((legend_x + 70, legend_y + 88), "マスタ管理系", fill=(60, 60, 60), font=screen_font)

    # ===== 注釈 =====
    note_y = canvas_h - 80
    draw.text((20, note_y), "【遷移の流れ】", fill=(60, 60, 60), font=menu_font)
    draw.text((20, note_y + 20), "・ログイン → メニュー → 各機能を選択", fill=(80, 80, 80), font=screen_font)
    draw.text((20, note_y + 38), "・各グループ内は上から下、左から右へ遷移", fill=(80, 80, 80), font=screen_font)
    draw.text((20, note_y + 56), "・見積管理はウィザード形式（順次遷移）", fill=(80, 80, 80), font=screen_font)

    return canvas


def create_excel(image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp = "/tmp/sitemap_diagram.png"
    image.save(temp, dpi=(150, 150))

    img = XLImage(temp)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"Excel保存: {output_path}")
    os.remove(temp)


def main():
    print("サイトマップ形式の画面遷移図を生成...")

    image = generate_sitemap()

    # PNG保存
    png_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png'
    image.save(png_path, dpi=(150, 150))
    print(f"PNG保存: {png_path}")

    # Excel保存
    create_excel(image, '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx')


if __name__ == '__main__':
    main()
