#!/usr/bin/env python3
"""
スクリーンショット付き全画面遷移図生成
矢印は画像の外側に配置
"""

import json
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
THUMB_SCALE = 0.12  # サムネイルスケール
GRID_SPACING_X = 220  # 横間隔
GRID_SPACING_Y = 160  # 縦間隔（矢印用スペース確保）
MARGIN = 60
GROUP_LABEL_WIDTH = 90
ARROW_MARGIN = 25  # 矢印と画像の間隔

# 色
ARROW_COLOR = (200, 50, 50)
LABEL_BG = (255, 255, 220)
LABEL_OUTLINE = (200, 180, 100)

# 画面→スクリーンショットのマッピング
SCREENSHOT_MAP = {
    'login': 'ログイン画面_PC.png',
    'password-reset': 'パスワード再設定URL送信画面_PC.png',
    'main': 'メニュー画面_PC.png',
    'offline-prep': 'オフライン準備画面_PC.png',
    'survey-location': 'オフライン準備画面_PC.png',  # 同じ画面を使用
    'asset-survey-integrated': 'オフライン準備画面_PC.png',
    'history': 'オフライン準備画面_PC.png',
    'registration-edit': '登録内容修正画面_PC.png',
    'asset-import': '資産台帳取込画面_PC.png',
    'asset-matching': '資産マスタ選択画面_PC.png',
    'data-matching': 'データ突合画面_PC.png',
    'data-matching-ledger': '固定資産台帳（未突合）_PC.png',
    'qr-issue': 'ラベル発行画面_PC.png',
    'qr-print': 'ラベルプレビュー画面_PC.png',
    'asset-search-result': '資産一覧画面_PC.png',
    'asset-detail': '資産一覧画面_PC.png',
    'asset-karte': '資産カルテ画面_PC.png',
    'inventory': '棚卸画面_PC.png',
    'remodel-application': '改修申請画面_PC.png',
    'remodel-application-list': '編集リスト画面_PC.png',
    'application-list': '申請一覧画面_PC.png',
    'quotation-data-box': '見積書依頼グループタブ画面_PC.png',
    'quotation-registration-modal': '見積書登録モーダル_PC.png',
    'ocr-confirm': 'OCR明細確認画面_PC.png',
    'category-registration': '見積登録（購入）AI判定確認_PC.png',
    'item-ai-matching': '見積登録（購入）個体品目AI判定_PC.png',
    'price-allocation': '見積登録（購入）個体登録及び金額按分_PC.png',
    'registration-confirm': '見積登録（購入）登録確認_PC.png',
    'quotation-processing': '見積管理画面_PC.png',
    'ship-facility-master': '施設マスタ一覧画面_PC.png',
    'ship-asset-master': '資産マスタ一覧画面_PC.png',
    'ship-department-master': 'SHIP部署マスタ一覧画面_PC.png',
    'hospital-facility-master': '個別部署マスタ一覧画面_PC.png',
    'user-management': 'ユーザー一覧画面_PC.png',
}

# 画面配置（row, col）
SCREEN_POSITIONS = {
    'login': (1, 1),
    'password-reset': (1, 2),
    'main': (1, 4),

    'offline-prep': (2, 1),
    'survey-location': (2, 2),
    'asset-survey-integrated': (2, 3),
    'history': (2, 4),

    'registration-edit': (3, 1),
    'asset-import': (3, 2),
    'asset-matching': (3, 3),
    'data-matching': (3, 4),
    'data-matching-ledger': (3, 5),

    'qr-issue': (4, 1),
    'qr-print': (4, 2),

    'asset-search-result': (5, 1),
    'asset-detail': (5, 2),
    'asset-karte': (5, 3),
    'inventory': (5, 4),

    'remodel-application': (6, 1),
    'remodel-application-list': (6, 2),
    'application-list': (6, 3),

    'quotation-data-box': (7, 1),
    'quotation-registration-modal': (7, 2),
    'ocr-confirm': (7, 3),
    'category-registration': (7, 4),

    'item-ai-matching': (8, 1),
    'price-allocation': (8, 2),
    'registration-confirm': (8, 3),
    'quotation-processing': (8, 4),

    'ship-facility-master': (9, 1),
    'ship-asset-master': (9, 2),
    'ship-department-master': (9, 3),
    'hospital-facility-master': (9, 4),
    'user-management': (9, 5),
}

# グループ定義
GROUP_ROWS = {
    '認証': (1, 1),
    '個体管理': (2, 3),
    'ラベル発行': (4, 4),
    '資産管理': (5, 5),
    '申請管理': (6, 6),
    '見積管理': (7, 8),
    'マスタ管理': (9, 9),
}

