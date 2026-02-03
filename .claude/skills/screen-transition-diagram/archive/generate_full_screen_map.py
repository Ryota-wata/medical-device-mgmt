#!/usr/bin/env python3
"""
全画面遷移図生成スクリプト
34画面・56遷移を階層構造で表示
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数
BOX_W = 100
BOX_H = 32
BOX_MARGIN_X = 15
BOX_MARGIN_Y = 10
GROUP_PADDING = 12
ARROW_COLOR = (180, 60, 60)

# グループ色
GROUP_COLORS = {
    '認証': (255, 240, 240),
    'メイン': (255, 250, 230),
    '個体管理': (240, 240, 240),
    'ラベル発行': (255, 255, 220),
    '資産管理': (255, 255, 220),
    '申請管理': (255, 255, 220),
    '見積管理': (255, 255, 220),
    'マスタ管理': (230, 245, 255),
}


def load_transitions(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def draw_box(draw, x, y, w, h, text, font, fill=(255,255,255), outline=(100,100,100), text_color=(30,30,30)):
    """ボックス描画"""
    draw.rounded_rectangle([x, y, x+w, y+h], radius=4, fill=fill, outline=outline, width=1)

    # テキスト（長い場合は縮小）
    short = text.replace('画面', '').replace('一覧', '一覧')
    if len(short) > 10:
        short = short[:9] + '…'

    bbox = draw.textbbox((0, 0), short, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x + (w - tw) // 2, y + (h - th) // 2), short, fill=text_color, font=font)

    return (x, y, w, h)


def draw_arrow(draw, x1, y1, x2, y2, color=ARROW_COLOR):
    """矢印描画"""
    draw.line([(x1, y1), (x2, y2)], fill=color, width=2)
    # 矢印先端
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 8
    a = math.pi / 6
    ax1 = x2 - length * math.cos(angle - a)
    ay1 = y2 - length * math.sin(angle - a)
    ax2 = x2 - length * math.cos(angle + a)
    ay2 = y2 - length * math.sin(angle + a)
    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)


def generate_full_map(data):
    """全画面遷移図を生成"""

    screens = {s['id']: s for s in data['screens']}
    transitions = data['transitions']

    # グループ別に整理
    groups = {}
    for s in data['screens']:
        g = s['group']
        if g not in groups:
            groups[g] = []
        groups[g].append(s)

    # フォント
    title_font = get_font(16, 'W6')
    group_font = get_font(10, 'W6')
    screen_font = get_font(8, 'W4')
    small_font = get_font(7, 'W3')

    # キャンバスサイズ
    canvas_w = 1800
    canvas_h = 1000
    canvas = Image.new('RGB', (canvas_w, canvas_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((20, 10), "全体画面遷移図", fill=(30, 30, 30), font=title_font)
    draw.text((20, 32), f"画面数: {len(data['screens'])}  遷移数: {len(transitions)}", fill=(100, 100, 100), font=small_font)

    # 画面位置を記録
    screen_pos = {}

    # ===== 認証エリア（左上） =====
    auth_x, auth_y = 30, 60
    draw.rounded_rectangle([auth_x, auth_y, auth_x + 250, auth_y + 100],
                          radius=8, fill=GROUP_COLORS['認証'], outline=(200, 180, 180))
    draw.text((auth_x + 10, auth_y + 5), "認証", fill=(100, 50, 50), font=group_font)

    # ログイン
    bx, by = auth_x + 20, auth_y + 30
    draw_box(draw, bx, by, BOX_W, BOX_H, "ログイン", screen_font, fill=(144, 238, 144), outline=(34, 139, 34))
    screen_pos['login'] = (bx, by, BOX_W, BOX_H)

    # パスワード再設定
    bx2 = bx + BOX_W + 30
    draw_box(draw, bx2, by, BOX_W, BOX_H, "PW再設定", screen_font)
    screen_pos['password-reset'] = (bx2, by, BOX_W, BOX_H)

    # 遷移矢印
    draw_arrow(draw, bx + BOX_W, by + BOX_H//2, bx2, by + BOX_H//2)

    # ===== メニュー =====
    menu_x, menu_y = 310, 70
    draw_box(draw, menu_x, menu_y, 120, 45, "メニュー画面", group_font,
             fill=(255, 228, 181), outline=(255, 140, 0))
    screen_pos['main'] = (menu_x, menu_y, 120, 45)

    # ログイン→メニュー
    draw_arrow(draw, auth_x + 250, auth_y + 50, menu_x, menu_y + 22)

    # ===== メニューからの分岐線 =====
    menu_bottom = menu_y + 45
    branch_y = menu_bottom + 20

    # 縦線
    draw.line([(menu_x + 60, menu_bottom), (menu_x + 60, branch_y)], fill=(100, 100, 100), width=2)

    # グループ配置位置
    group_positions = {
        '個体管理': (30, 180),
        'ラベル発行': (350, 180),
        '資産管理': (500, 180),
        '申請管理': (750, 180),
        '見積管理': (980, 180),
        'マスタ管理': (1450, 180),
    }

    # 横線
    min_x = min(pos[0] for pos in group_positions.values()) + 50
    max_x = max(pos[0] for pos in group_positions.values()) + 50
    draw.line([(min_x, branch_y), (max_x, branch_y)], fill=(100, 100, 100), width=2)

    # ===== 各グループ =====
    for group_name, (gx, gy) in group_positions.items():
        group_screens = groups.get(group_name, [])
        if not group_screens:
            continue

        # グループサイズ計算
        cols = 2 if len(group_screens) > 4 else 1
        if group_name == '見積管理':
            cols = 3
        rows = (len(group_screens) + cols - 1) // cols

        gw = cols * (BOX_W + BOX_MARGIN_X) + GROUP_PADDING * 2 - BOX_MARGIN_X
        gh = rows * (BOX_H + BOX_MARGIN_Y) + GROUP_PADDING * 2 + 20 - BOX_MARGIN_Y

        # グループ背景
        draw.rounded_rectangle([gx, gy, gx + gw, gy + gh],
                              radius=8, fill=GROUP_COLORS.get(group_name, (250, 250, 250)),
                              outline=(180, 180, 180))
        draw.text((gx + 8, gy + 4), group_name, fill=(60, 60, 60), font=group_font)

        # メニューからの接続線
        center_x = gx + gw // 2
        draw.line([(center_x, branch_y), (center_x, gy)], fill=(100, 100, 100), width=1)

        # 各画面
        for idx, s in enumerate(group_screens):
            col = idx % cols
            row = idx // cols

            sx = gx + GROUP_PADDING + col * (BOX_W + BOX_MARGIN_X)
            sy = gy + 22 + GROUP_PADDING + row * (BOX_H + BOX_MARGIN_Y)

            draw_box(draw, sx, sy, BOX_W, BOX_H, s['name'], screen_font)
            screen_pos[s['id']] = (sx, sy, BOX_W, BOX_H)

    # ===== グループ内遷移を描画 =====
    # 個体管理の遷移フロー
    flow_y = 520
    draw.text((30, flow_y), "【個体管理フロー】", fill=(60, 60, 60), font=group_font)
    flow_screens = ['offline-prep', 'survey-location', 'asset-survey-integrated', 'history']
    fx = 30
    for i, sid in enumerate(flow_screens):
        s = screens[sid]
        draw_box(draw, fx, flow_y + 25, BOX_W, BOX_H, s['name'], screen_font, fill=(240, 255, 240))
        if i > 0:
            draw_arrow(draw, fx - 15, flow_y + 25 + BOX_H//2, fx, flow_y + 25 + BOX_H//2)
        fx += BOX_W + 20

    # 資産台帳取込フロー
    flow2_y = flow_y + 70
    draw.text((30, flow2_y), "【台帳取込フロー】", fill=(60, 60, 60), font=group_font)
    flow2_screens = ['asset-import', 'asset-matching']
    fx = 30
    for i, sid in enumerate(flow2_screens):
        s = screens[sid]
        draw_box(draw, fx, flow2_y + 25, BOX_W, BOX_H, s['name'], screen_font, fill=(240, 255, 240))
        if i > 0:
            draw_arrow(draw, fx - 15, flow2_y + 25 + BOX_H//2, fx, flow2_y + 25 + BOX_H//2)
        fx += BOX_W + 20

    # ラベル発行フロー
    flow3_y = flow_y
    draw.text((350, flow3_y), "【ラベル発行フロー】", fill=(60, 60, 60), font=group_font)
    flow3_screens = ['qr-issue', 'qr-print']
    fx = 350
    for i, sid in enumerate(flow3_screens):
        s = screens[sid]
        draw_box(draw, fx, flow3_y + 25, BOX_W, BOX_H, s['name'], screen_font, fill=(255, 255, 220))
        if i > 0:
            draw_arrow(draw, fx - 15, flow3_y + 25 + BOX_H//2, fx, flow3_y + 25 + BOX_H//2)
        fx += BOX_W + 20

    # 資産管理フロー
    flow4_y = flow_y
    draw.text((550, flow4_y), "【資産管理フロー】", fill=(60, 60, 60), font=group_font)
    flow4_screens = ['asset-search-result', 'asset-detail', 'asset-karte', 'inventory']
    fx = 550
    fy = flow4_y + 25
    for i, sid in enumerate(flow4_screens):
        s = screens[sid]
        if i < 2:
            draw_box(draw, fx + i * (BOX_W + 20), fy, BOX_W, BOX_H, s['name'], screen_font, fill=(255, 255, 220))
        else:
            draw_box(draw, fx + (i-2) * (BOX_W + 20), fy + BOX_H + 15, BOX_W, BOX_H, s['name'], screen_font, fill=(255, 255, 220))
    # 矢印
    draw_arrow(draw, fx + BOX_W, fy + BOX_H//2, fx + BOX_W + 20, fy + BOX_H//2)
    draw_arrow(draw, fx + BOX_W//2, fy + BOX_H, fx + BOX_W//2, fy + BOX_H + 15)

    # 見積管理フロー
    flow5_y = flow_y
    draw.text((850, flow5_y), "【見積登録フロー】", fill=(60, 60, 60), font=group_font)
    flow5_screens = ['quotation-data-box', 'quotation-registration-modal', 'ocr-confirm',
                     'category-registration', 'item-ai-matching', 'price-allocation', 'registration-confirm']
    fx = 850
    fy = flow5_y + 25
    for i, sid in enumerate(flow5_screens):
        s = screens[sid]
        row = i // 4
        col = i % 4
        bx = fx + col * (BOX_W + 10)
        by = fy + row * (BOX_H + 10)
        draw_box(draw, bx, by, BOX_W, BOX_H, s['name'], screen_font, fill=(255, 255, 220))
        if i > 0 and col > 0:
            draw_arrow(draw, bx - 10, by + BOX_H//2, bx, by + BOX_H//2)
        elif i > 0 and col == 0:
            # 折り返し
            prev_x = fx + 3 * (BOX_W + 10) + BOX_W
            prev_y = fy + (row - 1) * (BOX_H + 10) + BOX_H//2
            draw.line([(prev_x, prev_y), (prev_x + 10, prev_y)], fill=ARROW_COLOR, width=2)
            draw.line([(prev_x + 10, prev_y), (prev_x + 10, by + BOX_H//2)], fill=ARROW_COLOR, width=2)
            draw_arrow(draw, prev_x + 10, by + BOX_H//2, bx, by + BOX_H//2)

    # マスタ管理
    flow6_y = flow_y
    draw.text((1450, flow6_y), "【マスタ管理】", fill=(60, 60, 60), font=group_font)
    master_screens = ['ship-facility-master', 'ship-asset-master', 'ship-department-master',
                      'hospital-facility-master', 'user-management']
    fx = 1450
    fy = flow6_y + 25
    for i, sid in enumerate(master_screens):
        s = screens[sid]
        row = i // 2
        col = i % 2
        draw_box(draw, fx + col * (BOX_W + 10), fy + row * (BOX_H + 10),
                BOX_W, BOX_H, s['name'], screen_font, fill=(230, 245, 255))

    # 凡例
    legend_x = canvas_w - 180
    legend_y = 60
    draw.text((legend_x, legend_y), "【凡例】", fill=(50, 50, 50), font=group_font)
    draw_box(draw, legend_x, legend_y + 20, 60, 22, "開始", small_font, fill=(144, 238, 144), outline=(34, 139, 34))
    draw.text((legend_x + 70, legend_y + 24), "開始画面", fill=(50, 50, 50), font=small_font)
    draw_box(draw, legend_x, legend_y + 48, 60, 22, "メニュー", small_font, fill=(255, 228, 181), outline=(255, 140, 0))
    draw.text((legend_x + 70, legend_y + 52), "メニュー", fill=(50, 50, 50), font=small_font)
    draw_box(draw, legend_x, legend_y + 76, 60, 22, "画面", small_font)
    draw.text((legend_x + 70, legend_y + 80), "各画面", fill=(50, 50, 50), font=small_font)

    return canvas


def create_excel(image, output_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"

    temp = "/tmp/full_screen_map.png"
    image.save(temp, dpi=(150, 150))

    img = XLImage(temp)
    ws.add_image(img, 'A1')

    wb.save(output_path)
    print(f"保存: {output_path}")
    os.remove(temp)


def main():
    data = load_transitions('/Users/watanaberyouta/Desktop/画面設計書/transitions/transitions.json')

    print(f"画面数: {len(data['screens'])}")
    print(f"遷移数: {len(data['transitions'])}")

    image = generate_full_map(data)

    # PNG保存
    png_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png'
    image.save(png_path, dpi=(150, 150))
    print(f"PNG保存: {png_path}")

    # Excel保存
    create_excel(image, '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx')


if __name__ == '__main__':
    main()
