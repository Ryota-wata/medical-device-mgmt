#!/usr/bin/env python3
"""
改良版画面遷移図生成スクリプト
グループ別背景色、見やすい矢印、統一レイアウト
"""

import json
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_WIDTH = 160
BOX_HEIGHT = 40
GRID_SPACING_X = 200
GRID_SPACING_Y = 80
MARGIN = 60
GROUP_LABEL_WIDTH = 120

# グループ別背景色
GROUP_COLORS = {
    'メイン遷移': (255, 255, 255),      # 白
    '個体管理リスト': (255, 245, 238),   # 薄いオレンジ
    'ラベル発行': (240, 255, 240),       # 薄い緑
    '資産管理': (240, 248, 255),         # 薄い青
    '編集リスト': (255, 250, 240),       # 薄いクリーム
    '見積管理': (248, 248, 255),         # 薄い紫
    'マスタ管理': (245, 245, 245),       # 薄いグレー
}

# 色
BOX_FILL = (240, 248, 255)
BOX_OUTLINE = (70, 130, 180)
ARROW_COLOR = (220, 50, 50)
TEXT_COLOR = (25, 25, 80)
GROUP_BG = (245, 250, 255)


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def draw_rounded_rect(draw, xy, radius, fill, outline, width=2):
    """角丸四角形を描画"""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_box(draw, x, y, text, font, fill=BOX_FILL, outline=BOX_OUTLINE):
    """画面ボックスを描画"""
    draw_rounded_rect(draw, [x, y, x + BOX_WIDTH, y + BOX_HEIGHT],
                      radius=6, fill=fill, outline=outline, width=2)

    # テキストを中央に配置
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = x + (BOX_WIDTH - text_w) // 2
    text_y = y + (BOX_HEIGHT - text_h) // 2
    draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)


def draw_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=3):
    """矢印を描画（直線）"""
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)

    # 矢印の先端
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_length = 12
    arrow_angle = math.pi / 6

    ax1 = x2 - arrow_length * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_length * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_length * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_length * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)


def draw_elbow_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=3):
    """L字型矢印を描画"""
    mid_y = (y1 + y2) // 2

    draw.line([(x1, y1), (x1, mid_y)], fill=color, width=width)
    draw.line([(x1, mid_y), (x2, mid_y)], fill=color, width=width)
    draw.line([(x2, mid_y), (x2, y2)], fill=color, width=width)

    # 矢印の先端
    arrow_length = 12
    arrow_angle = math.pi / 6
    if y2 > y1:
        angle = math.pi / 2
    else:
        angle = -math.pi / 2

    ax1 = x2 - arrow_length * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_length * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_length * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_length * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)


