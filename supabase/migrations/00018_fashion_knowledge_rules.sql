-- Migration: Fashion Knowledge Graph Schema and Seed Data

CREATE TABLE IF NOT EXISTS fashion_concepts (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fashion_concept_aliases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_id text REFERENCES fashion_concepts(id) ON DELETE CASCADE,
  alias text NOT NULL,
  UNIQUE(concept_id, alias)
);

CREATE TABLE IF NOT EXISTS fashion_concept_edges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id text REFERENCES fashion_concepts(id) ON DELETE CASCADE,
  target_id text REFERENCES fashion_concepts(id) ON DELETE CASCADE,
  relation text NOT NULL,
  weight numeric(3,2) DEFAULT 1.0,
  UNIQUE(source_id, target_id, relation)
);

CREATE TABLE IF NOT EXISTS fashion_styling_rules (
  id text PRIMARY KEY,
  concept_id text REFERENCES fashion_concepts(id) ON DELETE CASCADE,
  type text NOT NULL,
  priority numeric(3,2) DEFAULT 1.0,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_DRESS', 'Dress', 'item_type', 'One-piece dress or gown used as a main outfit item.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_DRESS', 'váy') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_DRESS', 'đầm') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_DRESS', 'dress') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_DRESS', 'váy đầm') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_SHIRT', 'Shirt', 'item_type', 'Button-up shirt or structured top.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHIRT', 'áo sơ mi') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHIRT', 'shirt') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHIRT', 'sơ mi') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHIRT', 'áo linen') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_WIDE_LEG_PANTS', 'Wide Leg Pants', 'item_type', 'Wide-leg trousers or linen pants.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_WIDE_LEG_PANTS', 'quần ống rộng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_WIDE_LEG_PANTS', 'wide leg pants') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_WIDE_LEG_PANTS', 'quần linen') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_SHORTS', 'Shorts', 'item_type', 'Short pants for casual or beach outfits.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHORTS', 'quần short') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHORTS', 'shorts') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SHORTS', 'quần đùi') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_SANDAL', 'Sandal', 'item_type', 'Open sandal, often used for beach and summer outfits.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SANDAL', 'sandal') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SANDAL', 'dép sandal') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SANDAL', 'giày sandal') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_HEELS', 'High Heels', 'item_type', 'High-heeled shoes for formal or party outfits.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_HEELS', 'giày cao gót') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_HEELS', 'cao gót') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_HEELS', 'heels') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_SNEAKERS', 'Sneakers', 'item_type', 'Casual athletic-style shoes.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SNEAKERS', 'sneaker') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SNEAKERS', 'sneakers') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_SNEAKERS', 'giày thể thao') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_CLUTCH', 'Clutch', 'item_type', 'Small hand-held bag for party outfits.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_CLUTCH', 'clutch') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_CLUTCH', 'túi cầm tay') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_CLUTCH', 'ví dự tiệc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('ITEM_EARRINGS', 'Earrings', 'item_type', 'Earrings or small jewelry accessories.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_EARRINGS', 'bông tai') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_EARRINGS', 'khuyên tai') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('ITEM_EARRINGS', 'earrings') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('STYLE_KOREAN_CASUAL', 'Korean Casual', 'style', 'Minimal, soft, clean Korean-inspired casual style.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_KOREAN_CASUAL', 'style Hàn') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_KOREAN_CASUAL', 'phong cách Hàn') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_KOREAN_CASUAL', 'gu Hàn Quốc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_KOREAN_CASUAL', 'korean casual') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('STYLE_MENS_CASUAL', 'Men''s Casual', 'style', 'Relaxed, practical casual styling for men''s everyday and travel outfits.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'nam') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'đồ nam') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'outfit nam') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'men casual') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'mens casual') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'male outfit') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_MENS_CASUAL', 'phong cách nam') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('STYLE_CLEAN_RELAXED', 'Clean Relaxed', 'style', 'Simple, neat, light, comfortable styling with regular fits and easy colors.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'nhẹ nhàng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'thoải mái') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'clean relaxed') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'gọn gàng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'minimal relaxed') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_CLEAN_RELAXED', 'dễ mặc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('STYLE_FEMININE', 'Feminine', 'style', 'Soft and romantic feminine style.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_FEMININE', 'nữ tính') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_FEMININE', 'dịu dàng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('STYLE_FEMININE', 'feminine') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('OCCASION_PARTY', 'Party', 'occasion', 'Evening party, birthday party, dinner, or night out.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_PARTY', 'đi tiệc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_PARTY', 'tiệc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_PARTY', 'party') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_PARTY', 'dự tiệc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_PARTY', 'sinh nhật') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('OCCASION_BEACH_TRAVEL', 'Beach Travel', 'occasion', 'Beach or coastal travel setting.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'đi biển') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'du lịch biển') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'biển') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'beach travel') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'Vũng Tàu') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'Nha Trang') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('OCCASION_BEACH_TRAVEL', 'Phú Quốc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('BODY_PETITE', 'Petite', 'body_context', 'Short or petite height context.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_PETITE', 'hơi thấp') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_PETITE', 'thấp') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_PETITE', 'người thấp') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_PETITE', 'petite') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('BODY_STOCKY', 'Stocky / Solid Build', 'body_context', 'Solid, broad, or heavier build that benefits from regular fit and clean vertical lines.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', 'đậm người') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', 'hơi mập') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', 'stocky') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', 'solid build') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', '1m7 80kg') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('BODY_STOCKY', '80kg') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('USER_MALE', 'Male User', 'user_context', 'The outfit request is for a male user or masculine wardrobe.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'nam') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'con trai') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'đàn ông') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'male') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'man') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('USER_MALE', 'men') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('PREF_MODEST', 'Modest Coverage', 'preference', 'Preference for not-too-revealing clothes.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_MODEST', 'không quá hở') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_MODEST', 'kín đáo') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_MODEST', 'modest') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('PREF_COMFORTABLE', 'Comfortable', 'preference', 'Preference for relaxed, breathable, easy-to-wear clothes that support movement.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'thoải mái') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'dễ chịu') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'dễ mặc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'comfort') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'comfortable') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('PREF_COMFORTABLE', 'relaxed fit') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('FABRIC_BREATHABLE', 'Breathable Fabric', 'material_property', 'Lightweight and cool fabric for hot weather.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('FABRIC_BREATHABLE', 'mát') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('FABRIC_BREATHABLE', 'thoáng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('FABRIC_BREATHABLE', 'thoáng mát') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('FABRIC_BREATHABLE', 'breathable') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('COLOR_NEUTRAL', 'Neutral Colors', 'color', 'White, black, beige, cream, grey, and camel tones.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_NEUTRAL', 'màu trung tính') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_NEUTRAL', 'neutral') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_NEUTRAL', 'trắng') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_NEUTRAL', 'đen') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_NEUTRAL', 'be') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('COLOR_PASTEL', 'Pastel Colors', 'color', 'Soft light pink, lavender, sky blue, or mint tones.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_PASTEL', 'pastel') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_PASTEL', 'màu pastel') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_PASTEL', 'hồng nhạt') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_PASTEL', 'xanh nhạt') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concepts (id, name, type, description) VALUES ('COLOR_METALLIC', 'Metallic Colors', 'color', 'Silver, gold, champagne, and metallic accents.') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_METALLIC', 'ánh kim') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_METALLIC', 'bạc') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_METALLIC', 'vàng champagne') ON CONFLICT (concept_id, alias) DO NOTHING;
