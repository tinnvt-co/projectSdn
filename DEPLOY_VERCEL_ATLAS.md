# Deploy Atlas + Vercel

## 1. MongoDB Atlas
- Tao cluster tren MongoDB Atlas.
- Tao user database va allow IP truy cap.
- Lay `MONGO_URI` dang `mongodb+srv://...`.

## 2. Deploy backend len Vercel
- Tao project moi tren Vercel.
- Chon `Root Directory` = `backend`.
- Framework Preset: `Other`.
- Build Command: de trong.
- Output Directory: de trong.
- Install Command: `npm install`.

### Backend environment variables
- `MONGO_URI`
- `JWT_SECRET`
- `GMAIL_USER`
- `GMAIL_PASS`
- `PAYMENT_BANK_BIN`
- `PAYMENT_ACCOUNT_NO`
- `PAYMENT_ACCOUNT_NAME`
- `PAYMENT_QR_TEMPLATE`
- `CASSO_WEBHOOK_SECRET`

Sau khi deploy xong, backend se co domain dang:
- `https://your-backend.vercel.app`

Webhook Casso moi se la:
- `https://your-backend.vercel.app/api/payment-webhooks/casso`

## 3. Deploy frontend len Vercel
- Tao project moi tren Vercel.
- Chon `Root Directory` = `frontend`.
- Framework Preset: `Vite`.

### Frontend environment variables
- `VITE_API_URL=https://your-backend.vercel.app/api`

## 4. Cap nhat Casso
- Vao Casso.
- Doi `Webhook URL` thanh domain backend Vercel:
- `https://your-backend.vercel.app/api/payment-webhooks/casso`
- `Key bao mat` phai trung `CASSO_WEBHOOK_SECRET`.

## 5. Kiem tra sau deploy
- Frontend login duoc.
- Student tao QR duoc.
- Chuyen khoan dung noi dung.
- Casso goi webhook thanh cong.
- Hoa don tu dong chuyen sang da thanh toan.
