function thresholds = qualityThresholds()
%QUALITYTHRESHOLDS Return prototype thresholds for Phase 1 classification.
%   These values are calibrated only against the three bundled examples.
%   They are not medically validated and must be re-evaluated on a larger,
%   representative dataset before clinical or operational use.

thresholds = struct();
thresholds.ForegroundBrightnessDarkMax = 90;
thresholds.ContrastBlurryMax = 54;
thresholds.Metadata = struct( ...
    'Type', 'Prototype heuristic', ...
    'CalibrationSamples', 3, ...
    'MedicallyValidated', false);
end
