#!/usr/bin/env python3
"""
全画面遷移図生成（PILボックス+矢印方式）
34画面・56遷移を全て描画
"""

import json
import os
import math
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_WIDTH = 140
BOX_HEIGHT = 40
GRID_SPACING_X = 180
GRID_SPACING_Y = 90
MARGIN = 80
GROUP_LABEL_WIDTH = 100

# 色
BOX_FILL = (240, 248, 255)
BOX_OUTLINE = (70, 130, 180)
ARROW_COLOR = (200, 60, 60)
TEXT_COLOR = (25, 25, 80)

# グループ色
GROUP_COLORS = {
    '認証': (255, 230, 230),
    'メイン': (255, 245, 200),
    '個体管理': (230, 245, 230),
    'ラベル発行': (255, 255, 220),
    '資産管理': (255, 250, 230),
    '申請管理': (250, 240, 255),
    '見積管理': (255, 245, 238),
    'マスタ管理': (230, 242, 255),
}

# 画面配置（row, col）- 手動で最適化
SCREEN_POSITIONS = {
    # 認証（row 1）
    'login': (1, 1),
    'password-reset': (1, 2),

    # メイン（row 1）
    'main': (1, 4),

    # 個体管理（row 2-3）
    'offline-prep': (2, 1),
    'survey-location': (2, 2),
    'asset-survey-integrated': (2, 3),
    'history': (2, 4),
    'registration-edit': (3, 1),
    'asset-import': (3, 2),
    'asset-matching': (3, 3),
    'data-matching': (3, 4),
    'data-matching-ledger': (3, 5),

    # ラベル発行（row 4）
    'qr-issue': (4, 1),
    'qr-print': (4, 2),

    # 資産管理（row 5）
    'asset-search-result': (5, 1),
    'asset-detail': (5, 2),
    'asset-karte': (5, 3),
    'inventory': (5, 4),

    # 申請管理（row 6）
    'remodel-application': (6, 1),
    'remodel-application-list': (6, 2),
    'application-list': (6, 3),

    # 見積管理（row 7-8）
    'quotation-data-box': (7, 1),
    'quotation-registration-modal': (7, 2),
    'ocr-confirm': (7, 3),
    'category-registration': (7, 4),
    'item-ai-matching': (8, 1),
    'price-allocation': (8, 2),
    'registration-confirm': (8, 3),
    'quotation-processing': (8, 4),

    # マスタ管理（row 9）
    'ship-facility-master': (9, 1),
    'ship-asset-master': (9, 2),
    'ship-department-master': (9, 3),
    'hospital-facility-master': (9, 4),
    'user-management': (9, 5),
}


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def draw_rounded_box(draw, x, y, w, h, text, font, fill, outline, text_color=TEXT_COLOR):
    """角丸ボックスを描画"""
    draw.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=fill, outline=outline, width=2)

    # テキスト中央配置
    short = text.replace('画面', '')
    if len(short) > 12:
        short = short[:11] + '…'

    bbox = draw.textbbox((0, 0), short, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (w - tw) // 2, y + (h - th) // 2), short, fill=text_color, font=font)


def draw_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=2):
    """矢印を描画"""
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)

    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 10
    arrow_angle = math.pi / 6

    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)


def draw_elbow_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=2):
    """L字矢印を描画"""
    mid_y = (y1 + y2) // 2

    draw.line([(x1, y1), (x1, mid_y)], fill=color, width=width)
    draw.line([(x1, mid_y), (x2, mid_y)], fill=color, width=width)
    draw.line([(x2, mid_y), (x2, y2)], fill=color, width=width)

    # 矢印先端
    arrow_len = 10
    arrow_angle = math.pi / 6
    if y2 > y1:
        angle = math.pi / 2
    else:
        angle = -math.pi / 2

    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)


