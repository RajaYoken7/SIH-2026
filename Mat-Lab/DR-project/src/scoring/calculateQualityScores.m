function scores = calculateQualityScores(metrics, referenceRanges)
%CALCULATEQUALITYSCORES Convert quality signals into 0-to-100 scores.
%   SCORES = CALCULATEQUALITYSCORES(METRICS) converts available pipeline
%   signals into interpretable component scores where higher is better.
%   SCORES = CALCULATEQUALITYSCORES(METRICS, REFERENCERANGES) allows the
%   engineering reference ranges to be supplied explicitly.
%
%   The ranges below are prototype reference ranges only. They are not
%   production thresholds, medical criteria, or clinically validated.

if ~isstruct(metrics)
    error('calculateQualityScores:InvalidMetrics', ...
        'Metrics must be supplied as a struct.');
end
if nargin < 2 || isempty(referenceRanges)
    referenceRanges = defaultReferenceRanges();
end
if ~isstruct(referenceRanges)
    error('calculateQualityScores:InvalidReferenceRanges', ...
        'Reference ranges must be supplied as a struct.');
end

scores = struct();
scores.ReferenceRanges = referenceRanges;
scores.BrightnessIllumination = NaN;
scores.Contrast = NaN;
scores.BlurDetail = NaN;
scores.EdgeDetail = NaN;
scores.UnavailableSignals = {};

if hasFiniteScalar(metrics, 'MeanBrightness') && ...
    hasFiniteScalar(metrics, 'IlluminationUniformity')
    brightnessScore = normalizeQualityMetric(metrics.MeanBrightness, ...
        referenceRanges.MeanBrightness(1), referenceRanges.MeanBrightness(2));
    uniformityScore = normalizeQualityMetric(metrics.IlluminationUniformity, ...
        referenceRanges.IlluminationUniformity(1), ...
        referenceRanges.IlluminationUniformity(2));
    scores.BrightnessIllumination = mean([brightnessScore, uniformityScore]);
else
    scores.UnavailableSignals{end + 1} = 'BrightnessIllumination';
end

if hasFiniteScalar(metrics, 'Contrast')
    scores.Contrast = normalizeQualityMetric(metrics.Contrast, ...
        referenceRanges.Contrast(1), referenceRanges.Contrast(2));
else
    scores.UnavailableSignals{end + 1} = 'Contrast';
end

if hasFiniteScalar(metrics, 'BlurScore')
    scores.BlurDetail = normalizeQualityMetric(metrics.BlurScore, ...
        referenceRanges.BlurScore(1), referenceRanges.BlurScore(2));
else
    scores.UnavailableSignals{end + 1} = 'BlurDetail';
end

if hasFiniteScalar(metrics, 'EdgeDensity')
    scores.EdgeDetail = normalizeQualityMetric(metrics.EdgeDensity, ...
        referenceRanges.EdgeDensity(1), referenceRanges.EdgeDensity(2));
else
    scores.UnavailableSignals{end + 1} = 'EdgeDetail';
end
end

function available = hasFiniteScalar(metrics, fieldName)
available = isfield(metrics, fieldName) && isnumeric(metrics.(fieldName)) && ...
    isscalar(metrics.(fieldName)) && isfinite(metrics.(fieldName));
end

function ranges = defaultReferenceRanges()
ranges = struct();
ranges.MeanBrightness = [0.10, 0.60];
ranges.IlluminationUniformity = [0.60, 0.90];
ranges.Contrast = [20, 90];
ranges.BlurScore = [0.00005, 0.00200];
ranges.EdgeDensity = [0.01, 0.25];
end
