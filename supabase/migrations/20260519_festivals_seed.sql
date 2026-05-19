-- Festival Seed Data — India + International (50+ festivals)
-- Run AFTER 20260519_features_schema.sql

INSERT INTO festivals (name, slug, city, country, region, website_url, description, established_year, festival_type, prestige_level, is_oscar_qualifying, is_bafta_qualifying, film_types_accepted, categories, submission_platform, is_free) VALUES

-- ── INDIA NATIONAL ──
('MAMI Mumbai Film Festival', 'mami', 'Mumbai', 'India', 'West India', 'https://mumbaifilmfest.com', 'One of Asia''s most prestigious film festivals, celebrating global and Indian cinema.', 1997, 'International', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','India Gold','Student Films'], 'FilmFreeway', false),

('IFFK Kerala International Film Festival', 'iffk', 'Thiruvananthapuram', 'India', 'South India', 'https://iffk.in', 'Kerala''s flagship international film festival, known for curating world cinema and Malayalam films.', 1996, 'International', 'tier2', false, false, ARRAY['Feature Film','Documentary','Short Film'], ARRAY['International Competition','Malayalam Cinema'], 'direct', false),

('BIFF Bengaluru International Film Festival', 'biff', 'Bengaluru', 'India', 'South India', 'https://biffes.org', 'South India''s premier international film festival with strong focus on indie and world cinema.', 2008, 'International', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','Indian Cinema','Student Films'], 'direct', false),

('CIFF Chennai International Film Festival', 'ciff', 'Chennai', 'India', 'South India', 'https://chennaiff.org', 'Annual international film festival celebrating Tamil cinema and global films.', 2003, 'International', 'emerging', false, false, ARRAY['Feature Film','Short Film'], ARRAY['International Competition','South Indian Cinema'], 'direct', false),

('Dharamshala International Film Festival', 'diff-dharamshala', 'Dharamshala', 'India', 'North India', 'https://diff.co.in', 'Boutique mountain festival with a focus on independent Indian and world cinema.', 2012, 'International', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['Indian Cinema','World Cinema'], 'direct', false),

('Habitat Film Festival Delhi', 'habitat-delhi', 'New Delhi', 'India', 'North India', 'https://habitatfilmfestival.com', 'Annual festival at India Habitat Centre celebrating short films and documentaries.', 2010, 'Short Film', 'emerging', false, false, ARRAY['Short Film','Documentary'], ARRAY['Short Fiction','Documentary','Animation'], 'direct', true),

('SIGNS Kerala Women''s Film Festival', 'signs-kerala', 'Thiruvananthapuram', 'India', 'South India', 'https://signsfestival.com', 'India''s first film festival exclusively curated by and for women filmmakers.', 2016, 'Specialized', 'emerging', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['Women Filmmaker','Women''s Stories'], 'direct', true),

('PSBT Open Frame Documentary Festival', 'psbt-open-frame', 'New Delhi', 'India', 'North India', 'https://psbt.org', 'India''s premier documentary festival, supported by Public Service Broadcasting Trust.', 2005, 'Documentary', 'tier2', false, false, ARRAY['Documentary'], ARRAY['Documentary Competition','Student Docs'], 'direct', true),

('Kashish Mumbai Queer Film Festival', 'kashish', 'Mumbai', 'India', 'West India', 'https://mumbaiqueerfest.com', 'Asia''s biggest LGBTQ+ film festival, celebrating queer stories from India and beyond.', 2010, 'Specialized', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['LGBTQ+ Theme','Queer Cinema'], 'direct', false),

('DIFF Delhi International Film Festival', 'diff-delhi', 'New Delhi', 'India', 'North India', 'https://delhifilmfestival.com', 'Annual international film festival at the national capital celebrating global cinema.', 2012, 'International', 'emerging', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','South Asian Cinema'], 'FilmFreeway', false),

('IFFI Goa', 'iffi-goa', 'Goa', 'India', 'West India', 'https://iffigoa.org', 'India''s oldest and most prestigious international film festival, the only FIAPF-accredited festival in India.', 1952, 'International', 'tier1', true, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','Indian Panorama','Short & Documentary'], 'direct', false),

('Zero1 Film Festival', 'zero1', 'Mumbai', 'India', 'West India', 'https://zero1fest.com', 'Dedicated to zero-budget and ultra-low-budget short films. Free to submit.', 2018, 'Short Film', 'emerging', false, false, ARRAY['Short Film'], ARRAY['Zero Budget','Short Fiction'], 'FilmFreeway', true),

('Feel The Reel Film Festival', 'feel-the-reel', 'Mumbai', 'India', 'West India', 'https://feelthereelfilmfest.com', 'Short film festival celebrating emerging indie voices. Affordable submission fees.', 2015, 'Short Film', 'emerging', false, false, ARRAY['Short Film','Documentary'], ARRAY['Short Fiction','Documentary','Animation','Experimental'], 'FilmFreeway', false),

('CRIBS Kolkata Short Film Festival', 'cribs-kolkata', 'Kolkata', 'India', 'East India', 'https://cribsfilmfestival.com', 'East India''s premier short film festival celebrating Bengali and pan-India short cinema.', 2011, 'Short Film', 'emerging', false, false, ARRAY['Short Film'], ARRAY['Bengali Cinema','Short Fiction','Documentary'], 'direct', false),

('Tasveer South Asian Film Festival', 'tasveer', 'Hyderabad', 'India', 'South India', 'https://tasveer.org', 'Festival celebrating South Asian stories — India, Pakistan, Bangladesh, Sri Lanka, Nepal.', 2007, 'Specialized', 'emerging', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['South Asian Cinema'], 'direct', false),

('Short Film Hunger Festival', 'short-film-hunger', 'Pune', 'India', 'West India', 'https://shortfilmhunger.com', 'Online and in-person festival for Indian short filmmakers with free submissions.', 2019, 'Short Film', 'emerging', false, false, ARRAY['Short Film'], ARRAY['Short Fiction','Documentary','Experimental'], 'FilmFreeway', true),

-- ── INTERNATIONAL ──
('Sundance Film Festival', 'sundance', 'Park City', 'USA', 'International', 'https://sundance.org', 'The premier American independent film festival. The most coveted launch pad for indie films worldwide.', 1978, 'International', 'tier1', true, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['US Dramatic','US Documentary','World Cinema','Short Films'], 'FilmFreeway', false),

('Tribeca Film Festival', 'tribeca', 'New York', 'USA', 'International', 'https://tribecafilm.com', 'Prestigious New York festival known for bold storytelling and emerging filmmakers.', 2002, 'International', 'tier1', true, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Narrative','Documentary','Short Films'], 'FilmFreeway', false),

('SXSW Film & TV Festival', 'sxsw', 'Austin', 'USA', 'International', 'https://sxsw.com', 'Iconic Austin festival blending film, music, and tech. Launch pad for genre-defining indie films.', 1994, 'International', 'tier1', true, false, ARRAY['Feature Film','Short Film'], ARRAY['Narrative Feature','Documentary','Midnight','Short Film Program'], 'FilmFreeway', false),

('Cannes Film Festival', 'cannes', 'Cannes', 'France', 'International', 'https://festival-cannes.com', 'The world''s most prestigious film festival. Palme d''Or is cinema''s highest honor.', 1946, 'International', 'tier1', true, true, ARRAY['Feature Film','Short Film'], ARRAY['Palme d''Or','Un Certain Regard','Short Film Palme d''Or','Cinéfondation'], 'direct', false),

('Venice Film Festival', 'venice', 'Venice', 'Italy', 'International', 'https://labiennale.org/en/cinema', 'World''s oldest film festival. Golden Lion winner often leads to Oscar consideration.', 1932, 'International', 'tier1', true, true, ARRAY['Feature Film','Short Film','Documentary','VR'], ARRAY['Golden Lion Competition','Orizzonti','Short Films'], 'direct', false),

('Berlin International Film Festival', 'berlinale', 'Berlin', 'Germany', 'International', 'https://berlinale.de', 'Berlinale is one of the world''s leading film festivals with the Golden Bear top prize.', 1951, 'International', 'tier1', true, true, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['Main Competition','Panorama','Forum','Generation','Short Film Golden Bear'], 'direct', false),

('Clermont-Ferrand Short Film Festival', 'clermont-ferrand', 'Clermont-Ferrand', 'France', 'International', 'https://clermont-filmfest.org', 'The world''s most important short film festival. Submitting here is a rite of passage.', 1979, 'Short Film', 'tier1', true, false, ARRAY['Short Film'], ARRAY['International Competition','National Competition','Lab'], 'direct', false),

('Palm Springs ShortFest', 'palm-springs-shortfest', 'Palm Springs', 'USA', 'International', 'https://psfilmfest.org', 'Oscar-qualifying short film festival. One of the best platforms for international short films.', 1995, 'Short Film', 'tier2', true, false, ARRAY['Short Film'], ARRAY['Short Film Competition','Student Films'], 'FilmFreeway', false),

('Hot Docs International Documentary Festival', 'hot-docs', 'Toronto', 'Canada', 'International', 'https://hotdocs.ca', 'North America''s largest documentary festival. Launchpad for global documentary films.', 1993, 'Documentary', 'tier1', false, false, ARRAY['Documentary'], ARRAY['World Showcase','Canadian Spectrum','Short Docs'], 'FilmFreeway', false),

('International Documentary Film Festival Amsterdam (IDFA)', 'idfa', 'Amsterdam', 'Netherlands', 'International', 'https://idfa.nl', 'World''s largest documentary festival. Essential platform for social issue and creative docs.', 1988, 'Documentary', 'tier1', false, false, ARRAY['Documentary','Short Film'], ARRAY['Feature Documentary','Short Documentary','DocLab'], 'FilmFreeway', false),

('Oberhausen Short Film Festival', 'oberhausen', 'Oberhausen', 'Germany', 'International', 'https://kurzfilmtage.de', 'One of the world''s oldest short film festivals with a focus on experimental and avant-garde work.', 1954, 'Short Film', 'tier1', false, false, ARRAY['Short Film','Experimental'], ARRAY['International Competition','German Competition','Children''s Films'], 'direct', false),

('BFI London Film Festival', 'bfi-london', 'London', 'UK', 'International', 'https://bfi.org.uk/lff', 'UK''s most prestigious film event. BAFTA-qualifying for short films.', 1957, 'International', 'tier1', false, true, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['Official Competition','Documentary Competition','Short Film Competition'], 'FilmFreeway', false),

('Aesthetica Short Film Festival', 'aesthetica', 'York', 'UK', 'International', 'https://asff.co.uk', 'BAFTA-qualifying short film festival in York. One of UK''s best platforms for short films.', 2011, 'Short Film', 'tier2', false, true, ARRAY['Short Film','Animation','Experimental'], ARRAY['Fiction','Documentary','Animation','Experimental','Music Video'], 'FilmFreeway', false),

('Flickerfest Short Film Festival', 'flickerfest', 'Sydney', 'Australia', 'International', 'https://flickerfest.com.au', 'Australia''s premier short film festival. Oscar and BAFTA qualifying.', 1991, 'Short Film', 'tier2', true, true, ARRAY['Short Film','Animation','Documentary'], ARRAY['International Competition','Australian Competition','Documentary'], 'FilmFreeway', false),

('Atlanta Film Festival', 'atlanta', 'Atlanta', 'USA', 'International', 'https://atlantafilmfestival.com', 'Oscar-qualifying film festival in Atlanta celebrating independent and diverse cinema.', 1976, 'International', 'tier2', true, false, ARRAY['Feature Film','Short Film','Documentary','Animation'], ARRAY['Narrative Feature','Documentary','Short Film','Animation'], 'FilmFreeway', false),

('Nashville Film Festival', 'nashville', 'Nashville', 'USA', 'International', 'https://nashvillefilmfestival.org', 'Oscar-qualifying festival celebrating independent narrative and documentary films.', 1969, 'International', 'tier2', true, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['Narrative','Documentary','Short Films'], 'FilmFreeway', false),

('Frameline LGBTQ+ Film Festival', 'frameline', 'San Francisco', 'USA', 'International', 'https://frameline.org', 'The world''s longest-running and largest LGBTQ film festival.', 1977, 'Specialized', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['LGBTQ+ Theme','Queer Cinema'], 'FilmFreeway', false),

('IndieLisboa', 'indielisboa', 'Lisbon', 'Portugal', 'International', 'https://indielisboa.com', 'Lisbon''s international independent film festival. Low fees, great visibility for emerging filmmakers.', 2004, 'International', 'emerging', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','Portuguese Cinema'], 'FilmFreeway', false),

('Uppsala Short Film Festival', 'uppsala', 'Uppsala', 'Sweden', 'International', 'https://shortfilmfestival.com', 'One of Scandinavia''s oldest film festivals, dedicated exclusively to short films.', 1982, 'Short Film', 'tier2', false, false, ARRAY['Short Film'], ARRAY['International Competition','Nordic Competition','Children''s Films'], 'FilmFreeway', false),

('Encounters Short Film & Animation Festival', 'encounters-bristol', 'Bristol', 'UK', 'International', 'https://encounters-festival.org.uk', 'BAFTA-qualifying UK festival celebrating short film and animation.', 1995, 'Short Film', 'tier2', false, true, ARRAY['Short Film','Animation'], ARRAY['International Competition','UK Competition','Animation'], 'FilmFreeway', false),

('Melbourne International Film Festival', 'miff', 'Melbourne', 'Australia', 'International', 'https://miff.com.au', 'Australia''s oldest and most prestigious international film festival.', 1952, 'International', 'tier2', false, false, ARRAY['Feature Film','Short Film','Documentary'], ARRAY['International Competition','Australian Competition'], 'FilmFreeway', false),

('NSFF National Short Film Festival India', 'nsff', 'Pune', 'India', 'West India', 'https://nsff.in', 'India''s dedicated national short film festival celebrating emerging short filmmakers.', 2013, 'Short Film', 'emerging', false, false, ARRAY['Short Film','Documentary'], ARRAY['Fiction','Documentary','Experimental','Student Films'], 'direct', false);

-- ── Festival Deadlines (2026 editions) ──
INSERT INTO festival_deadlines (festival_id, edition_year, deadline_type, deadline_date, fee_inr, fee_usd, is_free)
SELECT id, 2026, 'earlybird', '2026-06-15', 0, 0, true FROM festivals WHERE slug = 'zero1'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 0, 0, true FROM festivals WHERE slug = 'zero1'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-01', 400, 0, false FROM festivals WHERE slug = 'mami'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 600, 0, false FROM festivals WHERE slug = 'mami'
UNION ALL
SELECT id, 2026, 'late', '2026-08-31', 1000, 0, false FROM festivals WHERE slug = 'mami'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-08-15', 500, 0, false FROM festivals WHERE slug = 'iffk'
UNION ALL
SELECT id, 2026, 'regular', '2026-09-15', 800, 0, false FROM festivals WHERE slug = 'iffk'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-01', 0, 0, true FROM festivals WHERE slug = 'habitat-delhi'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-01', 0, 0, true FROM festivals WHERE slug = 'habitat-delhi'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-30', 0, 0, true FROM festivals WHERE slug = 'signs-kerala'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-31', 0, 0, true FROM festivals WHERE slug = 'signs-kerala'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-05-31', 0, 0, true FROM festivals WHERE slug = 'psbt-open-frame'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 0, 0, true FROM festivals WHERE slug = 'psbt-open-frame'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-15', 600, 0, false FROM festivals WHERE slug = 'kashish'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-20', 900, 0, false FROM festivals WHERE slug = 'kashish'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-30', 500, 0, false FROM festivals WHERE slug = 'biff'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-30', 800, 0, false FROM festivals WHERE slug = 'biff'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-08-01', 800, 0, false FROM festivals WHERE slug = 'diff-dharamshala'
UNION ALL
SELECT id, 2026, 'regular', '2026-09-01', 1200, 0, false FROM festivals WHERE slug = 'diff-dharamshala'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-01', 0, 0, true FROM festivals WHERE slug = 'short-film-hunger'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 0, 0, true FROM festivals WHERE slug = 'short-film-hunger'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-05-31', 500, 0, false FROM festivals WHERE slug = 'feel-the-reel'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 800, 0, false FROM festivals WHERE slug = 'feel-the-reel'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-01', 0, 25, false FROM festivals WHERE slug = 'sundance'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-20', 0, 65, false FROM festivals WHERE slug = 'sundance'
UNION ALL
SELECT id, 2026, 'late', '2026-09-15', 0, 85, false FROM festivals WHERE slug = 'sundance'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-15', 0, 35, false FROM festivals WHERE slug = 'tribeca'
UNION ALL
SELECT id, 2026, 'regular', '2026-09-01', 0, 65, false FROM festivals WHERE slug = 'tribeca'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-01', 0, 35, false FROM festivals WHERE slug = 'sxsw'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-15', 0, 75, false FROM festivals WHERE slug = 'sxsw'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-01', 0, 20, false FROM festivals WHERE slug = 'palm-springs-shortfest'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-01', 0, 45, false FROM festivals WHERE slug = 'palm-springs-shortfest'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-15', 0, 25, false FROM festivals WHERE slug = 'clermont-ferrand'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-15', 0, 50, false FROM festivals WHERE slug = 'clermont-ferrand'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-01', 0, 30, false FROM festivals WHERE slug = 'aesthetica'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 0, 55, false FROM festivals WHERE slug = 'aesthetica'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-15', 0, 25, false FROM festivals WHERE slug = 'flickerfest'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 0, 50, false FROM festivals WHERE slug = 'flickerfest'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-01', 0, 30, false FROM festivals WHERE slug = 'bfi-london'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 0, 55, false FROM festivals WHERE slug = 'bfi-london'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-05-15', 0, 20, false FROM festivals WHERE slug = 'encounters-bristol'
UNION ALL
SELECT id, 2026, 'regular', '2026-06-30', 0, 40, false FROM festivals WHERE slug = 'encounters-bristol'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-30', 0, 30, false FROM festivals WHERE slug = 'hot-docs'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-15', 0, 55, false FROM festivals WHERE slug = 'hot-docs'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-15', 0, 30, false FROM festivals WHERE slug = 'idfa'
UNION ALL
SELECT id, 2026, 'regular', '2026-09-01', 0, 55, false FROM festivals WHERE slug = 'idfa'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-01', 0, 20, false FROM festivals WHERE slug = 'indielisboa'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 0, 35, false FROM festivals WHERE slug = 'indielisboa'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-15', 0, 25, false FROM festivals WHERE slug = 'atlanta'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 0, 50, false FROM festivals WHERE slug = 'atlanta'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-07-01', 0, 25, false FROM festivals WHERE slug = 'nashville'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-15', 0, 50, false FROM festivals WHERE slug = 'nashville'
UNION ALL
SELECT id, 2026, 'earlybird', '2026-06-30', 0, 25, false FROM festivals WHERE slug = 'frameline'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-01', 0, 45, false FROM festivals WHERE slug = 'frameline'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-01', 700, 0, false FROM festivals WHERE slug = 'tasveer'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-15', 600, 0, false FROM festivals WHERE slug = 'cribs-kolkata'
UNION ALL
SELECT id, 2026, 'regular', '2026-08-31', 900, 0, false FROM festivals WHERE slug = 'ciff'
UNION ALL
SELECT id, 2026, 'regular', '2026-09-30', 500, 0, false FROM festivals WHERE slug = 'nsff'
UNION ALL
SELECT id, 2026, 'regular', '2026-07-31', 700, 0, false FROM festivals WHERE slug = 'diff-delhi'
UNION ALL
SELECT id, 2026, 'regular', '2026-10-01', 800, 0, false FROM festivals WHERE slug = 'iffi-goa';