INSERT INTO fashion_concept_aliases (concept_id, alias) VALUES ('COLOR_METALLIC', 'metallic') ON CONFLICT (concept_id, alias) DO NOTHING;

INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('ITEM_DRESS', 'ITEM_HEELS', 'PAIRS_WITH', 0.9) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('ITEM_DRESS', 'ITEM_CLUTCH', 'PAIRS_WITH', 0.78) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('ITEM_DRESS', 'ITEM_EARRINGS', 'PAIRS_WITH', 0.72) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('ITEM_SHIRT', 'ITEM_WIDE_LEG_PANTS', 'PAIRS_WITH', 0.86) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('ITEM_SHIRT', 'ITEM_SHORTS', 'PAIRS_WITH', 0.74) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_PARTY', 'ITEM_DRESS', 'PREFERS', 0.9) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_PARTY', 'ITEM_HEELS', 'PREFERS', 0.86) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_PARTY', 'ITEM_SNEAKERS', 'AVOIDS', 0.75) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_PARTY', 'COLOR_METALLIC', 'PREFERS', 0.8) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_BEACH_TRAVEL', 'FABRIC_BREATHABLE', 'PREFERS', 0.95) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_BEACH_TRAVEL', 'ITEM_SANDAL', 'PREFERS', 0.88) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('OCCASION_BEACH_TRAVEL', 'ITEM_WIDE_LEG_PANTS', 'PREFERS', 0.76) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_KOREAN_CASUAL', 'ITEM_SHIRT', 'PREFERS', 0.82) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_KOREAN_CASUAL', 'ITEM_WIDE_LEG_PANTS', 'PREFERS', 0.84) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_KOREAN_CASUAL', 'ITEM_SNEAKERS', 'PREFERS', 0.72) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_KOREAN_CASUAL', 'COLOR_NEUTRAL', 'PREFERS', 0.88) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_FEMININE', 'ITEM_DRESS', 'PREFERS', 0.86) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_FEMININE', 'COLOR_PASTEL', 'PREFERS', 0.78) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('PREF_MODEST', 'ITEM_SHORTS', 'AVOIDS', 0.82) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_MENS_CASUAL', 'ITEM_SHIRT', 'PREFERS', 0.86) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_MENS_CASUAL', 'ITEM_SHORTS', 'PREFERS', 0.82) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_MENS_CASUAL', 'ITEM_SANDAL', 'PREFERS', 0.78) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_MENS_CASUAL', 'ITEM_DRESS', 'AVOIDS', 0.86) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_CLEAN_RELAXED', 'ITEM_SHIRT', 'PREFERS', 0.84) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_CLEAN_RELAXED', 'COLOR_NEUTRAL', 'PREFERS', 0.82) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('STYLE_CLEAN_RELAXED', 'FABRIC_BREATHABLE', 'PREFERS', 0.8) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('PREF_COMFORTABLE', 'FABRIC_BREATHABLE', 'PREFERS', 0.92) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('PREF_COMFORTABLE', 'ITEM_SNEAKERS', 'PREFERS', 0.78) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('PREF_COMFORTABLE', 'ITEM_HEELS', 'AVOIDS', 0.9) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('BODY_STOCKY', 'ITEM_SHIRT', 'PREFERS', 0.78) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('BODY_STOCKY', 'COLOR_NEUTRAL', 'PREFERS', 0.72) ON CONFLICT (source_id, target_id, relation) DO NOTHING;
INSERT INTO fashion_concept_edges (source_id, target_id, relation, weight) VALUES ('USER_MALE', 'STYLE_MENS_CASUAL', 'PREFERS', 0.95) ON CONFLICT (source_id, target_id, relation) DO NOTHING;

INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_item_dress_targets', 'ITEM_DRESS', 'preferred_targets', 0.95, '{"targets": [{"item": "dress", "role": "main", "required": true, "priority": 0.95}, {"item": "shoes", "role": "support", "required": true, "priority": 0.85}, {"item": "bag", "role": "optional", "required": false, "priority": 0.62}, {"item": "accessory", "role": "optional", "required": false, "priority": 0.58}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_item_dress_exclusions', 'ITEM_DRESS', 'excluded_items', 0.9, '{"items": [{"when_main": "dress", "exclude": ["top", "bottom"]}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_item_dress_style', 'ITEM_DRESS', 'style_rule', 0.86, '{"rule": "Dress-based outfits should keep the dress as the main visual piece."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_item_shirt_targets', 'ITEM_SHIRT', 'preferred_targets', 0.9, '{"targets": [{"item": "top", "role": "main", "required": true, "priority": 0.9}, {"item": "bottom", "role": "support", "required": true, "priority": 0.85}, {"item": "shoes", "role": "optional", "required": false, "priority": 0.55}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_item_shirt_exclusions', 'ITEM_SHIRT', 'excluded_items', 0.78, '{"items": [{"when_main": "top", "exclude": ["dress"]}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_party_targets', 'OCCASION_PARTY', 'preferred_targets', 0.88, '{"targets": [{"item": "dress", "role": "main", "required": true, "priority": 0.88}, {"item": "shoes", "role": "support", "required": true, "priority": 0.82}, {"item": "bag", "role": "optional", "required": false, "priority": 0.72}, {"item": "accessory", "role": "optional", "required": false, "priority": 0.65}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_party_occasion', 'OCCASION_PARTY', 'occasion_rule', 0.9, '{"rule": "Party outfits should look polished and intentional; metallic accents are allowed."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_beach_targets', 'OCCASION_BEACH_TRAVEL', 'preferred_targets', 0.86, '{"targets": [{"item": "top", "role": "main_or_support", "required": false, "priority": 0.7}, {"item": "bottom", "role": "support", "required": true, "priority": 0.82}, {"item": "shoes", "role": "support", "required": false, "priority": 0.64}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_beach_occasion', 'OCCASION_BEACH_TRAVEL', 'occasion_rule', 0.9, '{"rule": "Beach outfits should prioritize breathable fabric, relaxed silhouettes, and easy shoes."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_modest', 'PREF_MODEST', 'modesty_rule', 0.86, '{"rule": "Avoid very short or revealing pieces when the user asks for modest coverage."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_petite', 'BODY_PETITE', 'body_rule', 0.8, '{"rule": "For petite users, prefer cleaner vertical lines and avoid heavy oversized proportions."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_mens_casual_targets', 'STYLE_MENS_CASUAL', 'preferred_targets', 0.88, '{"targets": [{"item": "top", "role": "main", "required": true, "priority": 0.86}, {"item": "bottom", "role": "support", "required": true, "priority": 0.84}, {"item": "shoes", "role": "support", "required": false, "priority": 0.7}]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_clean_relaxed_style', 'STYLE_CLEAN_RELAXED', 'style_rule', 0.84, '{"rule": "Clean relaxed outfits should use simple colors, breathable fabrics, and regular fits rather than overly tight or bulky pieces."}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_comfortable_preference', 'PREF_COMFORTABLE', 'preferred_item_types', 0.84, '{"items": ["shirt", "shorts", "sneakers", "sandal"], "prefer_items": ["breathable_fabric", "regular_fit"]}') ON CONFLICT (id) DO NOTHING;
INSERT INTO fashion_styling_rules (id, concept_id, type, priority, payload) VALUES ('rule_stocky_body', 'BODY_STOCKY', 'body_rule', 0.82, '{"rule": "For solid builds, prefer regular fit, clean vertical lines, and avoid overly tight or oversized proportions."}') ON CONFLICT (id) DO NOTHING;