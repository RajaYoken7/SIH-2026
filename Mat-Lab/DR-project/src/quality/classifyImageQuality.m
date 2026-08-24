function result = classifyImageQuality(metrics, thresholds)
%CLASSIFYIMAGEQUALITY Classify an image using configurable quality rules.
%   RESULT = CLASSIFYIMAGEQUALITY(METRICS, THRESHOLDS) returns a struct
%   containing Label, Confidence, and Reasons.

if ~isstruct(metrics) || ~all(isfield(metrics, {'Brightness', 'Contrast', 'Sharpness'}))
    error('classifyImageQuality:InvalidMetrics', ...
        'Metrics must contain Brightness, Contrast, and Sharpness.');
end
if ~isstruct(thresholds) || ~all(isfield(thresholds, ...
        {'ForegroundBrightnessDarkMax', 'ContrastBlurryMax'}))
    error('classifyImageQuality:InvalidThresholds', ...
        'Thresholds must contain the configured prototype limits.');
end

if isfield(metrics, 'ForegroundBrightness')
    brightnessForDecision = metrics.ForegroundBrightness;
else
    brightnessForDecision = metrics.Brightness;
end

if brightnessForDecision < thresholds.ForegroundBrightnessDarkMax
    label = 'DARK';
    reasons = {sprintf('Foreground brightness %.2f is below %.2f.', ...
        brightnessForDecision, thresholds.ForegroundBrightnessDarkMax)};
    confidence = 0.80;
elseif metrics.Contrast < thresholds.ContrastBlurryMax
    label = 'BLURRY';
    reasons = {sprintf('Contrast %.2f is below %.2f.', ...
        metrics.Contrast, thresholds.ContrastBlurryMax)};
    confidence = 0.70;
else
    label = 'GOOD';
    reasons = {'Brightness and contrast passed the prototype thresholds.'};
    confidence = 0.60;
end

result = struct( ...
    'Label', label, ...
    'Confidence', confidence, ...
    'Reasons', {reasons});
end
