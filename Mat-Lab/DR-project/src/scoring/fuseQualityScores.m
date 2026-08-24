function result = fuseQualityScores(scores, weights)
%FUSEQUALITYSCORES Combine available component scores into one score.
%   RESULT = FUSEQUALITYSCORES(SCORES) computes a weighted mean of the
%   available 0-to-100 component scores. RESULT = FUSEQUALITYSCORES(SCORES,
%   WEIGHTS) accepts a struct of transparent component weights. Missing or
%   non-finite components are excluded and the remaining weights are
%   renormalized automatically. This is an engineering prototype score,
%   not a diagnosis or clinically validated quality measure.

componentNames = {'BrightnessIllumination', 'Contrast', 'BlurDetail', 'EdgeDetail'};
if ~isstruct(scores)
    error('fuseQualityScores:InvalidScores', 'Scores must be supplied as a struct.');
end
if nargin < 2 || isempty(weights)
    weights = struct('BrightnessIllumination', 0.30, 'Contrast', 0.20, ...
        'BlurDetail', 0.25, 'EdgeDetail', 0.25);
end
if ~isstruct(weights)
    error('fuseQualityScores:InvalidWeights', 'Weights must be supplied as a struct.');
end

availableNames = {};
availableValues = [];
configuredWeights = [];
unavailableNames = {};
for index = 1:numel(componentNames)
    componentName = componentNames{index};
    if ~isfield(scores, componentName) || ~isnumeric(scores.(componentName)) || ...
            ~isscalar(scores.(componentName)) || ~isfinite(scores.(componentName))
        unavailableNames{end + 1} = componentName;
        continue;
    end
    if ~isfield(weights, componentName) || ~isnumeric(weights.(componentName)) || ...
            ~isscalar(weights.(componentName)) || ~isfinite(weights.(componentName)) || ...
            weights.(componentName) < 0
        error('fuseQualityScores:InvalidWeight', ...
            'Each component weight must be a finite nonnegative scalar.');
    end
    availableNames{end + 1} = componentName;
    availableValues(end + 1) = scores.(componentName);
    configuredWeights(end + 1) = weights.(componentName);
end

weightTotal = sum(configuredWeights);
if isempty(availableValues) || weightTotal <= 0
    error('fuseQualityScores:NoAvailableScores', ...
        'At least one available component with positive weight is required.');
end

normalizedWeights = configuredWeights / weightTotal;
result = struct();
result.ComponentScores = scores;
result.AvailableSignals = availableNames;
result.UnavailableSignals = unavailableNames;
result.WeightsUsed = struct();
for index = 1:numel(availableNames)
    result.WeightsUsed.(availableNames{index}) = normalizedWeights(index);
end
result.OverallQualityScore = sum(availableValues .* normalizedWeights);
end
