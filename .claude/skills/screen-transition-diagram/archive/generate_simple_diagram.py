#!/usr/bin/env python3
"""
シンプルな画面遷移図生成スクリプト
画面名ボックスと矢印のみで構成
"""

import json
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_WIDTH = 180
BOX_HEIGHT = 50
GRID_SPACING_X = 250
GRID_SPACING_Y = 120
MARGIN = 100
GROUP_LABEL_WIDTH = 180

# 色
BOX_FILL = (240, 248, 255)  # Alice Blue
BOX_OUTLINE = (70, 130, 180)  # Steel Blue
ARROW_COLOR = (220, 20, 60)  # Crimson
TEXT_COLOR = (25, 25, 112)  # Midnight Blue


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def draw_box(draw, x, y, text, font, fill=BOX_FILL, outline=BOX_OUTLINE):
    """画面ボックスを描画"""
    # 角丸四角形
    radius = 8
    draw.rounded_rectangle(
        [x, y, x + BOX_WIDTH, y + BOX_HEIGHT],
        radius=radius, fill=fill, outline=outline, width=2
    )

    # テキストを中央に配置
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = x + (BOX_WIDTH - text_w) // 2
    text_y = y + (BOX_HEIGHT - text_h) // 2
    draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)


def draw_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=3):
    """矢印を描画"""
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)

    # 矢印の先端
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_length = 15
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

    # 矢印の先端（下向き）
    arrow_length = 15
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


def generate_simple_diagram(transitions_data):
    """シンプルな画面遷移図を生成"""
    screens = {s['id']: s for s in transitions_data['screens']}
    transitions = transitions_data.get('transitions', [])

    # キャンバスサイズを計算
    max_row = max(s['position']['row'] for s in transitions_data['screens'])
    max_col = max(s['position']['col'] for s in transitions_data['screens'])

    canvas_width = GROUP_LABEL_WIDTH + MARGIN + max_col * GRID_SPACING_X + 50
    canvas_height = MARGIN * 2 + max_row * GRID_SPACING_Y

    # キャンバス作成
    canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # フォント
    try:
        font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc", 11)
        group_font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc", 12)
    except:
        font = ImageFont.load_default()
        group_font = font

    # グループラベルを描画
    row_groups = {}
    for screen in transitions_data['screens']:
        row = screen['position']['row']
        if row not in row_groups:
            row_groups[row] = screen.get('group', '')

    for row, group_name in row_groups.items():
        if group_name and group_name != 'メイン遷移':
            y = MARGIN + (row - 1) * GRID_SPACING_Y + BOX_HEIGHT // 2 - 10
            draw.rectangle([10, y - 5, GROUP_LABEL_WIDTH - 10, y + 20],
                          fill=(230, 240, 255), outline=(70, 130, 180), width=1)
            draw.text((15, y), group_name, fill=(25, 25, 112), font=group_font)

    # 画面ボックスの位置を計算・記録
    box_positions = {}
    effective_margin = GROUP_LABEL_WIDTH + MARGIN

    for screen in transitions_data['screens']:
        row = screen['position']['row'] - 1
        col = screen['position']['col'] - 1

        x = effective_margin + col * GRID_SPACING_X
        y = MARGIN + row * GRID_SPACING_Y

        box_positions[screen['id']] = (x, y)

        # ボックスを描画
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
        elif from_col == to_col:  # 垂直
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_arrow(draw, x1, y1, x2, y2)
        else:  # L字
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_elbow_arrow(draw, x1, y1, x2, y2)

        # ラベルを描画
        if trans.get('label'):
            mid_x = (x1 + x2) // 2
            mid_y = (y1 + y2) // 2
            label_text = trans['label']
            bbox = draw.textbbox((0, 0), label_text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            draw.rectangle(
                [mid_x - text_w // 2 - 3, mid_y - text_h // 2 - 2,
                 mid_x + text_w // 2 + 3, mid_y + text_h // 2 + 2],
                fill=(255, 255, 220), outline=(200, 180, 0)
            )
            draw.text((mid_x - text_w // 2, mid_y - text_h // 2),
                      label_text, fill=(80, 80, 80), font=font)

    return canvas


def create_excel(diagram_image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp_path = "/tmp/simple_diagram_temp.png"
    diagram_image.save(temp_path)

    img = XLImage(temp_path)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"画面遷移図を保存しました: {output_path}")

    os.remove(temp_path)


def main():
    transitions_path = '/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json'
    output_path = '/Users/watanaberyouta/Desktop/画面設計書/画面遷移図.xlsx'

    transitions_data = load_transitions(transitions_path)

    print(f"画面数: {len(transitions_data['screens'])}")
    print(f"遷移数: {len(transitions_data.get('transitions', []))}")

    diagram = generate_simple_diagram(transitions_data)
    create_excel(diagram, output_path)


if __name__ == '__main__':
    main()
