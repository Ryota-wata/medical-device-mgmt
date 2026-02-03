#!/usr/bin/env python3
"""
全体画面遷移図 - 重なり完全排除版
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage

# 定数（高解像度）
THUMB_W = 280
THUMB_H = 180
MARGIN = 60
GAP_X = 70  # 画面間の横間隔
GAP_Y = 80  # 画面間の縦間隔
GROUP_PAD = 35  # グループ内パディング
GROUP_HEADER = 50  # グループヘッダー高さ

# 色
COLORS = {
    'bg': (255, 255, 255),
    'arrow': (200, 80, 80),
    'gray': (235, 235, 235),
    'yellow': (255, 255, 210),
    'blue': (230, 245, 255),
    'green': (230, 250, 230),
    'outline': (180, 180, 180),
    'text': (40, 40, 40),
}

# スクリーンショット
SCREENSHOTS = {
    'login': 'ログイン画面_PC.png',
    'password-reset': 'パスワード再設定URL送信画面_PC.png',
    'main': 'メニュー画面_PC.png',
    'qr-issue': 'ラベル発行画面_PC.png',
    'qr-print': 'ラベルプレビュー画面_PC.png',
    'offline-prep': 'オフライン準備画面_PC.png',
    'survey-location': 'オフライン準備画面_PC.png',
    'asset-survey': 'オフライン準備画面_PC.png',
    'registration-edit': '登録内容修正画面_PC.png',
    'asset-import': '資産台帳取込画面_PC.png',
    'asset-matching': '資産マスタ選択画面_PC.png',
    'data-matching': 'データ突合画面_PC.png',
    'ledger': '固定資産台帳（未突合）_PC.png',
    'asset-list': '資産一覧画面_PC.png',
    'asset-karte': '資産カルテ画面_PC.png',
    'edit-list': '編集リスト画面_PC.png',
    'quotation-group': '見積書依頼グループタブ画面_PC.png',
    'quotation-modal': '見積書登録モーダル_PC.png',
    'ocr-confirm': 'OCR明細確認画面_PC.png',
    'ai-category': '見積登録（購入）AI判定確認_PC.png',
    'ai-item': '見積登録（購入）個体品目AI判定_PC.png',
    'price-allocation': '見積登録（購入）個体登録及び金額按分_PC.png',
    'registration-confirm': '見積登録（購入）登録確認_PC.png',
    'inventory': '棚卸画面_PC.png',
    'facility-master': '施設マスタ一覧画面_PC.png',
    'asset-master': '資産マスタ一覧画面_PC.png',
    'department-master': 'SHIP部署マスタ一覧画面_PC.png',
    'hospital-master': '個別部署マスタ一覧画面_PC.png',
    'user-management': 'ユーザー一覧画面_PC.png',
}


def get_font(size, weight='W4'):
    try:
        return ImageFont.truetype(f"/System/Library/Fonts/ヒラギノ角ゴシック {weight}.ttc", size)
    except:
        return ImageFont.load_default()


def load_thumb(screenshots_dir, filename):
    path = Path(screenshots_dir) / filename
    if path.exists():
        img = Image.open(path)
        img.thumbnail((THUMB_W, THUMB_H), Image.LANCZOS)
        # サイズを統一
        result = Image.new('RGB', (THUMB_W, THUMB_H), (245, 245, 245))
        x = (THUMB_W - img.width) // 2
        y = (THUMB_H - img.height) // 2
        result.paste(img, (x, y))
        return result
    else:
        img = Image.new('RGB', (THUMB_W, THUMB_H), (220, 220, 220))
        d = ImageDraw.Draw(img)
        d.text((10, 50), "No Image", fill=(150, 150, 150))
        return img


def draw_screen(canvas, draw, x, y, name, thumb, font):
    """画面を描画して右下座標を返す"""
    draw.rectangle([x, y, x + THUMB_W, y + THUMB_H], outline=(140, 140, 140), width=2)
    canvas.paste(thumb, (x, y))
    # 名前（短縮）
    short = name[:14] + '…' if len(name) > 14 else name
    draw.text((x + 3, y + THUMB_H + 5), short, fill=COLORS['text'], font=font)
    return x + THUMB_W, y + THUMB_H + 28


def draw_arrow_right(draw, x1, y, x2):
    """右向き矢印"""
    draw.line([(x1, y), (x2 - 12, y)], fill=COLORS['arrow'], width=3)
    draw.polygon([(x2, y), (x2 - 14, y - 7), (x2 - 14, y + 7)], fill=COLORS['arrow'])


def draw_arrow_down(draw, x, y1, y2):
    """下向き矢印"""
    draw.line([(x, y1), (x, y2 - 12)], fill=COLORS['arrow'], width=3)
    draw.polygon([(x, y2), (x - 7, y2 - 14), (x + 7, y2 - 14)], fill=COLORS['arrow'])


def generate():
    screenshots_dir = '/Users/watanaberyouta/Desktop/画面設計書/screenshots'

    # フォント（高解像度用）
    title_font = get_font(36, 'W6')
    group_font = get_font(20, 'W6')
    screen_font = get_font(13, 'W4')

    # サムネイル読み込み
    thumbs = {sid: load_thumb(screenshots_dir, fname) for sid, fname in SCREENSHOTS.items()}

    # ========== レイアウト計算（重ならないように） ==========

    # Row 1: 認証 + メニュー
    row1_y = MARGIN + 40

    # 画面1つの高さ（サムネイル＋ラベル）
    SCREEN_H = THUMB_H + 35

    # 認証グループ: 2画面横並び
    auth_x = MARGIN
    auth_w = GROUP_PAD * 2 + THUMB_W * 2 + GAP_X
    auth_h = GROUP_PAD + GROUP_HEADER + SCREEN_H

    # メニュー: 認証の右
    menu_x = auth_x + auth_w + 80

    # Row 2: メインのグループ行
    row2_y = row1_y + auth_h + 100  # 接続線用のスペース

    # 各グループのサイズを事前計算
    # 個体管理: 3画面x5行（ラベル発行含む）
    kotai_w = GROUP_PAD * 2 + THUMB_W * 3 + GAP_X * 2
    kotai_h = GROUP_PAD + GROUP_HEADER + SCREEN_H * 5 + GAP_Y * 4

    # 資産管理: 2画面横並び + 棚卸（下に配置）
    shisan_w = GROUP_PAD * 2 + THUMB_W * 2 + GAP_X
    shisan_h = GROUP_PAD + GROUP_HEADER + SCREEN_H * 2 + GAP_Y

    # 編集リスト: 1画面
    edit_w = GROUP_PAD * 2 + THUMB_W
    edit_h = GROUP_PAD + GROUP_HEADER + SCREEN_H

    # マスタ管理: 5画面縦並び
    master_w = GROUP_PAD * 2 + THUMB_W
    master_h = GROUP_PAD + GROUP_HEADER + SCREEN_H * 5 + GAP_Y * 4

    # 横位置を計算（左から順に配置）
    kotai_x = MARGIN
    shisan_x = kotai_x + kotai_w + GAP_X
    edit_x = shisan_x + shisan_w + GAP_X
    master_x = edit_x + edit_w + GAP_X

    # Row 3: 見積管理（7画面横並び）
    row3_y = row2_y + kotai_h + 80
    quote_w = GROUP_PAD * 2 + THUMB_W * 7 + GAP_X * 6
    quote_h = GROUP_PAD + GROUP_HEADER + SCREEN_H
    quote_x = MARGIN

    # キャンバスサイズ
    canvas_w = master_x + master_w + MARGIN + 200  # 凡例用
    canvas_h = row3_y + quote_h + MARGIN

    canvas = Image.new('RGB', (canvas_w, canvas_h), COLORS['bg'])
    draw = ImageDraw.Draw(canvas)

    # タイトル
    draw.text((MARGIN, 15), "全体画面遷移図", fill=COLORS['text'], font=title_font)

    # ========== Row 1: 認証 + メニュー ==========

    # 認証グループ
    draw.rounded_rectangle([auth_x, row1_y, auth_x + auth_w, row1_y + auth_h],
                          radius=8, fill=COLORS['gray'], outline=COLORS['outline'], width=2)
    draw.text((auth_x + 10, row1_y + 8), "認証", fill=COLORS['text'], font=group_font)

    sx = auth_x + GROUP_PAD
    sy = row1_y + GROUP_HEADER
    draw_screen(canvas, draw, sx, sy, "ログイン", thumbs['login'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "PW再設定", thumbs['password-reset'], screen_font)

    # メニュー
    draw.rectangle([menu_x - 8, row1_y + GROUP_HEADER - 8,
                   menu_x + THUMB_W + 8, row1_y + GROUP_HEADER + THUMB_H + 45],
                  outline=(200, 150, 50), width=4)
    draw_screen(canvas, draw, menu_x, row1_y + GROUP_HEADER, "メニュー", thumbs['main'], screen_font)

    # ログイン→メニュー
    login_cx = auth_x + GROUP_PAD + THUMB_W // 2
    menu_cx = menu_x + THUMB_W // 2
    arrow_y = row1_y - 20
    draw.line([(login_cx, row1_y), (login_cx, arrow_y)], fill=COLORS['arrow'], width=3)
    draw.line([(login_cx, arrow_y), (menu_cx, arrow_y)], fill=COLORS['arrow'], width=3)
    draw_arrow_down(draw, menu_cx, arrow_y, row1_y + GROUP_HEADER - 8)

    # ========== Row 2: メイングループ ==========

    # メニューからの分岐線
    branch_y = row1_y + auth_h + 40
    draw.line([(menu_cx, row1_y + GROUP_HEADER + THUMB_H + 45), (menu_cx, branch_y)],
              fill=COLORS['arrow'], width=3)

    # グループ中心点（ラベル発行と棚卸は別グループから削除）
    centers = [
        kotai_x + kotai_w // 2,
        shisan_x + shisan_w // 2,
        edit_x + edit_w // 2,
        master_x + master_w // 2,
    ]

    # 横線
    draw.line([(menu_cx, branch_y), (max(centers), branch_y)], fill=COLORS['arrow'], width=3)

    # 各グループへの縦線
    for cx in centers:
        draw.line([(cx, branch_y), (cx, row2_y - 15)], fill=COLORS['arrow'], width=3)
        draw.polygon([(cx, row2_y - 15), (cx - 7, row2_y - 28), (cx + 7, row2_y - 28)],
                    fill=COLORS['arrow'])

    # ----- 個体管理リスト作成（ラベル発行含む） -----
    draw.rounded_rectangle([kotai_x, row2_y, kotai_x + kotai_w, row2_y + kotai_h],
                          radius=8, fill=COLORS['gray'], outline=COLORS['outline'], width=2)
    draw.text((kotai_x + 10, row2_y + 8), "個体管理リスト作成", fill=COLORS['text'], font=group_font)

    # サブフロー1: オフライン準備→調査場所→現有品調査
    sx = kotai_x + GROUP_PAD
    sy = row2_y + GROUP_HEADER
    draw_screen(canvas, draw, sx, sy, "オフライン準備", thumbs['offline-prep'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "調査場所入力", thumbs['survey-location'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W * 2 + GAP_X + 8, sy + THUMB_H // 2, sx + THUMB_W * 2 + GAP_X * 2 - 8)
    draw_screen(canvas, draw, sx + THUMB_W * 2 + GAP_X * 2, sy, "現有品調査", thumbs['asset-survey'], screen_font)

    # サブフロー2: 登録内容修正
    sy += SCREEN_H + GAP_Y
    draw_screen(canvas, draw, sx, sy, "登録内容修正", thumbs['registration-edit'], screen_font)

    # サブフロー3: 資産台帳取込→マスタ選択
    sy += SCREEN_H + GAP_Y
    draw_screen(canvas, draw, sx, sy, "資産台帳取込", thumbs['asset-import'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "マスタ選択", thumbs['asset-matching'], screen_font)

    # サブフロー4: データ突合→固定資産台帳
    sy += SCREEN_H + GAP_Y
    draw_screen(canvas, draw, sx, sy, "データ突合", thumbs['data-matching'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "固定資産台帳", thumbs['ledger'], screen_font)

    # サブフロー5: ラベル発行→プレビュー
    sy += SCREEN_H + GAP_Y
    draw_screen(canvas, draw, sx, sy, "ラベル発行", thumbs['qr-issue'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "プレビュー", thumbs['qr-print'], screen_font)

    # ----- 資産管理（棚卸含む） -----
    draw.rounded_rectangle([shisan_x, row2_y, shisan_x + shisan_w, row2_y + shisan_h],
                          radius=8, fill=COLORS['yellow'], outline=COLORS['outline'], width=2)
    draw.text((shisan_x + 10, row2_y + 8), "資産管理", fill=COLORS['text'], font=group_font)

    sx = shisan_x + GROUP_PAD
    sy = row2_y + GROUP_HEADER
    draw_screen(canvas, draw, sx, sy, "資産一覧", thumbs['asset-list'], screen_font)
    draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
    draw_screen(canvas, draw, sx + THUMB_W + GAP_X, sy, "資産カルテ", thumbs['asset-karte'], screen_font)

    # 資産一覧から棚卸への遷移
    asset_list_cx = sx + THUMB_W // 2
    sy_tana = sy + SCREEN_H + GAP_Y
    draw.line([(asset_list_cx, sy + THUMB_H + 35), (asset_list_cx, sy_tana - 12)], fill=COLORS['arrow'], width=3)
    draw.polygon([(asset_list_cx, sy_tana), (asset_list_cx - 7, sy_tana - 14), (asset_list_cx + 7, sy_tana - 14)], fill=COLORS['arrow'])
    draw_screen(canvas, draw, sx, sy_tana, "棚卸", thumbs['inventory'], screen_font)

    # ----- 編集リスト -----
    draw.rounded_rectangle([edit_x, row2_y, edit_x + edit_w, row2_y + edit_h],
                          radius=8, fill=COLORS['yellow'], outline=COLORS['outline'], width=2)
    draw.text((edit_x + 10, row2_y + 8), "編集リスト", fill=COLORS['text'], font=group_font)

    draw_screen(canvas, draw, edit_x + GROUP_PAD, row2_y + GROUP_HEADER, "編集リスト", thumbs['edit-list'], screen_font)

    # ----- マスタ管理 -----
    draw.rounded_rectangle([master_x, row2_y, master_x + master_w, row2_y + master_h],
                          radius=8, fill=COLORS['blue'], outline=COLORS['outline'], width=2)
    draw.text((master_x + 10, row2_y + 8), "マスタ管理", fill=COLORS['text'], font=group_font)

    sx = master_x + GROUP_PAD
    sy = row2_y + GROUP_HEADER
    for sid, name in [('facility-master', '施設マスタ'), ('asset-master', '資産マスタ'),
                      ('department-master', 'SHIP部署'), ('hospital-master', '個別部署'),
                      ('user-management', 'ユーザー')]:
        draw_screen(canvas, draw, sx, sy, name, thumbs[sid], screen_font)
        sy += SCREEN_H + GAP_Y

    # ========== Row 3: 見積管理 ==========
    draw.rounded_rectangle([quote_x, row3_y, quote_x + quote_w, row3_y + quote_h],
                          radius=8, fill=COLORS['yellow'], outline=COLORS['outline'], width=2)
    draw.text((quote_x + 10, row3_y + 8), "見積・発注契約管理", fill=COLORS['text'], font=group_font)

    screens = [('quotation-group', '見積グループ'), ('quotation-modal', '見積登録'),
               ('ocr-confirm', 'OCR確認'), ('ai-category', 'AI判定'),
               ('ai-item', '個体AI判定'), ('price-allocation', '金額按分'),
               ('registration-confirm', '登録確認')]

    sx = quote_x + GROUP_PAD
    sy = row3_y + GROUP_HEADER
    for i, (sid, name) in enumerate(screens):
        draw_screen(canvas, draw, sx, sy, name, thumbs[sid], screen_font)
        if i < len(screens) - 1:
            draw_arrow_right(draw, sx + THUMB_W + 8, sy + THUMB_H // 2, sx + THUMB_W + GAP_X - 8)
        sx += THUMB_W + GAP_X

    # 編集リストから見積管理への接続（個体管理グループの下を迂回）
    edit_cx = edit_x + edit_w // 2
    # 個体管理グループの下端より下を通る
    bypass_y = row2_y + kotai_h + 35
    quote_cx = quote_x + quote_w // 2

    # 編集リストから下へ
    draw.line([(edit_cx, row2_y + edit_h), (edit_cx, bypass_y)], fill=COLORS['arrow'], width=3)
    # 左へ（グループの下を通る）
    draw.line([(edit_cx, bypass_y), (quote_cx, bypass_y)], fill=COLORS['arrow'], width=3)
    # 見積管理へ下へ
    draw.line([(quote_cx, bypass_y), (quote_cx, row3_y - 20)], fill=COLORS['arrow'], width=3)
    draw.polygon([(quote_cx, row3_y - 8),
                  (quote_cx - 7, row3_y - 22),
                  (quote_cx + 7, row3_y - 22)], fill=COLORS['arrow'])

    # ========== 凡例 ==========
    legend_x = canvas_w - 180
    legend_y = 80
    draw.text((legend_x, legend_y), "【凡例】", fill=COLORS['text'], font=group_font)

    items = [('gray', 'データ準備系'), ('yellow', '業務機能系'),
             ('blue', 'マスタ管理系'), ('green', '棚卸系')]
    for i, (color, label) in enumerate(items):
        y = legend_y + 30 + i * 35
        draw.rectangle([legend_x, y, legend_x + 50, y + 25],
                      fill=COLORS[color], outline=COLORS['outline'], width=1)
        draw.text((legend_x + 60, y + 5), label, fill=COLORS['text'], font=screen_font)

    return canvas


def main():
    print("生成中...")
    image = generate()

    png_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png'
    image.save(png_path, dpi=(300, 300))
    print(f"PNG: {png_path}")

    # Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "画面遷移図"
    temp = "/tmp/final_diagram.png"
    image.save(temp, dpi=(300, 300))
    ws.add_image(XLImage(temp), 'A1')
    excel_path = '/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx'
    wb.save(excel_path)
    print(f"Excel: {excel_path}")
    os.remove(temp)


if __name__ == '__main__':
    main()
