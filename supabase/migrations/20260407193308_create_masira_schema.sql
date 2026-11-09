/*
  # Masira SaaS Schema

  1. Neue Tabellen
    - `companies` - Firmeninformationen
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `created_at` (timestamp)
      
    - `profiles` - Benutzerprofile
      - `id` (uuid, primary key, references auth.users)
      - `company_id` (uuid, references companies)
      - `full_name` (text)
      - `role` (text)
      - `created_at` (timestamp)
      
    - `knowledge_base` - Wissensdatenbank-Artikel
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `title` (text)
      - `content` (text)
      - `category` (text, nullable)
      - `tags` (text[], nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `messages` - Kundennachrichten
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `sender_name` (text)
      - `sender_email` (text)
      - `subject` (text)
      - `content` (text)
      - `status` (text) - new, read, replied
      - `created_at` (timestamp)
      
    - `ai_replies` - KI-generierte Antworten
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `company_id` (uuid, references companies)
      - `reply_content` (text)
      - `status` (text) - draft, sent
      - `created_at` (timestamp)
      - `sent_at` (timestamp, nullable)
      
    - `reviews` - Kundenbewertungen
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `reviewer_name` (text)
      - `reviewer_email` (text)
      - `rating` (integer)
      - `content` (text)
      - `source` (text, nullable)
      - `status` (text) - pending, published, archived
      - `created_at` (timestamp)
      
    - `review_replies` - Antworten auf Bewertungen
      - `id` (uuid, primary key)
      - `review_id` (uuid, references reviews)
      - `company_id` (uuid, references companies)
      - `reply_content` (text)
      - `created_at` (timestamp)
      
    - `offers` - Angebote
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `valid_until` (timestamp, nullable)
      - `status` (text) - draft, active, expired
      - `created_at` (timestamp)
      
    - `invoices` - Rechnungen
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `invoice_number` (text)
      - `customer_name` (text)
      - `customer_email` (text)
      - `amount` (numeric)
      - `status` (text) - draft, sent, paid, overdue
      - `due_date` (timestamp)
      - `created_at` (timestamp)
      
    - `appointments` - Termine
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `customer_name` (text)
      - `customer_email` (text)
      - `title` (text)
      - `description` (text, nullable)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `status` (text) - scheduled, completed, cancelled
      - `created_at` (timestamp)

  2. Sicherheit
    - RLS aktiviert für alle Tabellen
    - Policies für authentifizierte Benutzer basierend auf company_id
*/

-- Companies Tabelle
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können eigene Firma sehen"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Profiles Tabelle
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können eigenes Profil sehen"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Benutzer können eigenes Profil erstellen"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Benutzer können eigenes Profil aktualisieren"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Knowledge Base Tabelle
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Artikel ihrer Firma sehen"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Artikel ihrer Firma erstellen"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Artikel ihrer Firma aktualisieren"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Artikel ihrer Firma löschen"
  ON knowledge_base FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Messages Tabelle
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Nachrichten ihrer Firma sehen"
  ON messages FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Nachrichten ihrer Firma aktualisieren"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AI Replies Tabelle
CREATE TABLE IF NOT EXISTS ai_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  reply_content text NOT NULL,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE ai_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können AI-Antworten ihrer Firma sehen"
  ON ai_replies FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können AI-Antworten ihrer Firma erstellen"
  ON ai_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können AI-Antworten ihrer Firma aktualisieren"
  ON ai_replies FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Reviews Tabelle
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  source text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Bewertungen ihrer Firma sehen"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Review Replies Tabelle
CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  reply_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Bewertungsantworten ihrer Firma sehen"
  ON review_replies FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Bewertungsantworten ihrer Firma erstellen"
  ON review_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Offers Tabelle
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  valid_until timestamptz,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Angebote ihrer Firma sehen"
  ON offers FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Angebote ihrer Firma erstellen"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Angebote ihrer Firma aktualisieren"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Angebote ihrer Firma löschen"
  ON offers FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Invoices Tabelle
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'draft',
  due_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Rechnungen ihrer Firma sehen"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Rechnungen ihrer Firma erstellen"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Rechnungen ihrer Firma aktualisieren"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Appointments Tabelle
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benutzer können Termine ihrer Firma sehen"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Termine ihrer Firma erstellen"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Benutzer können Termine ihrer Firma aktualisieren"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
