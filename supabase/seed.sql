-- =====================================================================
-- ScoutBeyond Demo Seed Data (Tank Cleaning Challenge)
-- =====================================================================

-- 1. Insert Demo Problem Session
INSERT INTO public.problems (
    id,
    raw_input,
    statement,
    primary_scope,
    adjacent_scope,
    status,
    confidence_level,
    confidence_note,
    goals,
    constraints,
    assumptions,
    unknowns,
    search_dimensions
) VALUES (
    'demo-tank-cleaning',
    'What physical alternatives or complementary technologies exist to conventional spray cleaning for cleaning the interior of industrial tanks while reducing water and cycle time?',
    'How can tank cleaning be adapted to actual cleaning need while reducing water consumption and cleaning time?',
    'Industrial cleaning · manufacturing · tank operations',
    'Semiconductors, robotics, optics, process control, and surface science',
    'complete',
    'High',
    'The primary uncertainty is what actual residue adhesion and geometry exist across different production tanks.',
    '["Reduce water consumption by >50%", "Reduce wash cycle time", "Maintain hygienic and surface standards"]'::jsonb,
    '["Industrial manufacturing environment", "Prefer retrofit or compatibility with existing tank infrastructure"]'::jsonb,
    '["Cleaning intensity can be modulated based on actual contamination levels", "Rinse duration can be terminated dynamically"]'::jsonb,
    '["Specific residue viscosity and adhesion threshold", "Allowable acoustic/thermal stress on tank shell"]'::jsonb,
    '["Demand-modulated kinetic fluid impact", "In-situ contamination monitoring", "Closed-loop PLC process control", "Acoustic cavitation energy", "Anti-fouling surface texturing"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    statement = EXCLUDED.statement,
    status = EXCLUDED.status;

-- 2. Insert Candidates
INSERT INTO public.candidates (
    id, session_id, name, principle, category, summary, relevance, industries, physical_mechanisms, maturity_label, maturity_trl, overall_score, benefits, limitations, uncertainties, evidence_count, is_selected
) VALUES
(
    'cand-within-1',
    'demo-tank-cleaning',
    'Adaptive high-pressure jet cleaning',
    'Demand-modulated kinetic impingement',
    'established',
    'Adjusts nozzle pressure and flow dynamically to actual cleaning need rather than running a fixed-duration high-volume cycle.',
    'Direct drop-in or retrofit to conventional tank cleaning heads with instant water conservation.',
    '["Industrial manufacturing", "Chemical processing", "Food & beverage"]'::jsonb,
    '["Variable flow throttling", "Kinetic momentum transfer", "Dynamic nozzle sequencing"]'::jsonb,
    'Established industrial practice',
    8,
    88.5,
    '["Up to 82% water reduction", "Direct compatibility with existing wash tanks", "Fast cycle termination"]'::jsonb,
    '["Nozzle wear under high pressures", "Shadow zones in complex internal vessel baffles"]'::jsonb,
    '["Exact water savings dependent on residue tenacity"]'::jsonb,
    8,
    true
),
(
    'cand-within-2',
    'demo-tank-cleaning',
    'Adaptive cleaning control',
    'Closed-loop process termination based on optical & conductivity feedback',
    'established',
    'Continuously measures wash water effluent and terminates wash or rinse phases as soon as clean baseline is reached.',
    'Eliminates over-washing without changing tank structural geometry.',
    '["CIP systems", "Brewery & beverage", "Parts washing"]'::jsonb,
    '["Inline turbidity sensing", "Electrical conductivity thresholding", "PLC timer override"]'::jsonb,
    'Medium maturity / Proven in CIP',
    7,
    84.0,
    '["38-45% cycle time reduction", "Zero over-rinsing", "Automated compliance documentation"]'::jsonb,
    '["Requires analog sensor integration into legacy PLC", "Sensor window fouling"]'::jsonb,
    '["Reliability of sensor calibration across varied chemical cleaning agents"]'::jsonb,
    6,
    true
),
(
    'cand-within-3',
    'demo-tank-cleaning',
    'Continuous contamination monitoring',
    'In-situ fluorescence & optical residue detection',
    'established',
    'Uses UV-excited optical fluorescence to detect micro-gram organic and hydrocarbon residues in real time.',
    'Provides high-confidence verification that tank walls are clean before shutting down wash cycles.',
    '["Precision engineering", "Automotive components", "Industrial cleaning"]'::jsonb,
    '["UV-excited fluorescence", "Spectral signature matching"]'::jsonb,
    'Medium maturity',
    6,
    78.0,
    '["Sub-second detection of residue down to 5 mg/m²", "Non-destructive testing"]'::jsonb,
    '["Sensor line-of-sight required", "Steam and mist can scatter optical signals"]'::jsonb,
    '["Optical drift over 1000+ continuous operating hours"]'::jsonb,
    5,
    false
),
(
    'cand-within-4',
    'demo-tank-cleaning',
    'Optimized fluidic oscillator nozzles',
    'Self-oscillating fluidic swept-jet impingement',
    'established',
    'Employs no-moving-parts fluidic oscillators to generate high-energy oscillating sweeping jets across tank walls.',
    'Replaces static spray balls with dynamic sweeping spray with no mechanical wear parts.',
    '["Chemical tanks", "Railway tank cars", "Tank container cleaning"]'::jsonb,
    '["Coanda effect fluid oscillation", "Increased wall shear stress"]'::jsonb,
    'High maturity',
    9,
    81.0,
    '["No moving internal mechanical gears or seals", "3.2x higher wall shear stress", "Low maintenance"]'::jsonb,
    '["Requires constant minimum operating pressure", "Fixed spray envelope"]'::jsonb,
    '["Coverage overlap under fluctuating line pressure"]'::jsonb,
    7,
    false
),
(
    'cand-beyond-1',
    'demo-tank-cleaning',
    'Machine-vision contamination detection',
    'Multi-spectral spatial scanning transferred from semiconductor wafer inspection',
    'adjacent',
    'High-resolution multi-spectral cameras scan tank surfaces to identify localized fouling spots and direct spot-cleaning.',
    'Transfers high-speed optical inspection from cleanrooms to industrial tank washing to eliminate blind flood-washing.',
    '["Semiconductor wafer inspection", "Robotics & automated optical inspection (AOI)"]'::jsonb,
    '["Multi-spectral imaging", "Spatial classification algorithms", "Targeted actuator aiming"]'::jsonb,
    'Proven in adjacent industry (Semiconductors)',
    6,
    79.5,
    '["Directs fluid only where contamination is detected", "Complete photographic inspection record"]'::jsonb,
    '["Optical occlusion in deep crevices", "Requires IP68 washdown-rated optical housings"]'::jsonb,
    '["Camera lens fogging from hot water vapour"]'::jsonb,
    7,
    false
),
(
    'cand-beyond-2',
    'demo-tank-cleaning',
    'Model-predictive disturbance control',
    'Feedforward process disturbance rejection transferred from continuous chemical reactors',
    'adjacent',
    'Uses dynamic thermodynamic and fluid models to predict cleaning fluid temperature and chemical dosing curves.',
    'Optimizes cleaning efficiency by adapting to ambient conditions, tank fill levels, and residue age.',
    '["Chemical batch processing", "Continuous refining", "Power plant operations"]'::jsonb,
    '["State-space control models", "Dynamic parameter estimation", "Feedforward compensation"]'::jsonb,
    'Proven in process engineering',
    7,
    76.0,
    '["60% reduction in rinse overshoot", "Optimized chemical concentration saving 30% detergent"]'::jsonb,
    '["Requires rigorous upfront mathematical model calibration", "Software integration complexity"]'::jsonb,
    '["PLC computation limits on older industrial hardware"]'::jsonb,
    4,
    false
),
(
    'cand-beyond-3',
    'demo-tank-cleaning',
    'Oleophobic / hydrophobic surface coatings',
    'Biomimetic nanostructured surface texturing',
    'exploratory',
    'Applies durable low-surface-energy nanocoatings to interior tank walls to prevent residue adhesion at the molecular level.',
    'Reduces required wash pressure and water volume by 70% by minimizing initial residue bond strength.',
    '["Aerospace anti-icing", "Marine fouling release", "Biomedical implants"]'::jsonb,
    '["Nanostructured re-entrant surface texture", "Ultra-low surface energy (<15 mN/m)"]'::jsonb,
    'Emerging / Early industrial validation',
    4,
    71.0,
    '["Drastic reduction in cleaning energy and chemicals", "Passive continuous protection"]'::jsonb,
    '["Mechanical abrasion from slurry washing can degrade coatings", "Recollection/re-coating cost"]'::jsonb,
    '["Coating lifetime when exposed to concentrated CIP caustic wash (pH 12-14)"]'::jsonb,
    4,
    false
),
(
    'cand-beyond-4',
    'demo-tank-cleaning',
    'Acoustic cavitation / Ultrasonic cleaning',
    'Micro-jet cavitation collapse via immersed acoustic transducers',
    'adjacent',
    'Generates high-frequency pressure waves in liquid that form microscopic vacuum bubbles; bubble collapse releases localized micro-jets at >100 m/s.',
    'Proven in precision medical and electronics cleaning; transferable to localized tank sump and pipe junction cleaning.',
    '["Medical devices", "Precision optics", "Semiconductor tooling"]'::jsonb,
    '["Transient acoustic cavitation", "Shockwave erosion of boundary layers", "Acoustic streaming"]'::jsonb,
    'Established in precision cleaning · Adjacent to tank washing',
    8,
    83.0,
    '["90% water reduction in targeted zones", "Eliminates solvent and aggressive chemical usage", "Cleans complex micro-crevices"]'::jsonb,
    '["Requires liquid coupling medium", "Cavitation erosion risk on soft aluminum/plastic surfaces", "High electrical power draw"]'::jsonb,
    '["Acoustic attenuation in large tank volumes without immersed probe arrays"]'::jsonb,
    6,
    false
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    overall_score = EXCLUDED.overall_score;

-- 3. Insert Supporting Empirical Evidence & Sources
INSERT INTO public.sources (
    session_id, candidate_id, title, url, source_type, tier, publisher, metrics, snippet, credibility_score, empirical_density_score
) VALUES
(
    'demo-tank-cleaning',
    'cand-within-1',
    'Fraunhofer IVV: Resource-efficient pulsed jet cleaning for machinery parts',
    'https://www.fraunhofer.de/en/research/cleaning-technologies.html',
    'research_institution',
    'TIER_1_ACADEMIC',
    'Fraunhofer Institute for Process Engineering and Packaging IVV',
    '82% water reduction at 6 bar pressure; wash cycle shortened by 55 seconds',
    'Empirical study demonstrating demand-modulated jet velocity prevents over-washing once organic residue threshold is reached.',
    95,
    90
),
(
    'demo-tank-cleaning',
    'cand-within-1',
    'US Patent 9,876,543: Adaptive nozzle array with variable flow geometry',
    'https://patents.google.com/patent/US9876543B2/en',
    'patent',
    'TIER_1_PATENT',
    'US Patent & Trademark Office',
    'Dynamic throttle from 12 L/min down to 2.5 L/min in continuous closed loop',
    'Multi-stage valve switching modulates spray pattern and volumetric flow rate based on online turbidity feedback.',
    92,
    85
),
(
    'demo-tank-cleaning',
    'cand-within-1',
    'ScienceDirect: Empirical analysis of pressure impingement in industrial washing',
    'https://www.sciencedirect.com/science/article/pii/S0301679X2200189X',
    'research_paper',
    'TIER_1_ACADEMIC',
    'Elsevier / Journal of Cleaner Production',
    'Surface roughness maintained below 0.8 μm Ra without chemical surfactants',
    'High-pressure kinetic impact dislodges particulate matter significantly faster than thermal soaking, slashing wash duration.',
    94,
    80
),
(
    'demo-tank-cleaning',
    'cand-within-2',
    'IEEE Trans. Ind. Inf.: Closed-loop PLC timing optimization for CIP systems',
    'https://ieeexplore.ieee.org/document/8492019',
    'research_paper',
    'TIER_1_ACADEMIC',
    'IEEE Transactions on Industrial Informatics',
    '45% cycle time reduction, 38% effluent volume reduction',
    'Programmable logic controllers dynamically terminate rinse phases when optical transmittance reaches clean baseline.',
    93,
    85
),
(
    'demo-tank-cleaning',
    'cand-within-2',
    'VDI 2083: Cleanroom and precision component washing guidelines',
    'https://www.vdi.de/richtlinien/details/vdi-2083-blatt-92',
    'industry_source',
    'TIER_2_TECHNICAL_SPEC',
    'Association of German Engineers (VDI)',
    'Continuous conductivity sensing with 1.2% measurement uncertainty',
    'Technical standard validating conductivity cutoff points as a compliant measure for rinsing completeness in regulated industrial washing.',
    91,
    75
),
(
    'demo-tank-cleaning',
    'cand-beyond-1',
    'Robotics and CIM: Automated optical inspection for semiconductor wafer cleaning',
    'https://www.sciencedirect.com/science/article/pii/S073658452100045X',
    'research_paper',
    'TIER_1_ACADEMIC',
    'Elsevier Robotics and Computer-Integrated Manufacturing',
    'Multi-spectral imaging classifies residual flux vs oxidation in 220ms',
    'Cross-domain transfer from silicon fab inspection enables targeted localized cleaning rather than full-envelope batch wash.',
    90,
    80
),
(
    'demo-tank-cleaning',
    'cand-beyond-4',
    'Ultrasonics Sonochemistry: Megasonic agitation in precision instrument cleaning',
    'https://www.sciencedirect.com/science/article/pii/S135041772100092X',
    'research_paper',
    'TIER_1_ACADEMIC',
    'Elsevier Ultrasonics Sonochemistry',
    'Sub-micron particulate dislodgement at 40 kHz with 90% water reduction',
    'Cavitation bubble collapse generates localized micro-jets that remove tenacious biofilms without solvent reliance.',
    92,
    90
);

-- 4. Insert Comparison Matrix
INSERT INTO public.evaluations (session_id, candidate_id, criterion_name, score_pill, css_class, score_num, rationale, link_label) VALUES
('demo-tank-cleaning', 'cand-within-1', 'Problem fit', 'High', 'high', 5, 'Directly targets fluid kinetic impact on tank walls.', NULL),
('demo-tank-cleaning', 'cand-within-1', 'Water reduction potential', 'High', 'high', 5, 'Modulates flow down to 2.5 L/min.', '3 supporting evidences →'),
('demo-tank-cleaning', 'cand-within-1', 'Cleaning time', 'Medium–High', 'medium', 4, 'Cuts cycle by 55 seconds in empirical benchmarks.', NULL),
('demo-tank-cleaning', 'cand-within-1', 'Fit with existing equipment', 'High', 'high', 5, 'Integrates directly into standard spray ball piping mounts.', NULL),
('demo-tank-cleaning', 'cand-within-1', 'Technology maturity', 'High', 'high', 5, 'TRL 8: widely deployed in automated parts washing.', '3 evidences →'),
('demo-tank-cleaning', 'cand-within-2', 'Problem fit', 'High', 'high', 5, 'Eliminates over-rinsing by dynamically ending cycles.', NULL),
('demo-tank-cleaning', 'cand-within-2', 'Water reduction potential', 'High', 'high', 5, '38% effluent volume reduction measured in IEEE study.', '2 supporting evidences →'),
('demo-tank-cleaning', 'cand-within-2', 'Cleaning time', 'High', 'high', 5, '45% cycle time reduction via automatic cutoff.', NULL),
('demo-tank-cleaning', 'cand-within-2', 'Fit with existing equipment', 'Medium', 'medium', 3, 'Requires adding turbidity sensor probe to drain line.', NULL),
('demo-tank-cleaning', 'cand-within-2', 'Technology maturity', 'Medium', 'medium', 4, 'TRL 7: standard practice in food CIP, novel in parts washing.', '2 evidences →')
ON CONFLICT (session_id, candidate_id, criterion_name) DO UPDATE SET
    score_pill = EXCLUDED.score_pill,
    score_num = EXCLUDED.score_num;

-- 5. Insert Shortlist
INSERT INTO public.shortlists (session_id, candidate_id, rank, why_selected, main_uncertainty, next_investigations) VALUES
(
    'demo-tank-cleaning',
    'cand-within-1',
    1,
    'Strongest empirical evidence (82% water reduction at 6 bar), high TRL maturity (8), and minimal retrofit requirements.',
    'Actual savings under your operating conditions and specific residue tenacity.',
    '["Bench test dynamic nozzle throttling with target contamination sample", "Inspect existing pump duty cycle and valve actuation speed", "Measure pressure drop across internal spray manifold"]'::jsonb
),
(
    'demo-tank-cleaning',
    'cand-within-2',
    2,
    'Immediate 38-45% cycle time and effluent reduction by closing the control loop using drain turbidity and conductivity.',
    'Reliability of feedback optical signal under heavy foam or grease buildup.',
    '["Audit existing PLC controller for spare 4-20mA analog telemetry inputs", "Select washdown-rated optical turbidity sensor with wiper mechanism", "Pilot automatic cutoff threshold on one trial tank"]'::jsonb
)
ON CONFLICT (session_id, candidate_id) DO UPDATE SET
    why_selected = EXCLUDED.why_selected,
    main_uncertainty = EXCLUDED.main_uncertainty;
