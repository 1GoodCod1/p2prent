-- -- Миграция для добавления критических функций

-- -- 1. Добавляем новые таблицы
-- CREATE TABLE IF NOT EXISTS "user_verifications" (
--     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
--     "document_type" VARCHAR(50) NOT NULL,
--     "document_front" VARCHAR(500) NOT NULL,
--     "document_back" VARCHAR(500),
--     "selfie_photo" VARCHAR(500) NOT NULL,
--     "status" VARCHAR(20) DEFAULT 'PENDING',
--     "rejection_reason" TEXT,
--     "verified_at" TIMESTAMP,
--     "verified_by" UUID REFERENCES "users"(id),
--     "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX IF NOT EXISTS "user_verifications_user_id_idx" ON "user_verifications"(user_id);
-- CREATE INDEX IF NOT EXISTS "user_verifications_status_idx" ON "user_verifications"(status);

-- CREATE TABLE IF NOT EXISTS "user_fraud_scores" (
--     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     "user_id" UUID UNIQUE NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
--     "score" INTEGER DEFAULT 0,
--     "status" VARCHAR(20) DEFAULT 'CLEAN',
--     "flags" JSONB DEFAULT '[]',
--     "last_checked" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX IF NOT EXISTS "user_fraud_scores_status_idx" ON "user_fraud_scores"(status);
-- CREATE INDEX IF NOT EXISTS "user_fraud_scores_score_idx" ON "user_fraud_scores"(score);

-- -- 2. Обновляем существующие таблицы
-- ALTER TABLE "users" 
-- ADD COLUMN IF NOT EXISTS "birth_date" TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "verification_level" VARCHAR(20) DEFAULT 'BASIC',
-- ADD COLUMN IF NOT EXISTS "fraud_score_id" UUID REFERENCES "user_fraud_scores"(id);

-- ALTER TABLE "products"
-- ADD COLUMN IF NOT EXISTS "max_rental_duration" INTEGER DEFAULT 90,
-- ADD COLUMN IF NOT EXISTS "requires_deposit" BOOLEAN DEFAULT true,
-- ADD COLUMN IF NOT EXISTS "deposit_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "deposit_percentage" DECIMAL(5,2) DEFAULT 50.0,
-- ADD COLUMN IF NOT EXISTS "is_high_value" BOOLEAN DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "insurance_required" BOOLEAN DEFAULT false;

-- ALTER TABLE "rentals"
-- ADD COLUMN IF NOT EXISTS "deposit_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "deposit_status" VARCHAR(20) DEFAULT 'PENDING',
-- ADD COLUMN IF NOT EXISTS "deposit_refunded_at" TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS "net_earnings" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "vat_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "tax_amount" DECIMAL(10,2);

-- ALTER TABLE "transactions"
-- ADD COLUMN IF NOT EXISTS "tax_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "vat_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS "ip_address" VARCHAR(45),
-- ADD COLUMN IF NOT EXISTS "device_fingerprint" VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS "risk_score" INTEGER DEFAULT 0;

-- -- 3. Создаем триггер для автоматического обновления updated_at
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- Применяем триггер к основным таблицам
-- CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_user_fraud_scores_updated_at BEFORE UPDATE ON user_fraud_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();