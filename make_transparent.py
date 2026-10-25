# -*- coding: utf-8 -*-
"""把 PICKCAT favicon 的白色背景抠成透明，并做边缘去白边。（纯 PIL 实现）"""
from PIL import Image
from collections import deque

SRC = r"C:\Users\SHI\Doubao\chats\2026-10-25\new-chat\pickpet\pet.png"

im = Image.open(SRC).convert("RGBA")
W, H = im.size
get = im.load()
alpha = im.getchannel("A")
apx = alpha.load()

def is_bg(x, y):
    r, g, b, a = get[x, y]
    return a > 200 and r > 240 and g > 240 and b > 240

# 泛洪：从四条边出发，把所有与边缘相连的近白像素标记为背景
visited = [[False] * W for _ in range(H)]
stack = deque()
def seed(x, y):
    if 0 <= x < W and 0 <= y < H and not visited[y][x] and is_bg(x, y):
        visited[y][x] = True
        stack.append((x, y))
for x in range(W):
    seed(x, 0); seed(x, H - 1)
for y in range(H):
    seed(0, y); seed(W - 1, y)
while stack:
    x, y = stack.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and not visited[ny][nx] and is_bg(nx, ny):
            visited[ny][nx] = True
            stack.append((nx, ny))

# 把背景像素 alpha 置 0
for y in range(H):
    for x in range(W):
        if visited[y][x]:
            r, g, b, a = get[x, y]
            get[x, y] = (r, g, b, 0)

# 边缘去白边：与透明区相邻、接近白色的像素按白度淡出
for y in range(1, H - 1):
    for x in range(1, W - 1):
        r, g, b, a = get[x, y]
        if a > 0:
            whiteness = min(r, g, b)
            near = (get[x - 1, y][3] == 0 or get[x + 1, y][3] == 0
                    or get[x, y - 1][3] == 0 or get[x, y + 1][3] == 0)
            if whiteness > 235 and near:
                get[x, y] = (r, g, b, max(0, min(255, int((255 - whiteness) * 4))))

im.save(SRC)

# 统计透明像素数
trans = 0
for y in range(H):
    for x in range(W):
        if get[x, y][3] == 0:
            trans += 1
print("done size=%dx%d transparent=%d/%d" % (W, H, trans, W * H))
