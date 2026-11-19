# ควันหลงเก็บกระทงหลงทาง

เกมรับของ 2D สไตล์การ์ตูน เล่นบนเบราว์เซอร์ (React + TypeScript + Vite + Tailwind + HTML Canvas)

## วิธีรัน
```bash
npm install
npm run dev            # เปิด http://localhost:5173
npm run build          # build ไปที่ dist/
npm run build:single   # รวมเป็นไฟล์เดียว dist/index.html (เปิดดับเบิลคลิกได้เลย)
```
ต้องใช้ Node 18+

## วิธีเล่น
เลื่อนเมาส์ซ้าย-ขวา (หรือปุ่ม ← →, หรือลากนิ้วบนมือถือ) เพื่อรับของด้วยถุงขยะ
กระทง +2 • เศษเหรียญ +1 • ขยะ +1 • ระเบิด −5 (และเสียหัวใจ 1 จาก 3 ดวง หมดแล้วจบเกม) • ปลา/หอย −1
คอมโบ: เก็บของที่ได้คะแนนบวกติดกัน ครบ 5 ชิ้นของตกเร็วขึ้น ครบ 10 เร็วขึ้นอีก ครบ 20 เร็วสุดๆ (เก็บของลบแล้วคอมโบขาด) — เวลา 90 วินาที นับถอยหลัง 3 วินาที

## โครงสร้างโค้ด
```
src/game/types.ts       ค่าคงที่ คะแนน ชื่อภาษาไทย
src/game/sprites.ts     วาดสไปรต์ทั้งหมด (กระทง เหรียญ ขยะ 5 แบบ ระเบิด ปลา ถุง+มือ)
src/game/background.ts  แม่น้ำกลางคืน คลื่นเคลื่อนไหว แสงสะท้อน ธง โคม วัด
src/game/engine.ts      ลูปเกม spawn ชน คะแนน เอฟเฟกต์ (ไม่พึ่ง React)
src/game/audio.ts       เสียงสังเคราะห์ด้วย WebAudio
src/lib/leaderboard.ts  อันดับ: เซิร์ฟเวอร์ของเกม / Supabase / localStorage (เดโม)
src/lib/room.ts         เชื่อมห้องเล่นพร้อมกัน (WebSocket)
server/index.mjs        เซิร์ฟเวอร์ Node: เสิร์ฟเกม + API อันดับ + ห้องเรียลไทม์
src/components/*        UI ภาษาไทย (HUD, หน้าเริ่ม, หน้าจบ, อันดับ)
```
ปรับความยาก/สัดส่วนของ: `WEIGHTS` และ `spawn()`/`update()` ใน `engine.ts`

## เล่นพร้อมกันหลายคน + อันดับรวมออนไลน์ (เซิร์ฟเวอร์ของเกม)
โฟลเดอร์ `server/` คือเซิร์ฟเวอร์ Node.js (HTTP + WebSocket) ที่ทำ 3 อย่างในตัวเดียว:
เสิร์ฟตัวเกม • เก็บอันดับรวมของทุกคน (`/api/scores`, เก็บในไฟล์ `server/scores.json`) • ห้องเล่นพร้อมกันแบบเรียลไทม์ (`/ws`)

```bash
npm install
npm run build
npm start              # http://localhost:3000
```
**วิธีเล่นพร้อมกัน:** ในหน้าเริ่มเกมเลือก "เล่นพร้อมกัน (ห้อง)" ใส่ชื่อห้องเดียวกัน → หัวหน้าห้อง (👑 คนแรกที่เข้า) กด "เริ่มเกมพร้อมกัน!"
ทุกคนนับถอยหลังพร้อมกันและเจอของที่ตกเหมือนกันทุกประการ (ใช้ seed เดียวกัน) เห็นคะแนนเพื่อนอัปเดตสด จบรอบแล้วสรุปอันดับในห้อง รองรับถึง 60 คนต่อห้อง

**เปิดให้เพื่อนเข้าเล่น**
1. เครื่องเดียวกันวง Wi-Fi เดียวกัน: เปิด `npm start` แล้วให้เพื่อนเข้า `http://<IP เครื่องคุณ>:3000`
2. เล่นผ่านอินเทอร์เน็ตแบบเร็วสุด (ไม่ต้องมีโฮสต์): รัน `npm start` แล้วเปิดอุโมงค์ เช่น `npx cloudflared tunnel --url http://localhost:3000` จะได้ลิงก์ https ให้แชร์ (ปิดเครื่อง/ปิดคำสั่ง = เกมหยุด)
3. ถาวร: deploy ขึ้น Render / Railway / Fly.io / VPS
   - Render: สร้าง Web Service จาก repo นี้ Build Command `npm install --include=dev && npm run build`, Start Command `npm start`
   - Docker: `docker build -t krathong . && docker run -p 3000:3000 -v krathong-data:/data -e DATA_FILE=/data/scores.json krathong`
   - เครื่องฟรีบางเจ้าจะลบไฟล์เมื่อรีสตาร์ท ถ้าอยากให้อันดับอยู่ถาวรให้ผูก volume หรือใช้ Supabase แทน

ไฟล์ `dist/index.html` ที่ build:single ใช้เล่นคนเดียวได้อย่างเดียว (ไม่มีเซิร์ฟเวอร์ จึงเข้าห้องไม่ได้)
ข้อจำกัด: คะแนนมาจากเบราว์เซอร์ จึงยังโกงได้ เหมาะกับงานสนุก/อีเวนต์

## เชื่อม Supabase (ทางเลือกแทนเซิร์ฟเวอร์ของเกมสำหรับอันดับ) (อันดับออนไลน์)
1. สร้างโปรเจกต์ที่ supabase.com แล้วรัน SQL นี้ใน SQL Editor:
```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 16),
  score int not null check (score between 0 and 500),
  created_at timestamptz default now()
);
alter table scores enable row level security;
create policy "anyone can read"   on scores for select using (true);
create policy "anyone can insert" on scores for insert with check (true);
```
2. สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจกต์:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
3. รัน `npm run dev` ใหม่ — อันดับจะดึง/บันทึกผ่าน Supabase REST และรีเฟรชทุก 4 วินาที
   (อยากได้ realtime จริง ให้เปิด Realtime ที่ตาราง `scores` แล้วใช้ `supabase-js` subscribe แทน polling ใน `App.tsx`)

หมายเหตุ: คะแนนส่งจากฝั่งเบราว์เซอร์ จึงเหมาะกับงานอีเวนต์/เล่นสนุก หากต้องกันโกงจริงควรตรวจสอบคะแนนผ่าน Edge Function

## เพลงประกอบ
เพลงที่เล่นเบาๆ เป็นเพลงประกอบคือไฟล์ `src/assets/loy-krathong.mp3` (แยกเสียงจากวิดีโอที่เจ้าของโปรเจกต์ส่งมา ปรับระดับเสียงให้เบาลง) ค่อยๆ ดังขึ้นตอนเริ่มเกม และค่อยๆ เบาลงตอนจบ ปรับความดังที่ `MUSIC_VOL` ใน `src/game/audio.ts` ปิดด้วยปุ่มลำโพงมุมขวาบน
เปลี่ยนเพลง: แทนที่ไฟล์นั้นแล้ว build ใหม่ (ถ้าจะเผยแพร่สู่สาธารณะ ตรวจสอบสิทธิ์ใช้เพลงด้วย)
