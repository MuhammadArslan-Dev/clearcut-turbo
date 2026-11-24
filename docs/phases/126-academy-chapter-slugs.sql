-- Phase 126 Task A - academy chapters with slug NULL / missing from navigation.
-- Generated 2026-11-24 from PRODUCTION reads (public /api/blog/exam-index, question-index,
-- get-questions-by-ids, get-questions-by-section) cross-checked row by row with the local DB.
-- Production DB (MySQL, clearcutoff-main-backend). Run by the user, section by section.
-- Every UPDATE/INSERT names explicit ids/uuids and is guarded (slug IS NULL / NOT EXISTS),
-- so a second run changes nothing.
--
-- Groups
--   A  146 chapters, 4320 questions: slug NULL, already in navigation -> UPDATE slug.
--   B  10 chapters, 347 questions: psychology, mapped to HTET_PSY which is NOT a subject of any
--      level (their questions are tagged HTET_PHY "physics"). NEEDS A DECISION - see bottom; not run.
--   C  16 chapters, 300 questions: music, slug NULL and no navigation row -> UPDATE slug + INSERT
--      mapping into HTET_MUS (e_sections.id 14, which has no chapters today).
--   D  2 chapters, 20 questions: have a slug but no navigation row -> INSERT mapping
--      (health-and-hygiene -> HTET_PED id 15, theories-of-learning -> HTET_CDP id 1).
-- Not fixable here: 1,137 HTET questions have question_new.chapter_id NULL (300 of them tagged
--   section 'HTET_Music', a typo of HTET_MUS). They need a chapter in BigQuery first.
--
-- Comments show, per chapter: production redirect of its old /question/* URLs today -> the page
-- after the fix (page 1; later questions go to /page/N of the same chapter). Site: https://academy.clearcutoff.in
--
-- IMPORTANT: s_chapters.slug is overwritten by syncChapters from BigQuery staging.s_chapter.ai_slug
-- (ExamRepository::syncChapters, updateOrCreate with slug = ai_slug). Run section 5 (BigQuery) too,
-- or the next chapter sync sets these slugs back to NULL. Mapping rows survive syncs (updateOrCreate,
-- never deletes).

-- ===== 1. PREVIEW (read-only) =====
-- Expect 162 rows, all slug NULL:
SELECT id, chapter_id, slug, name FROM s_chapters WHERE id IN (193,194,195,196,197,198,199,200,201,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,245,246,247,248,249,250,251,252,253,255,256,258,259,260,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,298,299,300,302,304,305,308,309,312,313,315,317,318,320,321,329,331,334,337,338,340,343,345,346,347,349,350,353,354,356,357,361,367,368,378,380,381,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,223,224,225,226,228,229,230,231,233,234,235,236,240,241,242,243) ORDER BY id;
-- Expect 0 rows (the new slugs are not used yet):
SELECT id, slug FROM s_chapters WHERE slug IN ('introduction-to-art','fundamentals-of-visual-art','shadanga-of-indian-art','techniques-in-art','process-and-procedure-in-art','perspective','indian-folk-art','indian-national-flag','indian-art-history','history-and-foundations-of-physical-education','biological-basis-and-personality','health-hygiene-and-nutrition','school-health-injuries-and-rehabilitation','physical-fitness-wellness-and-cwsn','anatomy-and-physiology','sports-performance-and-doping','kinesiology-and-biomechanics','movement-analysis','sports-psychology-and-sociology','recreation-and-yoga-education','test-measurement-and-evaluation','games-sports-and-current-affairs','sports-management-training-and-research','food-nutrition-and-health','home-and-resource-management','growth-development-and-clothing','advanced-food-and-nutrition','human-development-home-science','textiles-and-communication','business-trade-and-commerce','business-services-and-emerging-modes','nature-and-significance-of-management','business-environment-and-planning','organising-staffing-directing-and-controlling','business-finance-and-marketing','introduction-to-accounting','recording-of-transactions-i','recording-of-transactions-ii','trial-balance-and-rectification-of-errors','depreciation-provisions-and-reserves','partnership-accounting','company-accounts-and-analysis','computerised-accounting-and-trade-environment','arithmetic-algebra-and-trigonometry','geometry-and-mensuration','statistics-and-probability','sets-relations-and-functions','algebra-mathematics','calculus','vectors-and-coordinate-geometry','fundamental-concepts-of-chemistry','atomic-structure-and-periodicity','chemical-bonding-and-thermodynamics','organic-chemistry-basic-principles','physical-chemistry-applications','inorganic-chemistry-advanced','organic-chemistry-functional-groups','applied-and-interdisciplinary-chemistry','cell-biology-and-biomolecules','plant-biology-structure-and-diversity','plant-physiology','animal-biology-structure-and-diversity','human-physiology','biology-in-human-welfare','ecology-and-environment','genetics-and-evolution','biotechnology','kavyashastra','agyeya','amritlal-vegad','acharya-ramchandra-shukla','acharya-nanddulare-vajpeyi','alok-dhanwa','om-prakash-valmiki','kabir','kunwar-narayan','krishna-sobti','keshavdas','gajanan-madhav-muktibodh','chandbardai','jaishankar-prasad','jainendra-kumar','dr-nagendra','tulsidas','nanddulare-vajpeyi','namvar-singh','premchand','balmukund-gupt','bihari','bhavani-prasad-mishra','bhisham-sahni','manglesh-dabral','manohar-shyam-joshi','mannu-bhandari','malik-mohammad-jayasi','mahadevi-verma','maithilisharan-gupt','mohan-rakesh','raghuvir-sahay','ramnika-gupta','ramvilas-sharma','vishwanath-tripathi','vishnu-prabhakar','suryakant-tripathi-nirala','hazari-prasad-dwivedi','hariaudh','harishankar-parsai','introduction-to-economics','statistics-for-economics','indian-economy-development','indian-economic-issues','micro-economics-consumer-behaviour','demand-and-production','revenue-and-market-structure','macroeconomics-income-and-employment','money-and-banking','macro-policy-and-external-sector','computer-system-and-hardware-fundamentals','operating-systems-and-software-concepts','office-automation-tools','software-engineering-and-problem-solving','python-programming-fundamentals','object-oriented-programming-cpp','data-structures-through-cpp','database-management-system-dbms-and-sql','computer-networks-and-internet','web-designing-using-html','cyber-security-ethics-and-emerging-trends','pedagogy-computer-science','sangya','sandheh-sutrani','samasah','pratyayanam','vyayapad','karakprakaranam','chhandansi','alankarah','mahakavayah','gadyakavyakavayah','neetikavayah','kavyashastrakarah','adhuniksanskritkavayah','shadvedangani','upsargah','visheshanam','shabdgyan','mool-sangeet-gyan','vadya-parichay','taal-pranali','raag-tatva','raag-adhyayan','vadya-adhyayan','sangeetagya-parichay','sangeet-siddhant','raag-vigyan','gayan-shailiyan','shruti-siddhant','varn-siddhant','gharana-adhyayan','sangeet-granth','itihas','swarlipi');
-- Expect 4 rows: 1 HTET_CDP, 14 HTET_MUS, 15 HTET_PED, 28 HTET_PSY:
SELECT id, section_id, slug FROM e_sections WHERE id IN (1,14,15,28);
-- Expect 0 rows (none of the new navigation rows exist yet):
SELECT id, section_id, entity_id FROM mapping_section_chapters WHERE (section_id=14 AND entity_id IN (223,224,225,226,228,229,230,231,233,234,235,236,240,241,242,243)) OR (section_id=15 AND entity_id=187) OR (section_id=1 AND entity_id=137);
-- Expect 2 rows (health-and-hygiene, theories-of-learning):
SELECT id, chapter_id, slug FROM s_chapters WHERE id IN (187,137);
-- Current last rows: HTET_PED order 14 (identifier 49), HTET_CDP order 7 (identifier 8):
SELECT section_id, MAX(`order`), MAX(identifier) FROM mapping_section_chapters WHERE section_id IN (1,15) GROUP BY section_id;

-- ===== 2. FIX =====
START TRANSACTION;

-- 2a. Groups A + C: chapter slugs (162 rows)
UPDATE s_chapters SET slug = CASE id
    WHEN 193 THEN 'introduction-to-art'  -- C_0193, 69 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/introduction-to-art
    WHEN 194 THEN 'fundamentals-of-visual-art'  -- C_0194, 88 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/fundamentals-of-visual-art
    WHEN 195 THEN 'shadanga-of-indian-art'  -- C_0195, 13 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/shadanga-of-indian-art
    WHEN 196 THEN 'techniques-in-art'  -- C_0196, 70 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/arts/techniques-in-art
    WHEN 197 THEN 'process-and-procedure-in-art'  -- C_0197, 24 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/process-and-procedure-in-art
    WHEN 198 THEN 'perspective'  -- C_0198, 6 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/perspective
    WHEN 199 THEN 'indian-folk-art'  -- C_0199, 39 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/arts/indian-folk-art
    WHEN 200 THEN 'indian-national-flag'  -- C_0200, 28 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/arts/indian-national-flag
    WHEN 201 THEN 'indian-art-history'  -- C_0201, 257 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/arts/indian-art-history
    WHEN 203 THEN 'history-and-foundations-of-physical-education'  -- C_0203, 17 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/history-and-foundations-of-physical-education
    WHEN 204 THEN 'biological-basis-and-personality'  -- C_0204, 84 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/biological-basis-and-personality
    WHEN 205 THEN 'health-hygiene-and-nutrition'  -- C_0205, 35 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/health-hygiene-and-nutrition
    WHEN 206 THEN 'school-health-injuries-and-rehabilitation'  -- C_0206, 43 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/physical-education/school-health-injuries-and-rehabilitation
    WHEN 207 THEN 'physical-fitness-wellness-and-cwsn'  -- C_0207, 9 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/physical-fitness-wellness-and-cwsn
    WHEN 208 THEN 'anatomy-and-physiology'  -- C_0208, 82 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/anatomy-and-physiology
    WHEN 209 THEN 'sports-performance-and-doping'  -- C_0209, 23 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/sports-performance-and-doping
    WHEN 210 THEN 'kinesiology-and-biomechanics'  -- C_0210, 25 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/kinesiology-and-biomechanics
    WHEN 211 THEN 'movement-analysis'  -- C_0211, 26 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/physical-education/movement-analysis
    WHEN 212 THEN 'sports-psychology-and-sociology'  -- C_0212, 47 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/physical-education/sports-psychology-and-sociology
    WHEN 213 THEN 'recreation-and-yoga-education'  -- C_0213, 45 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/recreation-and-yoga-education
    WHEN 214 THEN 'test-measurement-and-evaluation'  -- C_0214, 19 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/physical-education/test-measurement-and-evaluation
    WHEN 215 THEN 'games-sports-and-current-affairs'  -- C_0215, 141 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/games-sports-and-current-affairs
    WHEN 216 THEN 'sports-management-training-and-research'  -- C_0216, 74 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/physical-education/sports-management-training-and-research
    WHEN 217 THEN 'food-nutrition-and-health'  -- C_0217, 117 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/home-science/food-nutrition-and-health
    WHEN 218 THEN 'home-and-resource-management'  -- C_0218, 123 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/home-science/home-and-resource-management
    WHEN 219 THEN 'growth-development-and-clothing'  -- C_0219, 119 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/home-science/growth-development-and-clothing
    WHEN 220 THEN 'advanced-food-and-nutrition'  -- C_0220, 62 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/home-science/advanced-food-and-nutrition
    WHEN 221 THEN 'human-development-home-science'  -- C_0221, 75 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/home-science/human-development-home-science
    WHEN 222 THEN 'textiles-and-communication'  -- C_0222, 82 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/home-science/textiles-and-communication
    WHEN 245 THEN 'business-trade-and-commerce'  -- C_0245, 13 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/business-trade-and-commerce
    WHEN 246 THEN 'business-services-and-emerging-modes'  -- C_0246, 29 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/business-services-and-emerging-modes
    WHEN 247 THEN 'nature-and-significance-of-management'  -- C_0247, 22 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/nature-and-significance-of-management
    WHEN 248 THEN 'business-environment-and-planning'  -- C_0248, 6 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/business-environment-and-planning
    WHEN 249 THEN 'organising-staffing-directing-and-controlling'  -- C_0249, 52 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/organising-staffing-directing-and-controlling
    WHEN 250 THEN 'business-finance-and-marketing'  -- C_0250, 76 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/business-finance-and-marketing
    WHEN 251 THEN 'introduction-to-accounting'  -- C_0251, 23 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/introduction-to-accounting
    WHEN 252 THEN 'recording-of-transactions-i'  -- C_0252, 4 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/recording-of-transactions-i
    WHEN 253 THEN 'recording-of-transactions-ii'  -- C_0253, 5 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/recording-of-transactions-ii
    WHEN 255 THEN 'trial-balance-and-rectification-of-errors'  -- C_0255, 7 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/trial-balance-and-rectification-of-errors
    WHEN 256 THEN 'depreciation-provisions-and-reserves'  -- C_0256, 12 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/depreciation-provisions-and-reserves
    WHEN 258 THEN 'partnership-accounting'  -- C_0258, 27 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/partnership-accounting
    WHEN 259 THEN 'company-accounts-and-analysis'  -- C_0259, 24 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/company-accounts-and-analysis
    WHEN 260 THEN 'computerised-accounting-and-trade-environment'  -- C_0260, 57 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/commerce/computerised-accounting-and-trade-environment
    WHEN 271 THEN 'arithmetic-algebra-and-trigonometry'  -- C_0271, 41 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/arithmetic-algebra-and-trigonometry
    WHEN 272 THEN 'geometry-and-mensuration'  -- C_0272, 6 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/geometry-and-mensuration
    WHEN 273 THEN 'statistics-and-probability'  -- C_0273, 21 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/statistics-and-probability
    WHEN 274 THEN 'sets-relations-and-functions'  -- C_0274, 37 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/sets-relations-and-functions
    WHEN 275 THEN 'algebra-mathematics'  -- C_0275, 64 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/algebra-mathematics
    WHEN 276 THEN 'calculus'  -- C_0276, 87 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/calculus
    WHEN 277 THEN 'vectors-and-coordinate-geometry'  -- C_0277, 94 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/mathematics/vectors-and-coordinate-geometry
    WHEN 278 THEN 'fundamental-concepts-of-chemistry'  -- C_0278, 3 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/fundamental-concepts-of-chemistry
    WHEN 279 THEN 'atomic-structure-and-periodicity'  -- C_0279, 15 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/atomic-structure-and-periodicity
    WHEN 280 THEN 'chemical-bonding-and-thermodynamics'  -- C_0280, 45 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/chemical-bonding-and-thermodynamics
    WHEN 281 THEN 'organic-chemistry-basic-principles'  -- C_0281, 26 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/organic-chemistry-basic-principles
    WHEN 282 THEN 'physical-chemistry-applications'  -- C_0282, 45 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/physical-chemistry-applications
    WHEN 283 THEN 'inorganic-chemistry-advanced'  -- C_0283, 31 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/inorganic-chemistry-advanced
    WHEN 284 THEN 'organic-chemistry-functional-groups'  -- C_0284, 68 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/organic-chemistry-functional-groups
    WHEN 285 THEN 'applied-and-interdisciplinary-chemistry'  -- C_0285, 10 q: /htet/level-1-prt/subject/chemistry -> /htet/level-1-prt/subject/chemistry/applied-and-interdisciplinary-chemistry
    WHEN 286 THEN 'cell-biology-and-biomolecules'  -- C_0286, 8 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/cell-biology-and-biomolecules
    WHEN 287 THEN 'plant-biology-structure-and-diversity'  -- C_0287, 67 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/plant-biology-structure-and-diversity
    WHEN 288 THEN 'plant-physiology'  -- C_0288, 9 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/plant-physiology
    WHEN 289 THEN 'animal-biology-structure-and-diversity'  -- C_0289, 50 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/animal-biology-structure-and-diversity
    WHEN 290 THEN 'human-physiology'  -- C_0290, 30 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/human-physiology
    WHEN 291 THEN 'biology-in-human-welfare'  -- C_0291, 18 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/biology-in-human-welfare
    WHEN 292 THEN 'ecology-and-environment'  -- C_0292, 16 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/ecology-and-environment
    WHEN 293 THEN 'genetics-and-evolution'  -- C_0293, 43 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/genetics-and-evolution
    WHEN 294 THEN 'biotechnology'  -- C_0294, 17 q: /htet/level-1-prt/subject/biology -> /htet/level-1-prt/subject/biology/biotechnology
    WHEN 295 THEN 'kavyashastra'  -- C_0295, 83 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/kavyashastra
    WHEN 296 THEN 'agyeya'  -- C_0296, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/agyeya
    WHEN 298 THEN 'amritlal-vegad'  -- C_0298, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/amritlal-vegad
    WHEN 299 THEN 'acharya-ramchandra-shukla'  -- C_0299, 261 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/acharya-ramchandra-shukla
    WHEN 300 THEN 'acharya-nanddulare-vajpeyi'  -- C_0300, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/acharya-nanddulare-vajpeyi
    WHEN 302 THEN 'alok-dhanwa'  -- C_0302, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/alok-dhanwa
    WHEN 304 THEN 'om-prakash-valmiki'  -- C_0304, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/om-prakash-valmiki
    WHEN 305 THEN 'kabir'  -- C_0305, 5 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/kabir
    WHEN 308 THEN 'kunwar-narayan'  -- C_0308, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/kunwar-narayan
    WHEN 309 THEN 'krishna-sobti'  -- C_0309, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/krishna-sobti
    WHEN 312 THEN 'keshavdas'  -- C_0312, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/keshavdas
    WHEN 313 THEN 'gajanan-madhav-muktibodh'  -- C_0313, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/gajanan-madhav-muktibodh
    WHEN 315 THEN 'chandbardai'  -- C_0315, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/chandbardai
    WHEN 317 THEN 'jaishankar-prasad'  -- C_0317, 3 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/jaishankar-prasad
    WHEN 318 THEN 'jainendra-kumar'  -- C_0318, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/jainendra-kumar
    WHEN 320 THEN 'dr-nagendra'  -- C_0320, 3 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/dr-nagendra
    WHEN 321 THEN 'tulsidas'  -- C_0321, 5 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/tulsidas
    WHEN 329 THEN 'nanddulare-vajpeyi'  -- C_0329, 6 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/nanddulare-vajpeyi
    WHEN 331 THEN 'namvar-singh'  -- C_0331, 9 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/namvar-singh
    WHEN 334 THEN 'premchand'  -- C_0334, 6 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/premchand
    WHEN 337 THEN 'balmukund-gupt'  -- C_0337, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/balmukund-gupt
    WHEN 338 THEN 'bihari'  -- C_0338, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/bihari
    WHEN 340 THEN 'bhavani-prasad-mishra'  -- C_0340, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/bhavani-prasad-mishra
    WHEN 343 THEN 'bhisham-sahni'  -- C_0343, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/bhisham-sahni
    WHEN 345 THEN 'manglesh-dabral'  -- C_0345, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/manglesh-dabral
    WHEN 346 THEN 'manohar-shyam-joshi'  -- C_0346, 3 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/manohar-shyam-joshi
    WHEN 347 THEN 'mannu-bhandari'  -- C_0347, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/mannu-bhandari
    WHEN 349 THEN 'malik-mohammad-jayasi'  -- C_0349, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/malik-mohammad-jayasi
    WHEN 350 THEN 'mahadevi-verma'  -- C_0350, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/mahadevi-verma
    WHEN 353 THEN 'maithilisharan-gupt'  -- C_0353, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/maithilisharan-gupt
    WHEN 354 THEN 'mohan-rakesh'  -- C_0354, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/mohan-rakesh
    WHEN 356 THEN 'raghuvir-sahay'  -- C_0356, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/raghuvir-sahay
    WHEN 357 THEN 'ramnika-gupta'  -- C_0357, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/ramnika-gupta
    WHEN 361 THEN 'ramvilas-sharma'  -- C_0361, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/ramvilas-sharma
    WHEN 367 THEN 'vishwanath-tripathi'  -- C_0367, 7 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/vishwanath-tripathi
    WHEN 368 THEN 'vishnu-prabhakar'  -- C_0368, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/vishnu-prabhakar
    WHEN 378 THEN 'suryakant-tripathi-nirala'  -- C_0378, 4 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/suryakant-tripathi-nirala
    WHEN 380 THEN 'hazari-prasad-dwivedi'  -- C_0380, 2 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/hazari-prasad-dwivedi
    WHEN 381 THEN 'hariaudh'  -- C_0381, 1 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/hariaudh
    WHEN 383 THEN 'harishankar-parsai'  -- C_0383, 4 q: /htet/level-1-prt/subject/hindi -> /htet/level-1-prt/subject/hindi/harishankar-parsai
    WHEN 384 THEN 'introduction-to-economics'  -- C_0384, 5 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/introduction-to-economics
    WHEN 385 THEN 'statistics-for-economics'  -- C_0385, 50 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/statistics-for-economics
    WHEN 386 THEN 'indian-economy-development'  -- C_0386, 16 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/indian-economy-development
    WHEN 387 THEN 'indian-economic-issues'  -- C_0387, 38 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/indian-economic-issues
    WHEN 388 THEN 'micro-economics-consumer-behaviour'  -- C_0388, 10 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/micro-economics-consumer-behaviour
    WHEN 389 THEN 'demand-and-production'  -- C_0389, 25 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/demand-and-production
    WHEN 390 THEN 'revenue-and-market-structure'  -- C_0390, 15 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/revenue-and-market-structure
    WHEN 391 THEN 'macroeconomics-income-and-employment'  -- C_0391, 4 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/macroeconomics-income-and-employment
    WHEN 392 THEN 'money-and-banking'  -- C_0392, 6 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/money-and-banking
    WHEN 393 THEN 'macro-policy-and-external-sector'  -- C_0393, 38 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/economics/macro-policy-and-external-sector
    WHEN 394 THEN 'computer-system-and-hardware-fundamentals'  -- C_0394, 62 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/computer-system-and-hardware-fundamentals
    WHEN 395 THEN 'operating-systems-and-software-concepts'  -- C_0395, 32 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/operating-systems-and-software-concepts
    WHEN 396 THEN 'office-automation-tools'  -- C_0396, 55 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/office-automation-tools
    WHEN 397 THEN 'software-engineering-and-problem-solving'  -- C_0397, 25 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/software-engineering-and-problem-solving
    WHEN 398 THEN 'python-programming-fundamentals'  -- C_0398, 13 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/python-programming-fundamentals
    WHEN 399 THEN 'object-oriented-programming-cpp'  -- C_0399, 23 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/object-oriented-programming-cpp
    WHEN 400 THEN 'data-structures-through-cpp'  -- C_0400, 18 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/data-structures-through-cpp
    WHEN 401 THEN 'database-management-system-dbms-and-sql'  -- C_0401, 45 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/database-management-system-dbms-and-sql
    WHEN 402 THEN 'computer-networks-and-internet'  -- C_0402, 41 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/computer-networks-and-internet
    WHEN 403 THEN 'web-designing-using-html'  -- C_0403, 24 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/web-designing-using-html
    WHEN 404 THEN 'cyber-security-ethics-and-emerging-trends'  -- C_0404, 10 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/cyber-security-ethics-and-emerging-trends
    WHEN 405 THEN 'pedagogy-computer-science'  -- C_0405, 1 q: /htet/level-3-pgt -> /htet/level-1-prt/subject/computer-science/pedagogy-computer-science
    WHEN 406 THEN 'sangya'  -- C_0406, 15 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/sangya
    WHEN 407 THEN 'sandheh-sutrani'  -- C_0407, 4 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/sandheh-sutrani
    WHEN 408 THEN 'samasah'  -- C_0408, 34 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/samasah
    WHEN 409 THEN 'pratyayanam'  -- C_0409, 22 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/pratyayanam
    WHEN 410 THEN 'vyayapad'  -- C_0410, 17 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/vyayapad
    WHEN 411 THEN 'karakprakaranam'  -- C_0411, 31 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/karakprakaranam
    WHEN 412 THEN 'chhandansi'  -- C_0412, 2 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/chhandansi
    WHEN 413 THEN 'alankarah'  -- C_0413, 11 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/alankarah
    WHEN 414 THEN 'mahakavayah'  -- C_0414, 25 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/mahakavayah
    WHEN 415 THEN 'gadyakavyakavayah'  -- C_0415, 11 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/gadyakavyakavayah
    WHEN 416 THEN 'neetikavayah'  -- C_0416, 4 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/neetikavayah
    WHEN 417 THEN 'kavyashastrakarah'  -- C_0417, 8 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/kavyashastrakarah
    WHEN 418 THEN 'adhuniksanskritkavayah'  -- C_0418, 6 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/adhuniksanskritkavayah
    WHEN 419 THEN 'shadvedangani'  -- C_0419, 78 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/shadvedangani
    WHEN 420 THEN 'upsargah'  -- C_0420, 6 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/upsargah
    WHEN 421 THEN 'visheshanam'  -- C_0421, 5 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/visheshanam
    WHEN 422 THEN 'shabdgyan'  -- C_0422, 3 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/sanskrit/shabdgyan
    WHEN 223 THEN 'mool-sangeet-gyan'  -- C_0223, 135 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/mool-sangeet-gyan
    WHEN 224 THEN 'vadya-parichay'  -- C_0224, 17 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/vadya-parichay
    WHEN 225 THEN 'taal-pranali'  -- C_0225, 17 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/taal-pranali
    WHEN 226 THEN 'raag-tatva'  -- C_0226, 8 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/raag-tatva
    WHEN 228 THEN 'raag-adhyayan'  -- C_0228, 1 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/raag-adhyayan
    WHEN 229 THEN 'vadya-adhyayan'  -- C_0229, 15 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/vadya-adhyayan
    WHEN 230 THEN 'sangeetagya-parichay'  -- C_0230, 11 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/sangeetagya-parichay
    WHEN 231 THEN 'sangeet-siddhant'  -- C_0231, 8 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/sangeet-siddhant
    WHEN 233 THEN 'raag-vigyan'  -- C_0233, 21 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/raag-vigyan
    WHEN 234 THEN 'gayan-shailiyan'  -- C_0234, 14 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/gayan-shailiyan
    WHEN 235 THEN 'shruti-siddhant'  -- C_0235, 12 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/shruti-siddhant
    WHEN 236 THEN 'varn-siddhant'  -- C_0236, 3 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/varn-siddhant
    WHEN 240 THEN 'gharana-adhyayan'  -- C_0240, 11 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/gharana-adhyayan
    WHEN 241 THEN 'sangeet-granth'  -- C_0241, 19 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/sangeet-granth
    WHEN 242 THEN 'itihas'  -- C_0242, 2 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/itihas
    WHEN 243 THEN 'swarlipi'  -- C_0243, 6 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/music/swarlipi
  END, updated_at = NOW()
WHERE id IN (193,194,195,196,197,198,199,200,201,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,245,246,247,248,249,250,251,252,253,255,256,258,259,260,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,298,299,300,302,304,305,308,309,312,313,315,317,318,320,321,329,331,334,337,338,340,343,345,346,347,349,350,353,354,356,357,361,367,368,378,380,381,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,223,224,225,226,228,229,230,231,233,234,235,236,240,241,242,243) AND slug IS NULL;
-- expect: 162 rows affected

-- 2b. Group C: music chapters into HTET_MUS navigation (order = chapter order)
INSERT INTO mapping_section_chapters (uuid, section_id, entity_type, entity_id, `order`, metadata, identifier, created_at, updated_at) VALUES
  ('c876242f-b69d-5f07-b15e-2cbd06a7fe38', 14, 'App\\Models\\SChapter', 223, 1, NULL, NULL, NOW(), NOW()),
  ('a8f82975-0212-5278-8452-7b5b95c1c219', 14, 'App\\Models\\SChapter', 224, 2, NULL, NULL, NOW(), NOW()),
  ('eade6baf-5a93-5c9f-9fee-9ca7f4450f88', 14, 'App\\Models\\SChapter', 225, 3, NULL, NULL, NOW(), NOW()),
  ('7f32c25f-5c81-5209-af1a-c66e7ae78686', 14, 'App\\Models\\SChapter', 226, 4, NULL, NULL, NOW(), NOW()),
  ('67b7294d-3323-5c25-9d17-c4065e838d3d', 14, 'App\\Models\\SChapter', 228, 5, NULL, NULL, NOW(), NOW()),
  ('e56842e8-5f0d-51e0-a5ba-61ada62df2ed', 14, 'App\\Models\\SChapter', 229, 6, NULL, NULL, NOW(), NOW()),
  ('9f51e516-9594-50d9-83e6-948465ca98b7', 14, 'App\\Models\\SChapter', 230, 7, NULL, NULL, NOW(), NOW()),
  ('ea202205-0702-5fa7-bc8a-77ed7a9ed032', 14, 'App\\Models\\SChapter', 231, 8, NULL, NULL, NOW(), NOW()),
  ('71421ba1-6199-572a-8bd4-bb068af1ed98', 14, 'App\\Models\\SChapter', 233, 9, NULL, NULL, NOW(), NOW()),
  ('0ce8a7fd-d4d6-5a80-b0c9-fdc8f5bc0567', 14, 'App\\Models\\SChapter', 234, 10, NULL, NULL, NOW(), NOW()),
  ('ed3a4b6e-f8f0-5866-8fb2-441ef8143399', 14, 'App\\Models\\SChapter', 235, 11, NULL, NULL, NOW(), NOW()),
  ('ae27f980-039f-5e0e-8292-82b0e1b4f27c', 14, 'App\\Models\\SChapter', 236, 12, NULL, NULL, NOW(), NOW()),
  ('2daa55d1-b3ab-579f-8aee-84f2ff8871f2', 14, 'App\\Models\\SChapter', 240, 13, NULL, NULL, NOW(), NOW()),
  ('9af08e3f-fa3f-5dad-a3fa-3739a1a62e2d', 14, 'App\\Models\\SChapter', 241, 14, NULL, NULL, NOW(), NOW()),
  ('17bc98ab-d93e-5cad-95ce-c096a8f3f087', 14, 'App\\Models\\SChapter', 242, 15, NULL, NULL, NOW(), NOW()),
  ('003fda5d-0edc-55c7-9640-c38b6d0f2d53', 14, 'App\\Models\\SChapter', 243, 16, NULL, NULL, NOW(), NOW());
-- expect: 16 rows affected

-- 2c. Group D: the 2 chapters missing from navigation (same identifier as their section's rows,
--     so a later BigQuery mapping sync updates these rows instead of adding duplicates)
INSERT INTO mapping_section_chapters (uuid, section_id, entity_type, entity_id, `order`, metadata, identifier, created_at, updated_at) VALUES
  ('6046513a-4342-538a-a755-8352851e13cb', 15, 'App\\Models\\SChapter', 187, 15, NULL, '49', NOW(), NOW()),  -- health-and-hygiene, 18 q: /htet/level-2-tgt -> /htet/level-1-prt/subject/physical-education/health-and-hygiene
  ('0c9da577-5cdb-54e7-83e8-c0851dc63b8f', 1, 'App\\Models\\SChapter', 137, 8, NULL, '8', NOW(), NOW());    -- theories-of-learning, 2 q: /htet/level-1-prt/subject/child-development-pedagogy -> /htet/level-1-prt/subject/child-development-pedagogy/theories-of-learning
-- expect: 2 rows affected

-- Check before COMMIT: expect 162, then 18
SELECT COUNT(*) FROM s_chapters WHERE id IN (193,194,195,196,197,198,199,200,201,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,245,246,247,248,249,250,251,252,253,255,256,258,259,260,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,298,299,300,302,304,305,308,309,312,313,315,317,318,320,321,329,331,334,337,338,340,343,345,346,347,349,350,353,354,356,357,361,367,368,378,380,381,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,223,224,225,226,228,229,230,231,233,234,235,236,240,241,242,243) AND slug IS NOT NULL;
SELECT COUNT(*) FROM mapping_section_chapters WHERE uuid IN ('c876242f-b69d-5f07-b15e-2cbd06a7fe38','a8f82975-0212-5278-8452-7b5b95c1c219','eade6baf-5a93-5c9f-9fee-9ca7f4450f88','7f32c25f-5c81-5209-af1a-c66e7ae78686','67b7294d-3323-5c25-9d17-c4065e838d3d','e56842e8-5f0d-51e0-a5ba-61ada62df2ed','9f51e516-9594-50d9-83e6-948465ca98b7','ea202205-0702-5fa7-bc8a-77ed7a9ed032','71421ba1-6199-572a-8bd4-bb068af1ed98','0ce8a7fd-d4d6-5a80-b0c9-fdc8f5bc0567','ed3a4b6e-f8f0-5866-8fb2-441ef8143399','ae27f980-039f-5e0e-8292-82b0e1b4f27c','2daa55d1-b3ab-579f-8aee-84f2ff8871f2','9af08e3f-fa3f-5dad-a3fa-3739a1a62e2d','17bc98ab-d93e-5cad-95ce-c096a8f3f087','003fda5d-0edc-55c7-9640-c38b6d0f2d53','6046513a-4342-538a-a755-8352851e13cb','0c9da577-5cdb-54e7-83e8-c0851dc63b8f');
COMMIT;  -- or ROLLBACK; if a count is off

-- ===== 3. AFTER COMMIT: drop the cached blog data (backend server terminal) =====
-- php artisan tinker --execute="print_r(app(\App\Services\Blog\QuestionCacheService::class)->invalidate(['htet'], 'phase126 chapter slugs'));"
-- (bumps the question cache version and calls the blog's /api/revalidate for htet). Without it the
-- backend serves the old index for up to 1 h and the blog's exam index/sitemaps for up to 24 h.

-- ===== 4. ROLLBACK (undo exactly this change) =====
-- START TRANSACTION;
-- DELETE FROM mapping_section_chapters WHERE uuid IN ('c876242f-b69d-5f07-b15e-2cbd06a7fe38','a8f82975-0212-5278-8452-7b5b95c1c219','eade6baf-5a93-5c9f-9fee-9ca7f4450f88','7f32c25f-5c81-5209-af1a-c66e7ae78686','67b7294d-3323-5c25-9d17-c4065e838d3d','e56842e8-5f0d-51e0-a5ba-61ada62df2ed','9f51e516-9594-50d9-83e6-948465ca98b7','ea202205-0702-5fa7-bc8a-77ed7a9ed032','71421ba1-6199-572a-8bd4-bb068af1ed98','0ce8a7fd-d4d6-5a80-b0c9-fdc8f5bc0567','ed3a4b6e-f8f0-5866-8fb2-441ef8143399','ae27f980-039f-5e0e-8292-82b0e1b4f27c','2daa55d1-b3ab-579f-8aee-84f2ff8871f2','9af08e3f-fa3f-5dad-a3fa-3739a1a62e2d','17bc98ab-d93e-5cad-95ce-c096a8f3f087','003fda5d-0edc-55c7-9640-c38b6d0f2d53','6046513a-4342-538a-a755-8352851e13cb','0c9da577-5cdb-54e7-83e8-c0851dc63b8f');
-- UPDATE s_chapters SET slug = NULL WHERE id IN (193,194,195,196,197,198,199,200,201,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,245,246,247,248,249,250,251,252,253,255,256,258,259,260,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,298,299,300,302,304,305,308,309,312,313,315,317,318,320,321,329,331,334,337,338,340,343,345,346,347,349,350,353,354,356,357,361,367,368,378,380,381,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,223,224,225,226,228,229,230,231,233,234,235,236,240,241,242,243) AND slug IN ('introduction-to-art','fundamentals-of-visual-art','shadanga-of-indian-art','techniques-in-art','process-and-procedure-in-art','perspective','indian-folk-art','indian-national-flag','indian-art-history','history-and-foundations-of-physical-education','biological-basis-and-personality','health-hygiene-and-nutrition','school-health-injuries-and-rehabilitation','physical-fitness-wellness-and-cwsn','anatomy-and-physiology','sports-performance-and-doping','kinesiology-and-biomechanics','movement-analysis','sports-psychology-and-sociology','recreation-and-yoga-education','test-measurement-and-evaluation','games-sports-and-current-affairs','sports-management-training-and-research','food-nutrition-and-health','home-and-resource-management','growth-development-and-clothing','advanced-food-and-nutrition','human-development-home-science','textiles-and-communication','business-trade-and-commerce','business-services-and-emerging-modes','nature-and-significance-of-management','business-environment-and-planning','organising-staffing-directing-and-controlling','business-finance-and-marketing','introduction-to-accounting','recording-of-transactions-i','recording-of-transactions-ii','trial-balance-and-rectification-of-errors','depreciation-provisions-and-reserves','partnership-accounting','company-accounts-and-analysis','computerised-accounting-and-trade-environment','arithmetic-algebra-and-trigonometry','geometry-and-mensuration','statistics-and-probability','sets-relations-and-functions','algebra-mathematics','calculus','vectors-and-coordinate-geometry','fundamental-concepts-of-chemistry','atomic-structure-and-periodicity','chemical-bonding-and-thermodynamics','organic-chemistry-basic-principles','physical-chemistry-applications','inorganic-chemistry-advanced','organic-chemistry-functional-groups','applied-and-interdisciplinary-chemistry','cell-biology-and-biomolecules','plant-biology-structure-and-diversity','plant-physiology','animal-biology-structure-and-diversity','human-physiology','biology-in-human-welfare','ecology-and-environment','genetics-and-evolution','biotechnology','kavyashastra','agyeya','amritlal-vegad','acharya-ramchandra-shukla','acharya-nanddulare-vajpeyi','alok-dhanwa','om-prakash-valmiki','kabir','kunwar-narayan','krishna-sobti','keshavdas','gajanan-madhav-muktibodh','chandbardai','jaishankar-prasad','jainendra-kumar','dr-nagendra','tulsidas','nanddulare-vajpeyi','namvar-singh','premchand','balmukund-gupt','bihari','bhavani-prasad-mishra','bhisham-sahni','manglesh-dabral','manohar-shyam-joshi','mannu-bhandari','malik-mohammad-jayasi','mahadevi-verma','maithilisharan-gupt','mohan-rakesh','raghuvir-sahay','ramnika-gupta','ramvilas-sharma','vishwanath-tripathi','vishnu-prabhakar','suryakant-tripathi-nirala','hazari-prasad-dwivedi','hariaudh','harishankar-parsai','introduction-to-economics','statistics-for-economics','indian-economy-development','indian-economic-issues','micro-economics-consumer-behaviour','demand-and-production','revenue-and-market-structure','macroeconomics-income-and-employment','money-and-banking','macro-policy-and-external-sector','computer-system-and-hardware-fundamentals','operating-systems-and-software-concepts','office-automation-tools','software-engineering-and-problem-solving','python-programming-fundamentals','object-oriented-programming-cpp','data-structures-through-cpp','database-management-system-dbms-and-sql','computer-networks-and-internet','web-designing-using-html','cyber-security-ethics-and-emerging-trends','pedagogy-computer-science','sangya','sandheh-sutrani','samasah','pratyayanam','vyayapad','karakprakaranam','chhandansi','alankarah','mahakavayah','gadyakavyakavayah','neetikavayah','kavyashastrakarah','adhuniksanskritkavayah','shadvedangani','upsargah','visheshanam','shabdgyan','mool-sangeet-gyan','vadya-parichay','taal-pranali','raag-tatva','raag-adhyayan','vadya-adhyayan','sangeetagya-parichay','sangeet-siddhant','raag-vigyan','gayan-shailiyan','shruti-siddhant','varn-siddhant','gharana-adhyayan','sangeet-granth','itihas','swarlipi');
-- COMMIT;  -- then run section 3 again

-- ===== 5. BIGQUERY (source of truth for s_chapters.slug) - run in the BigQuery console =====
-- Preview: SELECT chapter_id, ai_slug, chapter_name FROM `clear-cutoff-435016.staging.s_chapter` WHERE chapter_id IN ('C_0193','C_0194','C_0195','C_0196','C_0197','C_0198','C_0199','C_0200','C_0201','C_0203','C_0204','C_0205','C_0206','C_0207','C_0208','C_0209','C_0210','C_0211','C_0212','C_0213','C_0214','C_0215','C_0216','C_0217','C_0218','C_0219','C_0220','C_0221','C_0222','C_0245','C_0246','C_0247','C_0248','C_0249','C_0250','C_0251','C_0252','C_0253','C_0255','C_0256','C_0258','C_0259','C_0260','C_0271','C_0272','C_0273','C_0274','C_0275','C_0276','C_0277','C_0278','C_0279','C_0280','C_0281','C_0282','C_0283','C_0284','C_0285','C_0286','C_0287','C_0288','C_0289','C_0290','C_0291','C_0292','C_0293','C_0294','C_0295','C_0296','C_0298','C_0299','C_0300','C_0302','C_0304','C_0305','C_0308','C_0309','C_0312','C_0313','C_0315','C_0317','C_0318','C_0320','C_0321','C_0329','C_0331','C_0334','C_0337','C_0338','C_0340','C_0343','C_0345','C_0346','C_0347','C_0349','C_0350','C_0353','C_0354','C_0356','C_0357','C_0361','C_0367','C_0368','C_0378','C_0380','C_0381','C_0383','C_0384','C_0385','C_0386','C_0387','C_0388','C_0389','C_0390','C_0391','C_0392','C_0393','C_0394','C_0395','C_0396','C_0397','C_0398','C_0399','C_0400','C_0401','C_0402','C_0403','C_0404','C_0405','C_0406','C_0407','C_0408','C_0409','C_0410','C_0411','C_0412','C_0413','C_0414','C_0415','C_0416','C_0417','C_0418','C_0419','C_0420','C_0421','C_0422','C_0223','C_0224','C_0225','C_0226','C_0228','C_0229','C_0230','C_0231','C_0233','C_0234','C_0235','C_0236','C_0240','C_0241','C_0242','C_0243');
UPDATE `clear-cutoff-435016.staging.s_chapter` SET ai_slug = CASE chapter_id
    WHEN 'C_0193' THEN 'introduction-to-art'
    WHEN 'C_0194' THEN 'fundamentals-of-visual-art'
    WHEN 'C_0195' THEN 'shadanga-of-indian-art'
    WHEN 'C_0196' THEN 'techniques-in-art'
    WHEN 'C_0197' THEN 'process-and-procedure-in-art'
    WHEN 'C_0198' THEN 'perspective'
    WHEN 'C_0199' THEN 'indian-folk-art'
    WHEN 'C_0200' THEN 'indian-national-flag'
    WHEN 'C_0201' THEN 'indian-art-history'
    WHEN 'C_0203' THEN 'history-and-foundations-of-physical-education'
    WHEN 'C_0204' THEN 'biological-basis-and-personality'
    WHEN 'C_0205' THEN 'health-hygiene-and-nutrition'
    WHEN 'C_0206' THEN 'school-health-injuries-and-rehabilitation'
    WHEN 'C_0207' THEN 'physical-fitness-wellness-and-cwsn'
    WHEN 'C_0208' THEN 'anatomy-and-physiology'
    WHEN 'C_0209' THEN 'sports-performance-and-doping'
    WHEN 'C_0210' THEN 'kinesiology-and-biomechanics'
    WHEN 'C_0211' THEN 'movement-analysis'
    WHEN 'C_0212' THEN 'sports-psychology-and-sociology'
    WHEN 'C_0213' THEN 'recreation-and-yoga-education'
    WHEN 'C_0214' THEN 'test-measurement-and-evaluation'
    WHEN 'C_0215' THEN 'games-sports-and-current-affairs'
    WHEN 'C_0216' THEN 'sports-management-training-and-research'
    WHEN 'C_0217' THEN 'food-nutrition-and-health'
    WHEN 'C_0218' THEN 'home-and-resource-management'
    WHEN 'C_0219' THEN 'growth-development-and-clothing'
    WHEN 'C_0220' THEN 'advanced-food-and-nutrition'
    WHEN 'C_0221' THEN 'human-development-home-science'
    WHEN 'C_0222' THEN 'textiles-and-communication'
    WHEN 'C_0245' THEN 'business-trade-and-commerce'
    WHEN 'C_0246' THEN 'business-services-and-emerging-modes'
    WHEN 'C_0247' THEN 'nature-and-significance-of-management'
    WHEN 'C_0248' THEN 'business-environment-and-planning'
    WHEN 'C_0249' THEN 'organising-staffing-directing-and-controlling'
    WHEN 'C_0250' THEN 'business-finance-and-marketing'
    WHEN 'C_0251' THEN 'introduction-to-accounting'
    WHEN 'C_0252' THEN 'recording-of-transactions-i'
    WHEN 'C_0253' THEN 'recording-of-transactions-ii'
    WHEN 'C_0255' THEN 'trial-balance-and-rectification-of-errors'
    WHEN 'C_0256' THEN 'depreciation-provisions-and-reserves'
    WHEN 'C_0258' THEN 'partnership-accounting'
    WHEN 'C_0259' THEN 'company-accounts-and-analysis'
    WHEN 'C_0260' THEN 'computerised-accounting-and-trade-environment'
    WHEN 'C_0271' THEN 'arithmetic-algebra-and-trigonometry'
    WHEN 'C_0272' THEN 'geometry-and-mensuration'
    WHEN 'C_0273' THEN 'statistics-and-probability'
    WHEN 'C_0274' THEN 'sets-relations-and-functions'
    WHEN 'C_0275' THEN 'algebra-mathematics'
    WHEN 'C_0276' THEN 'calculus'
    WHEN 'C_0277' THEN 'vectors-and-coordinate-geometry'
    WHEN 'C_0278' THEN 'fundamental-concepts-of-chemistry'
    WHEN 'C_0279' THEN 'atomic-structure-and-periodicity'
    WHEN 'C_0280' THEN 'chemical-bonding-and-thermodynamics'
    WHEN 'C_0281' THEN 'organic-chemistry-basic-principles'
    WHEN 'C_0282' THEN 'physical-chemistry-applications'
    WHEN 'C_0283' THEN 'inorganic-chemistry-advanced'
    WHEN 'C_0284' THEN 'organic-chemistry-functional-groups'
    WHEN 'C_0285' THEN 'applied-and-interdisciplinary-chemistry'
    WHEN 'C_0286' THEN 'cell-biology-and-biomolecules'
    WHEN 'C_0287' THEN 'plant-biology-structure-and-diversity'
    WHEN 'C_0288' THEN 'plant-physiology'
    WHEN 'C_0289' THEN 'animal-biology-structure-and-diversity'
    WHEN 'C_0290' THEN 'human-physiology'
    WHEN 'C_0291' THEN 'biology-in-human-welfare'
    WHEN 'C_0292' THEN 'ecology-and-environment'
    WHEN 'C_0293' THEN 'genetics-and-evolution'
    WHEN 'C_0294' THEN 'biotechnology'
    WHEN 'C_0295' THEN 'kavyashastra'
    WHEN 'C_0296' THEN 'agyeya'
    WHEN 'C_0298' THEN 'amritlal-vegad'
    WHEN 'C_0299' THEN 'acharya-ramchandra-shukla'
    WHEN 'C_0300' THEN 'acharya-nanddulare-vajpeyi'
    WHEN 'C_0302' THEN 'alok-dhanwa'
    WHEN 'C_0304' THEN 'om-prakash-valmiki'
    WHEN 'C_0305' THEN 'kabir'
    WHEN 'C_0308' THEN 'kunwar-narayan'
    WHEN 'C_0309' THEN 'krishna-sobti'
    WHEN 'C_0312' THEN 'keshavdas'
    WHEN 'C_0313' THEN 'gajanan-madhav-muktibodh'
    WHEN 'C_0315' THEN 'chandbardai'
    WHEN 'C_0317' THEN 'jaishankar-prasad'
    WHEN 'C_0318' THEN 'jainendra-kumar'
    WHEN 'C_0320' THEN 'dr-nagendra'
    WHEN 'C_0321' THEN 'tulsidas'
    WHEN 'C_0329' THEN 'nanddulare-vajpeyi'
    WHEN 'C_0331' THEN 'namvar-singh'
    WHEN 'C_0334' THEN 'premchand'
    WHEN 'C_0337' THEN 'balmukund-gupt'
    WHEN 'C_0338' THEN 'bihari'
    WHEN 'C_0340' THEN 'bhavani-prasad-mishra'
    WHEN 'C_0343' THEN 'bhisham-sahni'
    WHEN 'C_0345' THEN 'manglesh-dabral'
    WHEN 'C_0346' THEN 'manohar-shyam-joshi'
    WHEN 'C_0347' THEN 'mannu-bhandari'
    WHEN 'C_0349' THEN 'malik-mohammad-jayasi'
    WHEN 'C_0350' THEN 'mahadevi-verma'
    WHEN 'C_0353' THEN 'maithilisharan-gupt'
    WHEN 'C_0354' THEN 'mohan-rakesh'
    WHEN 'C_0356' THEN 'raghuvir-sahay'
    WHEN 'C_0357' THEN 'ramnika-gupta'
    WHEN 'C_0361' THEN 'ramvilas-sharma'
    WHEN 'C_0367' THEN 'vishwanath-tripathi'
    WHEN 'C_0368' THEN 'vishnu-prabhakar'
    WHEN 'C_0378' THEN 'suryakant-tripathi-nirala'
    WHEN 'C_0380' THEN 'hazari-prasad-dwivedi'
    WHEN 'C_0381' THEN 'hariaudh'
    WHEN 'C_0383' THEN 'harishankar-parsai'
    WHEN 'C_0384' THEN 'introduction-to-economics'
    WHEN 'C_0385' THEN 'statistics-for-economics'
    WHEN 'C_0386' THEN 'indian-economy-development'
    WHEN 'C_0387' THEN 'indian-economic-issues'
    WHEN 'C_0388' THEN 'micro-economics-consumer-behaviour'
    WHEN 'C_0389' THEN 'demand-and-production'
    WHEN 'C_0390' THEN 'revenue-and-market-structure'
    WHEN 'C_0391' THEN 'macroeconomics-income-and-employment'
    WHEN 'C_0392' THEN 'money-and-banking'
    WHEN 'C_0393' THEN 'macro-policy-and-external-sector'
    WHEN 'C_0394' THEN 'computer-system-and-hardware-fundamentals'
    WHEN 'C_0395' THEN 'operating-systems-and-software-concepts'
    WHEN 'C_0396' THEN 'office-automation-tools'
    WHEN 'C_0397' THEN 'software-engineering-and-problem-solving'
    WHEN 'C_0398' THEN 'python-programming-fundamentals'
    WHEN 'C_0399' THEN 'object-oriented-programming-cpp'
    WHEN 'C_0400' THEN 'data-structures-through-cpp'
    WHEN 'C_0401' THEN 'database-management-system-dbms-and-sql'
    WHEN 'C_0402' THEN 'computer-networks-and-internet'
    WHEN 'C_0403' THEN 'web-designing-using-html'
    WHEN 'C_0404' THEN 'cyber-security-ethics-and-emerging-trends'
    WHEN 'C_0405' THEN 'pedagogy-computer-science'
    WHEN 'C_0406' THEN 'sangya'
    WHEN 'C_0407' THEN 'sandheh-sutrani'
    WHEN 'C_0408' THEN 'samasah'
    WHEN 'C_0409' THEN 'pratyayanam'
    WHEN 'C_0410' THEN 'vyayapad'
    WHEN 'C_0411' THEN 'karakprakaranam'
    WHEN 'C_0412' THEN 'chhandansi'
    WHEN 'C_0413' THEN 'alankarah'
    WHEN 'C_0414' THEN 'mahakavayah'
    WHEN 'C_0415' THEN 'gadyakavyakavayah'
    WHEN 'C_0416' THEN 'neetikavayah'
    WHEN 'C_0417' THEN 'kavyashastrakarah'
    WHEN 'C_0418' THEN 'adhuniksanskritkavayah'
    WHEN 'C_0419' THEN 'shadvedangani'
    WHEN 'C_0420' THEN 'upsargah'
    WHEN 'C_0421' THEN 'visheshanam'
    WHEN 'C_0422' THEN 'shabdgyan'
    WHEN 'C_0223' THEN 'mool-sangeet-gyan'
    WHEN 'C_0224' THEN 'vadya-parichay'
    WHEN 'C_0225' THEN 'taal-pranali'
    WHEN 'C_0226' THEN 'raag-tatva'
    WHEN 'C_0228' THEN 'raag-adhyayan'
    WHEN 'C_0229' THEN 'vadya-adhyayan'
    WHEN 'C_0230' THEN 'sangeetagya-parichay'
    WHEN 'C_0231' THEN 'sangeet-siddhant'
    WHEN 'C_0233' THEN 'raag-vigyan'
    WHEN 'C_0234' THEN 'gayan-shailiyan'
    WHEN 'C_0235' THEN 'shruti-siddhant'
    WHEN 'C_0236' THEN 'varn-siddhant'
    WHEN 'C_0240' THEN 'gharana-adhyayan'
    WHEN 'C_0241' THEN 'sangeet-granth'
    WHEN 'C_0242' THEN 'itihas'
    WHEN 'C_0243' THEN 'swarlipi'
  END
WHERE chapter_id IN ('C_0193','C_0194','C_0195','C_0196','C_0197','C_0198','C_0199','C_0200','C_0201','C_0203','C_0204','C_0205','C_0206','C_0207','C_0208','C_0209','C_0210','C_0211','C_0212','C_0213','C_0214','C_0215','C_0216','C_0217','C_0218','C_0219','C_0220','C_0221','C_0222','C_0245','C_0246','C_0247','C_0248','C_0249','C_0250','C_0251','C_0252','C_0253','C_0255','C_0256','C_0258','C_0259','C_0260','C_0271','C_0272','C_0273','C_0274','C_0275','C_0276','C_0277','C_0278','C_0279','C_0280','C_0281','C_0282','C_0283','C_0284','C_0285','C_0286','C_0287','C_0288','C_0289','C_0290','C_0291','C_0292','C_0293','C_0294','C_0295','C_0296','C_0298','C_0299','C_0300','C_0302','C_0304','C_0305','C_0308','C_0309','C_0312','C_0313','C_0315','C_0317','C_0318','C_0320','C_0321','C_0329','C_0331','C_0334','C_0337','C_0338','C_0340','C_0343','C_0345','C_0346','C_0347','C_0349','C_0350','C_0353','C_0354','C_0356','C_0357','C_0361','C_0367','C_0368','C_0378','C_0380','C_0381','C_0383','C_0384','C_0385','C_0386','C_0387','C_0388','C_0389','C_0390','C_0391','C_0392','C_0393','C_0394','C_0395','C_0396','C_0397','C_0398','C_0399','C_0400','C_0401','C_0402','C_0403','C_0404','C_0405','C_0406','C_0407','C_0408','C_0409','C_0410','C_0411','C_0412','C_0413','C_0414','C_0415','C_0416','C_0417','C_0418','C_0419','C_0420','C_0421','C_0422','C_0223','C_0224','C_0225','C_0226','C_0228','C_0229','C_0230','C_0231','C_0233','C_0234','C_0235','C_0236','C_0240','C_0241','C_0242','C_0243') AND (ai_slug IS NULL OR ai_slug = '');
-- Rollback: UPDATE `clear-cutoff-435016.staging.s_chapter` SET ai_slug = NULL WHERE chapter_id IN ('C_0193','C_0194','C_0195','C_0196','C_0197','C_0198','C_0199','C_0200','C_0201','C_0203','C_0204','C_0205','C_0206','C_0207','C_0208','C_0209','C_0210','C_0211','C_0212','C_0213','C_0214','C_0215','C_0216','C_0217','C_0218','C_0219','C_0220','C_0221','C_0222','C_0245','C_0246','C_0247','C_0248','C_0249','C_0250','C_0251','C_0252','C_0253','C_0255','C_0256','C_0258','C_0259','C_0260','C_0271','C_0272','C_0273','C_0274','C_0275','C_0276','C_0277','C_0278','C_0279','C_0280','C_0281','C_0282','C_0283','C_0284','C_0285','C_0286','C_0287','C_0288','C_0289','C_0290','C_0291','C_0292','C_0293','C_0294','C_0295','C_0296','C_0298','C_0299','C_0300','C_0302','C_0304','C_0305','C_0308','C_0309','C_0312','C_0313','C_0315','C_0317','C_0318','C_0320','C_0321','C_0329','C_0331','C_0334','C_0337','C_0338','C_0340','C_0343','C_0345','C_0346','C_0347','C_0349','C_0350','C_0353','C_0354','C_0356','C_0357','C_0361','C_0367','C_0368','C_0378','C_0380','C_0381','C_0383','C_0384','C_0385','C_0386','C_0387','C_0388','C_0389','C_0390','C_0391','C_0392','C_0393','C_0394','C_0395','C_0396','C_0397','C_0398','C_0399','C_0400','C_0401','C_0402','C_0403','C_0404','C_0405','C_0406','C_0407','C_0408','C_0409','C_0410','C_0411','C_0412','C_0413','C_0414','C_0415','C_0416','C_0417','C_0418','C_0419','C_0420','C_0421','C_0422','C_0223','C_0224','C_0225','C_0226','C_0228','C_0229','C_0230','C_0231','C_0233','C_0234','C_0235','C_0236','C_0240','C_0241','C_0242','C_0243');
-- Navigation (staging.mapping_section_chapter) is a list column per row; add C_0187 to the HTET_PED row,
-- C_0137 to the HTET_CDP row and a HTET_MUS row with the music chapters when the data team next edits it.
-- Not urgent: the MySQL sync never deletes mapping rows.

-- ===== 6. GROUP B (psychology) - DECISION NEEDED, NOT RUN =====
-- 10 chapters (261,262,263,264,265,266,267,268,269,270), 347 questions. Their questions have section_id_b = 'HTET_PHY' (e_sections 17,
-- named Physics, slug physics) but the chapters are mapped to HTET_PSY (e_sections 28, psychology),
-- which no level lists (get-subject derives a level's subjects from question section_id_b).
-- A slug alone changes nothing: today their URLs 301 to /htet/level-1-prt/subject/physics.
-- Option 1 (correct data): retag those questions HTET_PHY -> HTET_PSY in BigQuery and re-sync; then
--   slug them (below) -> /htet/level-1-prt/subject/psychology/<slug>. Changes the physics subject page.
-- Option 2 (quick): also map them under HTET_PHY -> pages appear under /subject/physics/ (wrong label).
-- Slugs prepared for either option:
-- UPDATE s_chapters SET slug = CASE id
--   WHEN 261 THEN 'introduction-to-psychology'  -- C_0261, 27 q
--   WHEN 262 THEN 'methods-of-enquiry-in-psychology'  -- C_0262, 54 q
--   WHEN 263 THEN 'sensory-attentional-and-perceptual-processes'  -- C_0263, 24 q
--   WHEN 264 THEN 'learning-and-memory'  -- C_0264, 48 q
--   WHEN 265 THEN 'human-development-psychology'  -- C_0265, 13 q
--   WHEN 266 THEN 'thinking-and-language'  -- C_0266, 17 q
--   WHEN 267 THEN 'motivation-emotion-and-personality'  -- C_0267, 46 q
--   WHEN 268 THEN 'stress-and-health'  -- C_0268, 26 q
--   WHEN 269 THEN 'intelligence-and-individual-differences'  -- C_0269, 20 q
--   WHEN 270 THEN 'psychological-disorders-and-social-psychology'  -- C_0270, 72 q
--   END, updated_at = NOW() WHERE id IN (261,262,263,264,265,266,267,268,269,270) AND slug IS NULL;
