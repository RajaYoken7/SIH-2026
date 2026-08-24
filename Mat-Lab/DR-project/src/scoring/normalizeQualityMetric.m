function score = normalizeQualityMetric(value, lowerBound, upperBound, invert)
%NORMALIZEQUALITYMETRIC Map a metric to a bounded 0-to-100 quality score.
%   SCORE = NORMALIZEQUALITYMETRIC(VALUE, LOWERBOUND, UPPERBOUND, INVERT)
%   linearly maps VALUE from the supplied prototype reference range to
%   0-to-100 and clamps out-of-range values. Set INVERT true when larger
%   metric values represent lower quality. Reference ranges are engineering
%   configuration, not clinical thresholds.

if ~isnumeric(value) || ~isscalar(value) || ~isfinite(value)
    error('normalizeQualityMetric:InvalidValue', ...
        'Value must be a finite numeric scalar.');
end
if ~isnumeric(lowerBound) || ~isscalar(lowerBound) || ...
        ~isnumeric(upperBound) || ~isscalar(upperBound) || ...
        ~isfinite(lowerBound) || ~isfinite(upperBound) || lowerBound >= upperBound
    error('normalizeQualityMetric:InvalidBounds', ...
        'Bounds must be finite scalars with lowerBound less than upperBound.');
end
if nargin < 4
    invert = false;
end
if ~islogical(invert) || ~isscalar(invert)
    error('normalizeQualityMetric:InvalidInversion', ...
        'Invert must be a logical scalar.');
end

normalizedValue = (double(value) - double(lowerBound)) / ...
    (double(upperBound) - double(lowerBound));
if invert
    normalizedValue = 1 - normalizedValue;
end
score = 100 * min(max(normalizedValue, 0), 1);
end