def generate_improved_diagram(transitions_data):
    """改良版画面遷移図を生成"""
    screens = {s['id']: s for s in transitions_data['screens']}
    transitions = transitions_data.get('transitions', [])

    # キャンバスサイズを計算
    max_row = max(s['position']['row'] for s in transitions_data['screens'])
    max_col = max(s['position']['col'] for s in transitions_data['screens'])

    canvas_width = GROUP_LABEL_WIDTH + MARGIN + (max_col + 1) * GRID_SPACING_X
    canvas_height = MARGIN * 2 + (max_row + 1) * GRID_SPACING_Y

    # キャンバス作成
    canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # フォント
    try:
        font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc", 10)
        group_font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc", 11)
        label_font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", 9)
    except:
        font = ImageFont.load_default()
        group_font = font
        label_font = font

    # グループ別の行範囲を計算
    group_rows = {}
    for screen in transitions_data['screens']:
        group = screen.get('group', 'その他')
        row = screen['position']['row']
        if group not in group_rows:
            group_rows[group] = [row, row]
        else:
            group_rows[group][0] = min(group_rows[group][0], row)
            group_rows[group][1] = max(group_rows[group][1], row)

    # グループ背景を描画
    effective_margin = GROUP_LABEL_WIDTH + MARGIN
    for group, (min_row, max_row_g) in group_rows.items():
        if group == 'メイン遷移':
            continue
        bg_color = GROUP_COLORS.get(group, (250, 250, 250))
        y1 = MARGIN + (min_row - 1) * GRID_SPACING_Y - 10
        y2 = MARGIN + max_row_g * GRID_SPACING_Y + BOX_HEIGHT + 10
        draw.rectangle([GROUP_LABEL_WIDTH - 5, y1, canvas_width - 20, y2],
                      fill=bg_color, outline=(200, 200, 200), width=1)

    # グループラベルを描画
    drawn_groups = set()
    for screen in transitions_data['screens']:
        group = screen.get('group', '')
        row = screen['position']['row']
        if group and group != 'メイン遷移' and group not in drawn_groups:
            y = MARGIN + (row - 1) * GRID_SPACING_Y + BOX_HEIGHT // 2 - 8
            draw.rectangle([5, y - 3, GROUP_LABEL_WIDTH - 10, y + 18],
                          fill=(70, 130, 180), outline=(50, 100, 150), width=1)
            draw.text((10, y), group, fill=(255, 255, 255), font=group_font)
            drawn_groups.add(group)

    # 画面ボックスの位置を計算・記録
    box_positions = {}

    for screen in transitions_data['screens']:
        row = screen['position']['row'] - 1
        col = screen['position']['col'] - 1

        x = effective_margin + col * GRID_SPACING_X
        y = MARGIN + row * GRID_SPACING_Y

        box_positions[screen['id']] = (x, y)
        draw_box(draw, x, y, screen['name'], font)

    # 遷移線を描画
    for trans in transitions:
        from_screen = screens.get(trans['from'])
        to_screen = screens.get(trans['to'])

        if not from_screen or not to_screen:
            continue

        from_x, from_y = box_positions[from_screen['id']]
        to_x, to_y = box_positions[to_screen['id']]

        from_row = from_screen['position']['row']
        from_col = from_screen['position']['col']
        to_row = to_screen['position']['row']
        to_col = to_screen['position']['col']

        # 接続点を計算
        if from_row == to_row:  # 水平
            if from_col < to_col:
                x1, y1 = from_x + BOX_WIDTH, from_y + BOX_HEIGHT // 2
                x2, y2 = to_x, to_y + BOX_HEIGHT // 2
            else:
                x1, y1 = from_x, from_y + BOX_HEIGHT // 2
                x2, y2 = to_x + BOX_WIDTH, to_y + BOX_HEIGHT // 2
            draw_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = (x1 + x2) // 2, y1 - 15
        elif from_col == to_col:  # 垂直
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = x1 + 5, (y1 + y2) // 2 - 5
        else:  # L字
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_elbow_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = (x1 + x2) // 2, (y1 + y2) // 2 - 5

        # ラベルを描画
        if trans.get('label'):
            label_text = trans['label']
            bbox = draw.textbbox((0, 0), label_text, font=label_font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            draw.rectangle(
                [label_x - text_w // 2 - 3, label_y - 2,
                 label_x + text_w // 2 + 3, label_y + text_h + 2],
                fill=(255, 255, 230), outline=(180, 160, 0)
            )
            draw.text((label_x - text_w // 2, label_y), label_text, fill=(80, 80, 80), font=label_font)

    return canvas


def create_excel(diagram_image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp_path = "/tmp/improved_diagram_temp.png"
    diagram_image.save(temp_path, dpi=(150, 150))

    img = XLImage(temp_path)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"画面遷移図を保存しました: {output_path}")

    os.remove(temp_path)


def main():
    transitions_path = '/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json'
    output_path = '/Users/watanaberyouta/Desktop/画面設計書/画面遷移図_PIL改良版.xlsx'

    transitions_data = load_transitions(transitions_path)

    print(f"画面数: {len(transitions_data['screens'])}")
    print(f"遷移数: {len(transitions_data.get('transitions', []))}")

    diagram = generate_improved_diagram(transitions_data)
    create_excel(diagram, output_path)


if __name__ == '__main__':
    main()
