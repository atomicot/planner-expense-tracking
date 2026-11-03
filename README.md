# Pastel Planner ✿

แอปแพลนเนอร์รายวัน + บันทึกรายรับ–รายจ่าย + แดชบอร์ด ใช้ได้ทั้งแบบ **ส่วนตัว** และ **ทีม**
โทนมินิมอลพาสเทล · รองรับภาษาไทย / English · โหมดมืด

## ความสามารถ
- **แพลนเนอร์**: ตารางเวลารายวัน (06:00–24:00) เลือกวันจากแถบสัปดาห์ กดช่องเวลาเพื่อเพิ่มกิจกรรม ติ๊กว่าทำเสร็จแล้วได้
- **ผูกเงินกับกิจกรรม**: ในหน้าต่างกิจกรรม เพิ่มรายจ่าย/รายรับของกิจกรรมนั้นได้หลายรายการ (เช่น ค่าเดินทาง ค่าอาหาร)
- **รายรับ–รายจ่าย**: สรุปรายเดือน กรองตามประเภท/หมวดหมู่ แสดงรายการแยกตามวัน
- **ทีม**: สร้างทีม ส่งรหัสเชิญให้เพื่อน แล้วบันทึกแพลนเนอร์และค่าใช้จ่ายของทีมร่วมกัน
- **แดชบอร์ด** (ส่วนตัว/ทีม): ใช้เวลาไปกับอะไร ใช้เงินไปกับอะไร ชั่วโมงต่อวัน รายรับเทียบรายจ่าย กิจกรรมที่ใช้เงินมากที่สุด ทำอะไรไปบ้าง และสรุปรายสมาชิก (ทีม)
- **ธีม**: ตอนสมัคร เลือกเพศ "ชาย" ได้โทนฟ้า, "หญิง" ได้โทนชมพู (ไม่ระบุ = ลาเวนเดอร์) แล้วไปเปลี่ยนได้ที่ ตั้งค่า (ฟ้า / ชมพู / มิ้นต์ / ลาเวนเดอร์ / พีช)
- สำรองข้อมูล/กู้คืนเป็นไฟล์ JSON และมีปุ่ม "เพิ่มข้อมูลตัวอย่าง" ไว้ลองแดชบอร์ด

## วิธีเปิดใช้งาน
ไม่ต้อง build ใด ๆ
- **ง่ายที่สุด**: ดับเบิลคลิก `index.html` เพื่อเปิดในเบราว์เซอร์ (โหมด Local Storage)
- **ผ่านเซิร์ฟเวอร์ภายในเครื่อง** (แนะนำเมื่อเปิดใช้ Firebase) macOS มี Perl ติดเครื่องอยู่แล้ว ไม่ต้องติดตั้งอะไรเพิ่ม:
  ```bash
  cd pastel-planner && perl serve.pl
  ```
  แล้วเปิด <http://localhost:5173> (หรือใช้ `npx serve` / `python3 -m http.server` ถ้ามี)

## โหมดการเก็บข้อมูล
| โหมด | ใช้เมื่อ | หมายเหตุ |
|---|---|---|
| **Local Storage** (ค่าเริ่มต้น) | ใช้คนเดียว ลองใช้ | ข้อมูลอยู่ในเบราว์เซอร์นี้ ทีมแชร์ได้เฉพาะระหว่างโปรไฟล์ในเครื่องเดียวกัน (เปิดหลายแท็บจะอัปเดตตามกันอัตโนมัติ) |
| **Firebase** | ใช้กับทีมจริง หลายอุปกรณ์ | ล็อกอินจริง ข้อมูลทีมซิงก์แบบเรียลไทม์ |

## เปิดใช้ Firebase (ฟรี)
1. ไปที่ <https://console.firebase.google.com> → **Add project**
2. **Build → Authentication → Get started** → เปิด **Email/Password**
3. **Build → Firestore Database → Create database** (เลือก production mode และ region ใกล้ ๆ เช่น `asia-southeast1`)
4. **Firestore → Rules** → คัดลอกเนื้อหาไฟล์ [`firestore.rules`](firestore.rules) ไปวางแทนทั้งหมด → **Publish**
5. **Project settings (⚙️) → Your apps → Web (</>)** → ลงทะเบียนแอป → คัดลอก `firebaseConfig`
6. เปิด [`js/firebase-config.js`](js/firebase-config.js) แล้ววางค่าลงใน `window.FIREBASE_CONFIG = { ... }`
7. เปิดแอปผ่านเซิร์ฟเวอร์ (`http://localhost:...`) หรือ deploy ขึ้น Firebase Hosting / Netlify / GitHub Pages
   - ถ้า deploy บนโดเมนอื่น ให้เพิ่มโดเมนนั้นใน **Authentication → Settings → Authorized domains**
8. สมัครสมาชิกใหม่ (บัญชีในโหมด Local จะไม่ย้ายไปอัตโนมัติ ใช้ ตั้งค่า → ส่งออก/นำเข้า เพื่อย้ายข้อมูล)

**ทดสอบทีม**: เปิด 2 เบราว์เซอร์ (หรือหน้าต่างไม่ระบุตัวตน) → สมัคร 2 บัญชี → บัญชีแรกสร้างทีมแล้วคัดลอกรหัสเชิญ → บัญชีที่สองกด "เข้าร่วมด้วยรหัส" → เพิ่มกิจกรรมจากฝั่งหนึ่ง แล้วอีกฝั่งจะเห็นทันที

## โครงสร้างไฟล์
```
index.html               โครงหน้า โหลดฟอนต์ Chart.js และสคริปต์
css/styles.css           design tokens, 5 ธีม + โหมดมืด, คอมโพเนนต์, responsive
js/util.js               ตัวช่วยวันที่/เวลา, DOM, ไอคอน, modal, toast
js/i18n.js               ข้อความไทย/อังกฤษ และรูปแบบเงิน/วันที่
js/store.js              ตัวกลางข้อมูล (cache + events), หมวดหมู่เริ่มต้น, ธีม, preferences
js/store-local.js        adapter สำหรับ Local Storage
js/store-firebase.js     adapter สำหรับ Firebase Auth + Firestore (โหลด SDK เมื่อมี config)
js/firebase-config.js    ใส่ config ของ Firebase ที่นี่ (เว้นว่าง = Local)
js/auth.js               หน้าสมัคร/เข้าสู่ระบบ
js/forms.js              หน้าต่างเพิ่ม/แก้ไขกิจกรรมและรายการเงิน
js/views/*.js            planner, money, dashboard, teams, settings
js/app.js                router, sidebar/bottom nav, ตัวสลับ ส่วนตัว/ทีม
firestore.rules          กฎความปลอดภัยของ Firestore
```

## โครงสร้างข้อมูล (Firestore)
```
users/{uid}                              โปรไฟล์ + ธีม/ภาษา
users/{uid}/activities|transactions|categories
teams/{teamId}                           name, ownerId, memberIds[], memberNames{}
teams/{teamId}/activities|transactions|categories
```
รหัสเชิญของทีม = `teamId`