GROUP_COLORS = {
    '認証': (255, 240, 240),
    '個体管理': (240, 250, 240),
    'ラベル発行': (255, 255, 235),
    '資産管理': (255, 250, 240),
    '申請管理': (245, 240, 255),
    '見積管理': (255, 248, 245),
    'マスタ管理': (240, 248, 255),
}


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def load_screenshot(screenshots_dir, filename, scale=THUMB_SCALE):
    """スクリーンショットを読み込んでリサイズ"""
    path = Path(screenshots_dir) / filename
    if not path.exists():
        # プレースホルダー画像
        img = Image.new('RGB', (180, 120), (220, 220, 220))
        draw = ImageDraw.Draw(img)
        draw.text((10, 50), filename[:15], fill=(100, 100, 100))
        return img

    img = Image.open(path)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    return img.resize((new_w, new_h), Image.LANCZOS)


def draw_arrow_horizontal(draw, x1, y, x2, color=ARROW_COLOR, width=2):
    """水平矢印（画像の間に描画）"""
    draw.line([(x1, y), (x2, y)], fill=color, width=width)
    # 矢印先端
    if x2 > x1:
        draw.polygon([(x2, y), (x2-8, y-5), (x2-8, y+5)], fill=color)
    else:
        draw.polygon([(x2, y), (x2+8, y-5), (x2+8, y+5)], fill=color)


def draw_arrow_vertical(draw, x, y1, y2, color=ARROW_COLOR, width=2):
    """垂直矢印（画像の間に描画）"""
    draw.line([(x, y1), (x, y2)], fill=color, width=width)
    # 矢印先端
    if y2 > y1:
        draw.polygon([(x, y2), (x-5, y2-8), (x+5, y2-8)], fill=color)
    else:
        draw.polygon([(x, y2), (x-5, y2+8), (x+5, y2+8)], fill=color)


def draw_arrow_elbow(draw, x1, y1, x2, y2, color=ARROW_COLOR, width=2):
    """L字矢印（画像の外側を通る）"""
    mid_y = (y1 + y2) // 2

    draw.line([(x1, y1), (x1, mid_y)], fill=color, width=width)
    draw.line([(x1, mid_y), (x2, mid_y)], fill=color, width=width)
    draw.line([(x2, mid_y), (x2, y2)], fill=color, width=width)

    # 矢印先端
    if y2 > y1:
        draw.polygon([(x2, y2), (x2-5, y2-8), (x2+5, y2-8)], fill=color)
    else:
        draw.polygon([(x2, y2), (x2-5, y2+8), (x2+5, y2+8)], fill=color)