def generate_diagram(data):
    """全画面遷移図を生成"""

    screens = {s['id']: s for s in data['screens']}
    transitions = data['transitions']

    # フォント
    font = get_font(10, 'W4')
    group_font = get_font(11, 'W6')
    label_font = get_font(8, 'W3')
    title_font = get_font(14, 'W6')

    # キャンバスサイズ
    max_row = max(pos[0] for pos in SCREEN_POSITIONS.values())
    max_col = max(pos[1] for pos in SCREEN_POSITIONS.values())

    canvas_w = GROUP_LABEL_WIDTH + MARGIN + (max_col + 1) * GRID_SPACING_X
    canvas_h = MARGIN + (max_row + 1) * GRID_SPACING_Y + 50

    canvas = Image.new('RGB', (canvas_w, canvas_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((20, 15), "全体画面遷移図", fill=(30, 30, 30), font=title_font)
    draw.text((20, 35), f"画面数: {len(screens)}  遷移数: {len(transitions)}", fill=(100, 100, 100), font=label_font)

    # グループ別背景を描画
    group_rows = {
        '認証': (1, 1),
        'メイン': (1, 1),
        '個体管理': (2, 3),
        'ラベル発行': (4, 4),
        '資産管理': (5, 5),
        '申請管理': (6, 6),
        '見積管理': (7, 8),
        'マスタ管理': (9, 9),
    }

    effective_margin = GROUP_LABEL_WIDTH + MARGIN

    for group, (start_row, end_row) in group_rows.items():
        y1 = MARGIN + (start_row - 1) * GRID_SPACING_Y - 10
        y2 = MARGIN + end_row * GRID_SPACING_Y - 20
        color = GROUP_COLORS.get(group, (250, 250, 250))

        draw.rounded_rectangle([5, y1, canvas_w - 10, y2], radius=8, fill=color, outline=(200, 200, 200))
        draw.text((12, y1 + 5), group, fill=(80, 80, 80), font=group_font)

    # 画面ボックスを描画し、位置を記録
    box_positions = {}

    for screen_id, (row, col) in SCREEN_POSITIONS.items():
        if screen_id not in screens:
            continue

        screen = screens[screen_id]
        x = effective_margin + (col - 1) * GRID_SPACING_X
        y = MARGIN + (row - 1) * GRID_SPACING_Y

        # 特別な色
        if screen_id == 'login':
            fill = (144, 238, 144)
            outline = (34, 139, 34)
        elif screen_id == 'main':
            fill = (255, 228, 181)
            outline = (255, 140, 0)
        else:
            fill = BOX_FILL
            outline = BOX_OUTLINE

        draw_rounded_box(draw, x, y, BOX_WIDTH, BOX_HEIGHT, screen['name'], font, fill, outline)
        box_positions[screen_id] = (x, y)

    # 遷移矢印を描画
    for trans in transitions:
        from_id = trans['from']
        to_id = trans['to']

        if from_id not in box_positions or to_id not in box_positions:
            continue

        from_x, from_y = box_positions[from_id]
        to_x, to_y = box_positions[to_id]

        from_row, from_col = SCREEN_POSITIONS.get(from_id, (0, 0))
        to_row, to_col = SCREEN_POSITIONS.get(to_id, (0, 0))

        # 接続点を計算
        if from_row == to_row:  # 水平
            if from_col < to_col:
                x1, y1 = from_x + BOX_WIDTH, from_y + BOX_HEIGHT // 2
                x2, y2 = to_x, to_y + BOX_HEIGHT // 2
            else:
                x1, y1 = from_x, from_y + BOX_HEIGHT // 2
                x2, y2 = to_x + BOX_WIDTH, to_y + BOX_HEIGHT // 2
            draw_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = (x1 + x2) // 2, y1 - 12
        elif from_col == to_col:  # 垂直
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = x1 + 5, (y1 + y2) // 2 - 6
        else:  # L字
            if from_row < to_row:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y + BOX_HEIGHT
                x2, y2 = to_x + BOX_WIDTH // 2, to_y
            else:
                x1, y1 = from_x + BOX_WIDTH // 2, from_y
                x2, y2 = to_x + BOX_WIDTH // 2, to_y + BOX_HEIGHT
            draw_elbow_arrow(draw, x1, y1, x2, y2)
            label_x, label_y = (x1 + x2) // 2 + 5, (y1 + y2) // 2 - 6

        # ラベル
        if trans.get('label') and trans['label'] not in ['戻る']:
            label = trans['label']
            bbox = draw.textbbox((0, 0), label, font=label_font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            draw.rectangle([label_x - tw//2 - 2, label_y - 1, label_x + tw//2 + 2, label_y + th + 1],
                          fill=(255, 255, 230), outline=(200, 180, 100))
            draw.text((label_x - tw//2, label_y), label, fill=(80, 80, 80), font=label_font)

    return canvas


def create_excel(image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp = "/tmp/complete_diagram.png"
    image.save(temp, dpi=(150, 150))

    img = XLImage(temp)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"Excel保存: {output_path}")
    os.remove(temp)


def main():
    data = load_transitions('/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json')

    print(f"画面数: {len(data['screens'])}")
    print(f"遷移数: {len(data['transitions'])}")

    image = generate_diagram(data)

    # PNG保存
    png_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png'
    image.save(png_path, dpi=(150, 150))
    print(f"PNG保存: {png_path}")

    # Excel保存
    create_excel(image, '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx')


if __name__ == '__main__':
    main()
