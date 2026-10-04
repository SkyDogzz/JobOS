INSERT INTO "billing_plans" ("code", "name", "monthly_price_cents", "currency", "limits", "entitlements", "active")
VALUES
  (
    'free',
    'Free',
    0,
    'USD',
    '{
      "savedJobs": 25,
      "applications": 15,
      "resumes": 2,
      "copilotMessages": 10,
      "copilotActions": 10,
      "aiGenerations": 10,
      "providerCalls": 0,
      "syncRuns": 0,
      "documentExports": 5,
      "discoveredJobImports": 10,
      "teamSeats": 1
    }'::jsonb,
    '{
      "localAi": true,
      "premiumAi": false,
      "providerSync": false,
      "teamWorkspace": false,
      "documentTemplates": false,
      "supportPriority": false
    }'::jsonb,
    true
  ),
  (
    'premium',
    'Premium',
    1900,
    'USD',
    '{
      "savedJobs": 500,
      "applications": 250,
      "resumes": 25,
      "copilotMessages": 500,
      "copilotActions": 250,
      "aiGenerations": 500,
      "providerCalls": 500,
      "syncRuns": 250,
      "documentExports": 200,
      "discoveredJobImports": 500,
      "teamSeats": 1
    }'::jsonb,
    '{
      "localAi": true,
      "premiumAi": true,
      "providerSync": true,
      "teamWorkspace": false,
      "documentTemplates": true,
      "supportPriority": false
    }'::jsonb,
    true
  ),
  (
    'team',
    'Team',
    4900,
    'USD',
    '{
      "savedJobs": 2000,
      "applications": 1000,
      "resumes": 100,
      "copilotMessages": 2000,
      "copilotActions": 1000,
      "aiGenerations": 2000,
      "providerCalls": 2000,
      "syncRuns": 1000,
      "documentExports": 1000,
      "discoveredJobImports": 2000,
      "teamSeats": 5
    }'::jsonb,
    '{
      "localAi": true,
      "premiumAi": true,
      "providerSync": true,
      "teamWorkspace": true,
      "documentTemplates": true,
      "supportPriority": true
    }'::jsonb,
    true
  )
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "monthly_price_cents" = EXCLUDED."monthly_price_cents",
  "currency" = EXCLUDED."currency",
  "limits" = EXCLUDED."limits",
  "entitlements" = EXCLUDED."entitlements",
  "active" = EXCLUDED."active",
  "updated_at" = now();

UPDATE "user_subscriptions"
SET "plan_id" = (SELECT "id" FROM "billing_plans" WHERE "code" = 'premium'),
    "provider_subscription_id" = replace("provider_subscription_id", 'sub_local_pro_', 'sub_local_premium_'),
    "updated_at" = now()
WHERE "plan_id" IN (SELECT "id" FROM "billing_plans" WHERE "code" = 'pro')
  AND EXISTS (SELECT 1 FROM "billing_plans" WHERE "code" = 'premium');

UPDATE "billing_plans"
SET "active" = false,
    "name" = 'Pro (legacy)',
    "updated_at" = now()
WHERE "code" = 'pro';