def generate_diagram(data, screenshots_dir):
    """スクリーンショット付き遷移図を生成"""

    screens = {s['id']: s for s in data['screens']}
    transitions = data['transitions']

    # フォント
    title_font = get_font(14, 'W6')
    group_font = get_font(10, 'W6')
    label_font = get_font(9, 'W4')
    small_font = get_font(7, 'W3')

    # サムネイル読み込み
    thumbnails = {}
    thumb_sizes = {}
    for screen_id, filename in SCREENSHOT_MAP.items():
        img = load_screenshot(screenshots_dir, filename)
        thumbnails[screen_id] = img
        thumb_sizes[screen_id] = img.size

    # 代表サイズ
    avg_w = sum(s[0] for s in thumb_sizes.values()) // len(thumb_sizes)
    avg_h = sum(s[1] for s in thumb_sizes.values()) // len(thumb_sizes)

    # キャンバスサイズ
    max_row = max(pos[0] for pos in SCREEN_POSITIONS.values())
    max_col = max(pos[1] for pos in SCREEN_POSITIONS.values())

    canvas_w = GROUP_LABEL_WIDTH + MARGIN + (max_col) * GRID_SPACING_X + 100
    canvas_h = MARGIN + (max_row) * GRID_SPACING_Y + 100

    canvas = Image.new('RGB', (canvas_w, canvas_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((15, 10), "全体画面遷移図", fill=(30, 30, 30), font=title_font)
    draw.text((15, 28), f"画面数: {len(screens)}  遷移数: {len(transitions)}", fill=(100, 100, 100), font=small_font)

    effective_margin = GROUP_LABEL_WIDTH + MARGIN

    # グループ背景
    for group, (start_row, end_row) in GROUP_ROWS.items():
        y1 = MARGIN + (start_row - 1) * GRID_SPACING_Y - 5
        y2 = MARGIN + end_row * GRID_SPACING_Y - 25
        color = GROUP_COLORS.get(group, (250, 250, 250))
        draw.rounded_rectangle([3, y1, canvas_w - 5, y2], radius=6, fill=color, outline=(210, 210, 210))
        draw.text((8, y1 + 3), group, fill=(80, 80, 80), font=group_font)

    # スクリーンショット配置 & 位置記録
    screen_positions = {}  # {id: (x, y, w, h)}

    for screen_id, (row, col) in SCREEN_POSITIONS.items():
        if screen_id not in thumbnails:
            continue

        thumb = thumbnails[screen_id]
        tw, th = thumb.size

        x = effective_margin + (col - 1) * GRID_SPACING_X
        y = MARGIN + (row - 1) * GRID_SPACING_Y

        # 画面名ラベル
        name = screens[screen_id]['name'].replace('画面', '')
        if len(name) > 10:
            name = name[:9] + '…'
        draw.text((x, y - 12), name, fill=(50, 50, 50), font=label_font)

        # 枠線
        draw.rectangle([x-1, y-1, x+tw+1, y+th+1], outline=(150, 150, 150), width=1)

        # サムネイル貼り付け
        canvas.paste(thumb, (x, y))

        screen_positions[screen_id] = (x, y, tw, th)

    # 遷移矢印を描画（画像の外側）
    for trans in transitions:
        from_id = trans['from']
        to_id = trans['to']
        label = trans.get('label', '')

        if from_id not in screen_positions or to_id not in screen_positions:
            continue

        # 戻る遷移はスキップ
        if label == '戻る':
            continue

        fx, fy, fw, fh = screen_positions[from_id]
        tx, ty, tw, th = screen_positions[to_id]

        from_row, from_col = SCREEN_POSITIONS[from_id]
        to_row, to_col = SCREEN_POSITIONS[to_id]

        # 接続点計算（画像の外側に配置）
        if from_row == to_row:  # 同じ行（水平）
            if from_col < to_col:  # 右へ
                arrow_y = fy + fh // 2
                x1 = fx + fw + 5
                x2 = tx - 5
            else:  # 左へ
                arrow_y = fy + fh // 2
                x1 = fx - 5
                x2 = tx + tw + 5
            draw_arrow_horizontal(draw, x1, arrow_y, x2)

            # ラベル
            if label:
                lx = (x1 + x2) // 2
                ly = arrow_y - 12
                bbox = draw.textbbox((0, 0), label, font=small_font)
                lw = bbox[2] - bbox[0]
                draw.rectangle([lx - lw//2 - 2, ly - 1, lx + lw//2 + 2, ly + 10], fill=LABEL_BG, outline=LABEL_OUTLINE)
                draw.text((lx - lw//2, ly), label, fill=(80, 80, 80), font=small_font)

        elif from_col == to_col:  # 同じ列（垂直）
            if from_row < to_row:  # 下へ
                arrow_x = fx + fw // 2
                y1 = fy + fh + 5
                y2 = ty - 15  # ラベル用スペース確保
            else:  # 上へ
                arrow_x = fx + fw // 2
                y1 = fy - 5
                y2 = ty + th + 5
            draw_arrow_vertical(draw, arrow_x, y1, y2)

            # ラベル
            if label:
                lx = arrow_x + 5
                ly = (y1 + y2) // 2 - 5
                draw.text((lx, ly), label, fill=(150, 80, 80), font=small_font)

        else:  # 斜め（L字）
            if from_row < to_row:
                x1 = fx + fw // 2
                y1 = fy + fh + 5
                x2 = tx + tw // 2
                y2 = ty - 15
            else:
                x1 = fx + fw // 2
                y1 = fy - 5
                x2 = tx + tw // 2
                y2 = ty + th + 5
            draw_arrow_elbow(draw, x1, y1, x2, y2)

            # ラベル
            if label:
                lx = (x1 + x2) // 2 + 5
                ly = (y1 + y2) // 2 - 5
                draw.text((lx, ly), label, fill=(150, 80, 80), font=small_font)

    return canvas


def create_excel(image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp = "/tmp/screenshot_diagram.png"
    image.save(temp, dpi=(150, 150))

    img = XLImage(temp)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"Excel保存: {output_path}")
    os.remove(temp)


def main():
    data = load_transitions('/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json')
    screenshots_dir = '/Users/watanaberyouta/Desktop/画面設計書/screenshots'

    print(f"画面数: {len(data['screens'])}")
    print(f"遷移数: {len(data['transitions'])}")

    image = generate_diagram(data, screenshots_dir)

    # PNG保存
    png_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png'
    image.save(png_path, dpi=(150, 150))
    print(f"PNG保存: {png_path}")

    # Excel保存
    create_excel(image, '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx')


if __name__ == '__main__':
    main()
